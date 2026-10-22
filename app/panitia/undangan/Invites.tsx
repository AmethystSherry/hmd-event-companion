"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  CaretLeft,
  Check,
  Copy,
  FileText,
  Info,
  PaperPlaneTilt,
  UploadSimple,
  WarningCircle,
} from "@/components/icons";
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  CardLabel,
  IconButton,
  Screen,
  ScreenHeader,
  Segmented,
  Toast,
} from "@/components/ui";
import { copyText } from "@/lib/clipboard";
import { cx } from "@/lib/cx";
import { fillTemplate, INVITE_TEMPLATE, REMINDER_TEMPLATE, waLink } from "@/lib/invite";
import { importCsvAction, markSentAction, type ImportView } from "./actions";
import styles from "./undangan.module.css";

export type Recipient = {
  id: string;
  name: string;
  firstName: string;
  wa: string | null;
  rsvp: "belum" | "hadir" | "tidak";
  inviteSent: boolean;
  reminderSent: boolean;
  link: string;
};

type Mode = "undangan" | "pengingat";

export function Invites({
  initialMode,
  recipients,
  initialImport,
}: {
  initialMode: Mode;
  recipients: Recipient[];
  initialImport: ImportView;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [imp, setImp] = useState<ImportView>(initialImport);
  const [importError, setImportError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const reminder = mode === "pengingat";
  const template = reminder ? REMINDER_TEMPLATE : INVITE_TEMPLATE;
  const list = reminder ? recipients.filter((r) => r.rsvp === "hadir") : recipients;
  const isSent = (r: Recipient) => (reminder ? r.reminderSent : r.inviteSent);
  const hasErrors = !reminder && imp.errors.length > 0;

  const toastSeq = useRef(0);
  const flash = (text: string) => setToast({ key: ++toastSeq.current, text });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  function switchMode(next: Mode) {
    setMode(next);
    router.replace(
      next === "pengingat" ? "/panitia/undangan?mode=pengingat" : "/panitia/undangan",
      {
        scroll: false,
      },
    );
  }

  function markSent(ids: string[]) {
    startTransition(async () => {
      await markSentAction(ids, reminder ? "reminder" : "invite");
      router.refresh();
    });
  }

  async function onCopy(r: Recipient) {
    const ok = await copyText(fillTemplate(template, { nama: r.firstName, link: r.link }));
    if (ok) {
      flash(`Pesan buat ${r.firstName} tersalin · tempel di DM IG`);
      markSent([r.id]);
    } else flash("Gagal menyalin. Coba lagi ya.");
  }

  async function onCopyAll() {
    const lines = list.map((r) => `${r.name}: ${r.link}`).join("\n");
    const ok = await copyText(lines);
    flash(ok ? `${list.length} link tersalin` : "Gagal menyalin. Coba lagi ya.");
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    setImportError(null);
    startTransition(async () => {
      try {
        const res = await importCsvAction(form);
        if ("error" in res) setImportError(res.error);
        else {
          setImp(res);
          router.refresh();
        }
      } catch {
        setImportError("Gagal unggah, sinyalnya lemah. Coba lagi ya.");
      }
    });
  }

  const sentCount = recipients.filter((r) => r.inviteSent).length;
  const confirmed = recipients.filter((r) => r.rsvp === "hadir");
  const viaWa = confirmed.filter((r) => r.wa).length;

  const bottom = hasErrors ? (
    <Button icon={<UploadSimple />} onClick={() => fileInput.current?.click()} disabled={pending}>
      Unggah ulang CSV
    </Button>
  ) : (
    <Button icon={<Copy />} onClick={onCopyAll} disabled={list.length === 0}>
      Salin semua link
    </Button>
  );

  return (
    <Screen withBack bottom={bottom}>
      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={onPickFile}
        aria-label="Pilih file CSV"
      />
      <ScreenHeader
        leading={<IconButton href="/panitia/tamu" label="Kembali" icon={<CaretLeft />} />}
        eyebrow={
          reminder
            ? `Sabtu, 7 Nov · ${confirmed.length} tamu konfirmasi`
            : `${recipients.length} tamu · ${sentCount} terkirim`
        }
        title={reminder ? "Kirim pengingat H-1" : "Kirim undangan"}
      />
      <Segmented
        label="Jenis pesan"
        value={mode}
        onChange={switchMode}
        options={[
          { value: "undangan", label: "Undangan" },
          { value: "pengingat", label: "Pengingat H-1" },
        ]}
      />

      {reminder ? (
        <div className={styles.fileCard}>
          <span className={styles.fileIcon}>
            <FileText size={20} />
          </span>
          <span className={styles.fileText}>
            <span className="t-body-emph">{confirmed.length} tamu yang konfirmasi hadir</span>
            <span className="t-label c-label-2">
              {viaWa} lewat WA · {confirmed.length - viaWa} lewat DM IG
            </span>
          </span>
          <span className={styles.statusOk}>
            <Check size={14} />
          </span>
        </div>
      ) : (
        <button
          type="button"
          className={styles.fileCard}
          onClick={() => fileInput.current?.click()}
          disabled={pending}
          aria-label={`Ganti file CSV, sekarang ${imp.fileName}`}
        >
          <span className={styles.fileIcon}>
            <FileText size={20} />
          </span>
          <span className={styles.fileText}>
            <span className="t-body-emph">{pending ? "Mengunggah…" : imp.fileName}</span>
            <span className={cx("t-label", hasErrors ? styles.warnText : "c-label-2")}>
              {imp.summary}
            </span>
          </span>
          <span className={hasErrors ? styles.statusWarn : styles.statusOk}>
            {hasErrors ? <WarningCircle size={14} /> : <Check size={14} />}
          </span>
        </button>
      )}

      {importError && (
        <Banner tone="danger" icon={<WarningCircle />} title="CSV belum masuk">
          {importError}
        </Banner>
      )}

      {hasErrors ? (
        <>
          <Card className={styles.errorCard}>
            <div className={styles.errorHead}>
              <WarningCircle size={20} className={styles.warnText} />
              <span className="t-headline">{imp.errors.length} baris perlu dicek</span>
            </div>
            {imp.errors.map((e) => (
              <div key={e.line} className={styles.errorRow}>
                <span className={cx("t-code", styles.lineChip)}>Baris {e.line}</span>
                <span className={styles.fileText}>
                  <span className="t-body-emph">{e.kind}</span>
                  <span className="t-label c-label-2">{e.detail}</span>
                </span>
              </div>
            ))}
          </Card>
          {imp.okCount > 0 && (
            <Banner tone="neutral" icon={<Info />} title={`${imp.okCount} baris lain aman`}>
              Bisa lanjut kirim ke {imp.okCount} tamu dulu, {imp.errors.length} baris ini diperbaiki
              nanti.
            </Banner>
          )}
        </>
      ) : (
        <>
          <Card className={styles.templateCard}>
            <CardLabel>Template pesan</CardLabel>
            <p className="t-body">{template}</p>
          </Card>
          <Card className={styles.list}>
            {list.map((r) => (
              <div key={r.id} className={styles.row}>
                <Avatar name={r.name} size={36} />
                <span className={styles.fileText}>
                  <span className="t-body-emph">{r.name}</span>
                  {!r.wa && !isSent(r) && (
                    <span className="t-label c-label-2">Tanpa WA · kirim lewat DM IG</span>
                  )}
                </span>
                {isSent(r) ? (
                  <Badge tone="success">Terkirim</Badge>
                ) : r.wa ? (
                  <a
                    className={cx(styles.small, styles.smallPrimary)}
                    href={waLink(r.wa, fillTemplate(template, { nama: r.firstName, link: r.link }))}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markSent([r.id])}
                  >
                    <PaperPlaneTilt size={14} />
                    {reminder ? "Kirim H-1" : "Kirim WA"}
                  </a>
                ) : (
                  <button
                    type="button"
                    className={cx(styles.small, styles.smallSecondary)}
                    onClick={() => onCopy(r)}
                  >
                    <Copy size={14} />
                    Salin link
                  </button>
                )}
              </div>
            ))}
            {list.length === 0 && (
              <p className={cx("t-label c-label-2", styles.empty)}>
                {reminder
                  ? "Belum ada tamu yang konfirmasi hadir."
                  : "Belum ada tamu. Unggah CSV dulu."}
              </p>
            )}
          </Card>
        </>
      )}

      {toast && (
        <div className={styles.toastWrap} key={toast.key}>
          <Toast icon={<Check />}>{toast.text}</Toast>
        </div>
      )}
    </Screen>
  );
}
