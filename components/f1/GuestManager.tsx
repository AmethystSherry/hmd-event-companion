"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowCounterClockwise,
  CaretLeft,
  Check,
  Copy,
  FileText,
  Info,
  PaperPlaneTilt,
  PencilSimple,
  UserPlus,
  WhatsappLogo,
} from "@/components/icons";
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardLabel,
  Chip,
  Field,
  IconButton,
  InnerBox,
  Screen,
  ScreenHeader,
  Segmented,
  Sheet,
  Toast,
} from "@/components/ui";
import type { FormResult, GuestForm } from "@/app/panitia/actions";
import { copyText } from "@/lib/clipboard";
import type { InviteSnapshot } from "@/lib/data/store";
import type { Guest, GuestStats, InviteStatus, Rsvp } from "@/lib/data/types";
import { firstName } from "@/lib/format";
import { fillTemplate, igDmUrl, REMINDER_TEMPLATE, waLink } from "@/lib/invite";
import f1 from "./f1.module.css";
import styles from "./panitia.module.css";

export type GuestRowData = {
  id: string;
  name: string;
  ig: string;
  wa: string | null; // 62…
  waDisplay: string; // "0812 3456 7890" atau ""
  inviteStatus: InviteStatus;
  invitedLabel: string | null; // "20 Okt"
  rsvp: Rsvp;
  reminderSent: boolean;
  source: Guest["source"];
  dmTemplate: string; // template DM yang berlaku untuk tamu ini
  link: string; // link undangan /t/{token}
  reminderLink: string; // link pengingat /t/{token}?dari=wa (T03h)
};

export type GuestActions = {
  markInvited: (guestId: string) => Promise<InviteSnapshot>;
  undoInvite: (guestId: string, prev: InviteSnapshot) => Promise<void>;
  addGuest: (eventId: string, input: GuestForm) => Promise<FormResult>;
  updateGuest: (guestId: string, input: GuestForm) => Promise<FormResult>;
  deleteGuest: (guestId: string) => Promise<FormResult>;
  markReminderSent: (guestId: string) => Promise<void>;
};

type Filter = "semua" | "belum" | "belumJawab" | "hadir" | "nggak";
type SheetState = { kind: "add" } | { kind: "edit"; id: string } | null;
type InviteToast = { guestId: string; ig: string; prev: InviteSnapshot; key: number };

const PENDING_KEY = "hmd:pending"; // aksi yang menunggu panitia balik dari IG/WA

// P04 Tamu & undangan · P04d balik dari IG (toast + Batalkan 5 dtk) · P04f tambah tamu ·
// P04e ubah/hapus tamu · P04b pengingat H-1 via WA (satu-satu / Kirim ke semua).
export function GuestManager({
  eventId,
  reminderDateLabel,
  templateFromCsv,
  dmTemplate,
  guests,
  stats,
  actions,
  initialTab = "undangan",
  initialFilter = "semua",
  initialSheet = null,
  initialToast = null,
  initialJustInvited = null,
}: {
  eventId: string;
  reminderDateLabel: string; // "Sabtu, 7 Nov"
  templateFromCsv: boolean;
  dmTemplate: string;
  guests: GuestRowData[];
  stats: GuestStats;
  actions?: GuestActions; // kosong = pratinjau
  initialTab?: "undangan" | "pengingat";
  initialFilter?: Filter;
  initialSheet?: SheetState;
  initialToast?: Omit<InviteToast, "key"> | null;
  initialJustInvited?: string | null;
}) {
  const [tab, setTab] = useState(initialTab);
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [sheet, setSheet] = useState<SheetState>(initialSheet);
  const [toast, setToast] = useState<InviteToast | null>(
    initialToast ? { ...initialToast, key: 0 } : null,
  );
  const [justInvited, setJustInvited] = useState<string | null>(initialJustInvited);
  const [sendAll, setSendAll] = useState(false);
  const [, start] = useTransition();

  // Simpan tab di URL supaya reload tetap di tab yang sama.
  const changeTab = (t: typeof tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    if (t === "pengingat") url.searchParams.set("tab", "pengingat");
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url);
  };

  // ---- Balik dari IG / WA (visibilitychange) ----
  const guestsRef = useRef(guests);
  const sendAllRef = useRef(sendAll);
  useEffect(() => {
    guestsRef.current = guests;
    sendAllRef.current = sendAll;
  });

  const reminderQueue = guests.filter((g) => g.rsvp === "hadir" && g.wa && !g.reminderSent);

  const openWa = useCallback((g: GuestRowData) => {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ kind: "wa", id: g.id }));
    const msg = fillTemplate(REMINDER_TEMPLATE, { nama: firstName(g.name), link: g.reminderLink });
    return window.open(waLink(g.wa!, msg), "_blank", "noopener");
  }, []);

  useEffect(() => {
    if (!actions) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PENDING_KEY);
      const pending = JSON.parse(raw) as { kind: "ig" | "wa"; id: string };
      const g = guestsRef.current.find((x) => x.id === pending.id);
      if (!g) return;
      if (pending.kind === "ig") {
        start(async () => {
          const prev = await actions.markInvited(g.id);
          setJustInvited(g.id);
          setToast({ guestId: g.id, ig: g.ig, prev, key: Date.now() });
        });
      } else {
        start(async () => {
          await actions.markReminderSent(g.id);
          // "Kirim ke semua": lanjut otomatis ke tamu berikutnya. Kalau browser memblokir
          // jendela baru, tombol bawah berubah jadi "Lanjut kirim" (satu tap per tamu).
          if (sendAllRef.current) {
            const next = guestsRef.current.find(
              (x) => x.id !== g.id && x.rsvp === "hadir" && x.wa && !x.reminderSent,
            );
            if (!next) setSendAll(false);
            else openWa(next);
          }
        });
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [actions, openWa]);

  const invite = (g: GuestRowData) => {
    const msg = fillTemplate(g.dmTemplate, { nama: firstName(g.name), link: g.link });
    void copyText(msg);
    if (!actions) return;
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ kind: "ig", id: g.id }));
    window.open(igDmUrl(g.ig), "_blank", "noopener");
  };

  const editing = sheet?.kind === "edit" ? guests.find((g) => g.id === sheet.id) : undefined;

  const counts: Record<Filter, number> = {
    semua: stats.total,
    belum: stats.notInvited,
    belumJawab: stats.belumJawab,
    hadir: stats.hadir,
    nggak: stats.nggak,
  };
  const visible = guests.filter((g) => {
    if (filter === "belum") return g.inviteStatus === "belum";
    if (filter === "belumJawab") return g.inviteStatus === "diundang" && g.rsvp === "belum";
    if (filter === "hadir") return g.rsvp === "hadir";
    if (filter === "nggak") return g.rsvp === "nggak";
    return true;
  });

  const segmented = (
    <Segmented
      label="Tampilan"
      value={tab}
      onChange={changeTab}
      options={[
        { value: "undangan", label: "Undangan" },
        { value: "pengingat", label: "Pengingat H-1" },
      ]}
    />
  );
  const back = (
    <IconButton
      href={`/panitia/event/${eventId}`}
      label="Kembali ke Home event"
      icon={<CaretLeft />}
    />
  );

  if (tab === "pengingat") {
    const hadir = guests.filter((g) => g.rsvp === "hadir");
    return (
      <Screen
        withBack
        bottomHeight={82}
        bottom={
          <>
            <p className={`t-label c-label-2 ${styles.waNote}`}>
              WA kebuka satu per satu, otomatis lanjut ke tamu berikutnya
            </p>
            <Button
              disabled={reminderQueue.length === 0}
              onClick={() => {
                if (!actions || !reminderQueue[0]) return;
                setSendAll(true);
                openWa(reminderQueue[0]);
              }}
            >
              {reminderQueue.length === 0
                ? "Semua udah dikirimi"
                : `${sendAll ? "Lanjut kirim" : "Kirim ke semua"} · ${reminderQueue.length} belum`}
            </Button>
          </>
        }
      >
        <ScreenHeader
          leading={back}
          eyebrow={`${reminderDateLabel} · ${hadir.length} tamu konfirmasi`}
          title="Kirim pengingat H-1"
        />
        {segmented}
        <Card>
          <div className={styles.fileRow}>
            <span className={f1.iconBox}>
              <FileText size={20} />
            </span>
            <div className={styles.grow}>
              <p className="t-body-emph">{hadir.length} tamu yang konfirmasi hadir</p>
              <p className="t-label c-label-2">
                Semua lewat WhatsApp · nomor diisi tamu pas konfirmasi
              </p>
            </div>
            <span className={styles.checkCircle}>
              <Check size={16} />
            </span>
          </div>
        </Card>
        <Card>
          <CardLabel>Template pesan</CardLabel>
          <p className={`t-body ${f1.template}`}>{REMINDER_TEMPLATE}</p>
        </Card>
        {hadir.length > 0 && (
          <Card inset>
            {hadir.map((g) => (
              <div key={g.id} className={styles.guestRow}>
                <Avatar name={g.name} />
                <div className={styles.guestMain}>
                  <p className="t-body-emph">{g.name}</p>
                  {g.waDisplay && <p className="t-label c-label-2">{g.waDisplay}</p>}
                </div>
                {g.reminderSent ? (
                  <Badge tone="success">Terkirim</Badge>
                ) : (
                  <Button
                    size="sm"
                    icon={<WhatsappLogo />}
                    disabled={!g.wa}
                    onClick={() => actions && openWa(g)}
                  >
                    Kirim WA
                  </Button>
                )}
              </div>
            ))}
          </Card>
        )}
      </Screen>
    );
  }

  return (
    <Screen withBack>
      <ScreenHeader
        leading={
          <div className={f1.topBar}>
            {back}
            <Button
              size="sm"
              variant="secondary"
              icon={<UserPlus />}
              onClick={() => setSheet({ kind: "add" })}
            >
              Tambah tamu
            </Button>
          </div>
        }
        eyebrow={`${stats.total} tamu · ${stats.invited} diundang · ${stats.answered} udah jawab`}
        title="Undang tamu"
      />
      {segmented}
      <Card>
        <div className={f1.statRow}>
          <div>
            <p className="t-number-m tabular">
              {stats.invited}/{stats.total}
            </p>
            <p className="t-label c-label-2">Diundang</p>
          </div>
          <div>
            <p className={`t-number-m tabular ${f1.green}`}>{stats.hadir}</p>
            <p className="t-label c-label-2">Hadir</p>
          </div>
          <div>
            <p className={`t-number-m tabular ${f1.danger}`}>{stats.nggak}</p>
            <p className="t-label c-label-2">Nggak bisa</p>
          </div>
          <div>
            <p className={`t-number-m tabular ${styles.amber}`}>{stats.belumJawab}</p>
            <p className="t-label c-label-2">Belum jawab</p>
          </div>
        </div>
      </Card>
      <Card>
        <CardLabel>Template DM · {templateFromCsv ? "dari CSV" : "default"}</CardLabel>
        <p className={`t-body ${f1.template}`}>{dmTemplate}</p>
        <p className={`t-label c-label-2 ${f1.rowTight}`}>
          <Copy size={14} />
          Otomatis disalin pas kamu tap ✈ di baris tamu
        </p>
      </Card>
      <div className={f1.chips} role="group" aria-label="Filter tamu">
        {(
          [
            ["semua", "Semua"],
            ["belum", "Belum diundang"],
            ["belumJawab", "Belum jawab"],
            ["hadir", "Hadir"],
            ["nggak", "Nggak bisa"],
          ] as const
        ).map(([value, label]) => (
          <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>
            {label} {counts[value]}
          </Chip>
        ))}
      </div>
      <Card inset>
        {visible.length === 0 ? (
          <p className={`t-label c-label-2 ${styles.guestRow}`}>Belum ada tamu di filter ini.</p>
        ) : (
          visible.map((g) => (
            <div key={g.id} className={styles.guestRow}>
              <Avatar name={g.name} />
              <div className={styles.guestMain}>
                <p className={styles.guestName}>
                  <span className="t-body-emph">{g.name}</span>
                  <span className="t-label c-label-2">@{g.ig}</span>
                </p>
                <div className={styles.badges}>
                  {g.inviteStatus === "diundang" ? (
                    justInvited === g.id ? (
                      <Badge tone="success">Diundang barusan</Badge>
                    ) : (
                      <Badge tone="neutral">Diundang</Badge>
                    )
                  ) : (
                    <Badge tone="neutral">Belum diundang</Badge>
                  )}
                  {g.rsvp === "hadir" && <Badge tone="success">Hadir</Badge>}
                  {g.rsvp === "nggak" && <Badge tone="danger">Nggak bisa</Badge>}
                  {g.inviteStatus === "diundang" && g.rsvp === "belum" && (
                    <Badge tone="crew">Belum jawab</Badge>
                  )}
                </div>
              </div>
              <div className={f1.rowTight}>
                <Button
                  size="sm"
                  variant="secondary"
                  iconOnly
                  label={`Ubah ${g.name}`}
                  icon={<PencilSimple />}
                  onClick={() => setSheet({ kind: "edit", id: g.id })}
                />
                {g.inviteStatus === "belum" ? (
                  <Button
                    size="sm"
                    iconOnly
                    label={`Undang ${g.name} lewat DM IG`}
                    icon={<PaperPlaneTilt />}
                    onClick={() => invite(g)}
                  />
                ) : (
                  <Button
                    size="sm"
                    variant="secondary"
                    iconOnly
                    label={`Undang ${g.name} lagi`}
                    icon={<ArrowCounterClockwise />}
                    onClick={() => invite(g)}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </Card>

      {toast && (
        <div className={f1.toastDock}>
          <Toast
            key={toast.key}
            icon={<Check />}
            undo={{
              onUndo: () => {
                const t = toast;
                setToast(null);
                setJustInvited(null);
                if (actions) start(() => actions.undoInvite(t.guestId, t.prev));
              },
              onExpire: () => setToast(null),
            }}
          >
            <span className={f1.stack}>
              <span>DM ke @{toast.ig} ditandai terkirim</span>
              <span className={styles.toastSub}>Template udah disalin, tinggal tempel di IG</span>
            </span>
          </Toast>
        </div>
      )}

      <GuestSheet
        key={sheet ? (sheet.kind === "edit" ? sheet.id : "add") : "closed"}
        open={sheet !== null}
        guest={editing}
        onClose={() => setSheet(null)}
        submit={(input) =>
          editing ? actions?.updateGuest(editing.id, input) : actions?.addGuest(eventId, input)
        }
        remove={editing && actions ? () => actions.deleteGuest(editing.id) : undefined}
      />
    </Screen>
  );
}

// P04f tambah tamu manual · P04e ubah / hapus tamu.
function GuestSheet({
  open,
  guest,
  onClose,
  submit,
  remove,
}: {
  open: boolean;
  guest?: GuestRowData;
  onClose: () => void;
  submit: (input: GuestForm) => Promise<FormResult> | undefined;
  remove?: () => Promise<FormResult>;
}) {
  const [form, setForm] = useState<GuestForm>({
    name: guest?.name ?? "",
    ig: guest ? `@${guest.ig}` : "",
    wa: guest?.waDisplay ?? "",
  });
  const [error, setError] = useState<{ field?: string; error: string } | null>(null);
  const [pending, start] = useTransition();
  const ready = form.name.trim() && form.ig.replace("@", "").trim();

  const run = (fn: () => Promise<FormResult> | undefined) =>
    start(async () => {
      const res = await fn();
      if (!res) return;
      if (res.ok) onClose();
      else setError(res);
    });
  const fieldError = (f: string) => (error?.field === f ? error.error : undefined);

  return (
    <Sheet open={open} onClose={onClose} title={guest ? "Ubah tamu" : "Tambah tamu"}>
      <div className={f1.sheetBody}>
        <div className={f1.sheetHead}>
          <p className="t-card-title">{guest ? "Ubah tamu" : "Tambah tamu"}</p>
          <p className="t-label c-label-2">
            {guest
              ? `${guest.name} · ${guest.source === "csv" ? "baris dari CSV" : guest.source === "walkin" ? "walk-in di pintu" : "ditambah manual"}`
              : "Ditambah manual, CSV nggak bisa diunggah ulang."}
          </p>
        </div>
        <Field
          label="Nama"
          value={form.name}
          placeholder="Nama tamu"
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={fieldError("name")}
        />
        <Field
          label="Username Instagram"
          value={form.ig}
          placeholder="@username"
          autoCapitalize="none"
          autoCorrect="off"
          onChange={(e) => setForm((f) => ({ ...f, ig: e.target.value }))}
          error={fieldError("ig")}
        />
        <Field
          label="WhatsApp (opsional)"
          value={form.wa}
          type="tel"
          inputMode="tel"
          placeholder="08xx"
          onChange={(e) => setForm((f) => ({ ...f, wa: e.target.value }))}
          error={fieldError("wa")}
        />
        {error && !error.field && <p className={`t-label ${f1.danger}`}>{error.error}</p>}
        {guest ? (
          <div className={styles.statusBox}>
            <div className={styles.badges}>
              {guest.inviteStatus === "diundang" ? (
                <Badge tone="neutral">
                  Diundang{guest.invitedLabel ? ` ${guest.invitedLabel}` : ""}
                </Badge>
              ) : (
                <Badge tone="neutral">Belum diundang</Badge>
              )}
              {guest.rsvp === "hadir" && <Badge tone="success">Hadir</Badge>}
              {guest.rsvp === "nggak" && <Badge tone="danger">Nggak bisa</Badge>}
            </div>
            <p className="t-label c-label-2">
              Status undangan &amp; jawaban tetap, nggak ke-reset walau data diubah.
            </p>
          </div>
        ) : (
          <InnerBox icon={<Info size={16} />}>
            Tamu baru masuk sebagai &quot;Belum diundang&quot;. Undang lewat tombol ✈ di daftar.
          </InnerBox>
        )}
        <div className={f1.sheetActions}>
          <Button disabled={!ready || pending} onClick={() => run(() => submit(form))}>
            {guest ? "Simpan perubahan" : "Tambah tamu"}
          </Button>
          {guest ? (
            <Button variant="destructive" disabled={pending} onClick={() => remove && run(remove)}>
              Hapus tamu
            </Button>
          ) : (
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
