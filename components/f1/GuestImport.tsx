"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  CaretLeft,
  Check,
  CloudArrowUp,
  DownloadSimple,
  FileText,
  Info,
  UploadSimple,
  WarningCircle,
} from "@/components/icons";
import {
  Badge,
  Banner,
  Button,
  Card,
  CardLabel,
  Dropzone,
  IconButton,
  Screen,
  ScreenHeader,
} from "@/components/ui";
import type { FormResult } from "@/app/panitia/actions";
import { commonMessage, csvSummary, parseGuestCsv, type CsvResult } from "@/lib/csv";
import { cx } from "@/lib/cx";
import { DEFAULT_DM_TEMPLATE } from "@/lib/invite";
import f1 from "./f1.module.css";
import styles from "./panitia.module.css";

type Parsed = Extract<CsvResult, { ok: true }>;

const COLUMNS = [
  { code: "nama", desc: "Nama tamu", required: true },
  { code: "ig", desc: "Username Instagram, buat buka DM", required: true },
  { code: "pesan", desc: "Template DM, boleh kosong", required: false },
  { code: "wa", desc: "Nomor WA, boleh kosong (tamu isi sendiri pas konfirmasi)", required: false },
];

// P04k belum ada tamu → pilih CSV → P04a cek & simpan (sekali) · P04c ada baris error.
// CSV dibaca di HP panitia dulu; baru tersimpan setelah "Simpan". Batal → tidak tersimpan.
export function GuestImport({
  eventId,
  eventName,
  save,
  initialFile = null,
}: {
  eventId: string;
  eventName: string;
  save?: (eventId: string, fileName: string, text: string) => Promise<FormResult>;
  initialFile?: { name: string; text: string } | null;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState(initialFile);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const parsed = file ? parseGuestCsv(file.text) : null;

  const pick = () => input.current?.click();
  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const text = await f.text();
    const r = parseGuestCsv(text);
    setError(r.ok ? null : r.message);
    setFile(r.ok ? { name: f.name, text } : null);
    if (input.current) input.current.value = "";
  };
  const submit = () => {
    if (!save || !file) return;
    start(async () => {
      const res = await save(eventId, file.name, file.text);
      if (!res.ok) return setError(res.error);
      router.refresh();
    });
  };

  const picker = (
    <input
      ref={input}
      type="file"
      accept=".csv,text/csv"
      className={f1.hiddenInput}
      onChange={(e) => onFile(e.target.files?.[0])}
    />
  );
  const back = `/panitia/event/${eventId}`;

  if (!parsed?.ok) {
    return (
      <Screen withBack>
        {picker}
        <ScreenHeader
          leading={
            <div className={f1.topBar}>
              <IconButton href={back} label="Kembali ke Home event" icon={<CaretLeft />} />
              <Button size="sm" icon={<UploadSimple />} onClick={pick}>
                Unggah CSV
              </Button>
            </div>
          }
          eyebrow={`${eventName} · belum ada tamu`}
          title="Undang tamu"
        />
        {error && (
          <Banner tone="danger" icon={<WarningCircle />} title="CSV-nya belum kebaca">
            {error}
          </Banner>
        )}
        <Dropzone
          icon={<CloudArrowUp />}
          title="Belum ada daftar tamu"
          action={
            <Button size="sm" icon={<UploadSimple />} onClick={pick}>
              Pilih file CSV
            </Button>
          }
        >
          Unggah CSV sekali di awal. Setelah itu tamu ditambah atau diedit manual.
        </Dropzone>
        <Card>
          <CardLabel>Kolom yang dibutuhin</CardLabel>
          {COLUMNS.map((c) => (
            <div key={c.code} className={styles.colRow}>
              <span className={styles.code}>{c.code}</span>
              <span className="t-label">{c.desc}</span>
              {c.required ? (
                <Badge tone="crew">Wajib</Badge>
              ) : (
                <Badge tone="neutral">Opsional</Badge>
              )}
            </div>
          ))}
          <a href="/contoh-tamu.csv" download className={`t-label-emph ${styles.textLink}`}>
            <DownloadSimple size={16} />
            Unduh contoh CSV
          </a>
        </Card>
      </Screen>
    );
  }

  return (
    <CsvReview
      parsed={parsed}
      fileName={file!.name}
      error={error}
      pending={pending}
      onBack={() => {
        setFile(null);
        setError(null);
      }}
      onRepick={pick}
      onSave={submit}
      picker={picker}
    />
  );
}

function CsvReview({
  parsed,
  fileName,
  error,
  pending,
  onBack,
  onRepick,
  onSave,
  picker,
}: {
  parsed: Parsed;
  fileName: string;
  error: string | null;
  pending: boolean;
  onBack: () => void;
  onRepick: () => void;
  onSave: () => void;
  picker: React.ReactNode;
}) {
  const issues = parsed.issues;
  const template = commonMessage(parsed.valid);
  const { columns } = parsed;
  return (
    <Screen
      withBack
      bottomHeight={issues.length ? 118 : 54}
      bottom={
        issues.length ? (
          <>
            <Button disabled={pending || !parsed.valid.length} onClick={onSave}>
              Simpan {parsed.valid.length} tamu aman
            </Button>
            <Button variant="secondary" icon={<UploadSimple />} onClick={onRepick}>
              Unggah ulang CSV
            </Button>
          </>
        ) : (
          <Button disabled={pending} onClick={onSave}>
            Simpan daftar tamu
          </Button>
        )
      }
    >
      {picker}
      <ScreenHeader
        leading={<IconButton label="Batal, kembali" icon={<CaretLeft />} onClick={onBack} />}
        eyebrow={`${parsed.rows.length} baris kebaca · cek dulu sebelum disimpan`}
        title="Cek daftar tamu"
      />
      {error && (
        <Banner tone="danger" icon={<WarningCircle />} title="Belum tersimpan">
          {error}
        </Banner>
      )}
      <Banner tone="warning" icon={<Info />} title="CSV cuma bisa diunggah sekali.">
        Setelah disimpan, tambah atau edit tamu dilakukan manual biar status undangan nggak kereset.
      </Banner>
      <Card>
        <div className={styles.fileRow}>
          <span className={f1.iconBox}>
            <FileText size={20} />
          </span>
          <div className={styles.grow}>
            <p className="t-body-emph">{fileName}</p>
            <p className={cx("t-label", issues.length ? f1.danger : "c-label-2")}>
              {csvSummary(parsed)}
            </p>
          </div>
          <span className={cx(styles.checkCircle, issues.length > 0 && styles.warnCircle)}>
            {issues.length ? <WarningCircle size={16} /> : <Check size={16} />}
          </span>
        </div>
      </Card>

      {issues.length > 0 ? (
        <>
          <Card>
            <p className={`t-body-emph ${f1.rowTight}`}>
              <WarningCircle size={18} className={f1.danger} />
              {issues.length} baris perlu dicek
            </p>
            {issues.map((i) => (
              <div key={i.line} className={styles.issueRow}>
                <span className={`t-label c-label-2 ${styles.lineTag}`}>Baris {i.line}</span>
                <div className={f1.stack}>
                  <p className="t-body-emph">{i.title}</p>
                  <p className="t-label c-label-2">{i.detail}</p>
                </div>
              </div>
            ))}
          </Card>
          <Banner tone="neutral" icon={<Info />} title={`${parsed.valid.length} baris lain aman`}>
            Bisa lanjut simpan {parsed.valid.length} tamu dulu, {issues.length} baris ini diperbaiki
            nanti lewat Tambah tamu.
          </Banner>
        </>
      ) : (
        <>
          <Card>
            <CardLabel>Kolom yang kebaca</CardLabel>
            <ColStatus code="nama" desc={`${columns.nama} terisi`} />
            <ColStatus code="ig" desc={`${columns.ig} terisi · dipakai buat buka DM`} />
            <ColStatus
              code="pesan"
              desc={
                columns.pesan
                  ? `${columns.pesan} terisi · jadi template DM`
                  : "Template DM (opsional, kalau kosong pakai default)"
              }
            />
            <ColStatus
              code="wa"
              desc={
                columns.waEmpty
                  ? `${columns.waEmpty} kosong · nanti diisi tamu pas konfirmasi`
                  : "Semua terisi"
              }
            />
          </Card>
          <Card>
            <CardLabel>Template DM · {template ? 'dari kolom "pesan"' : "default"}</CardLabel>
            <p className={`t-body ${f1.template}`}>{template ?? DEFAULT_DM_TEMPLATE}</p>
            <p className="t-label c-label-3">{"{nama} dan {link} diisi otomatis per tamu"}</p>
          </Card>
        </>
      )}
    </Screen>
  );
}

function ColStatus({ code, desc }: { code: string; desc: string }) {
  return (
    <div className={styles.colStatus}>
      <span className={styles.checkCircle}>
        <Check size={14} />
      </span>
      <div className={f1.stack}>
        <p className="t-body-emph">{code}</p>
        <p className="t-label c-label-2">{desc}</p>
      </div>
    </div>
  );
}
