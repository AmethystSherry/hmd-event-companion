"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  ArrowCounterClockwise,
  CaretLeft,
  Check,
  Copy,
  FileText,
  Info,
  PaperPlaneTilt,
  PencilSimple,
  Trash,
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
  SwipeRow,
  Toast,
} from "@/components/ui";
import type { FormResult, GuestForm } from "@/app/panitia/actions";
import { copyText } from "@/lib/clipboard";
import type { InviteSnapshot } from "@/lib/data/store";
import type { Guest, GuestStats, InviteStatus, Rsvp } from "@/lib/data/types";
import { firstName } from "@/lib/format";
import { fillTemplate, igDmUrl, REMINDER_TEMPLATE, waLink } from "@/lib/invite";
import { THANKS_TEMPLATE, type ThanksRow, type ThanksView } from "@/lib/thanks";
import { statusBadge, type GuestStatusKey } from "@/lib/view";
import f1 from "./f1.module.css";
import styles from "./panitia.module.css";

export type GuestRowData = {
  id: string;
  name: string;
  ig: string;
  wa: string | null; // 62…
  waDisplay: string; // "0812 3456 7890" atau ""
  status: GuestStatusKey; // satu badge per baris (guestStatus)
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
  markThanksSent?: (guestId: string) => Promise<FormResult>; // F5 v2 · P12
};

type Tab = "undangan" | "pengingat" | "makasih";

type Filter = "semua" | "belum" | "belumJawab" | "hadir" | "nggak";
type SheetState = { kind: "add" } | { kind: "edit"; id: string } | null;
type ToastState =
  | { kind: "invite"; guestId: string; ig: string; prev: InviteSnapshot; key: number }
  | { kind: "hapus"; guestId: string; name: string; key: string };

const PENDING_KEY = "hmd:pending"; // aksi yang menunggu panitia balik dari IG/WA

const FILTERS: [Filter, string][] = [
  ["semua", "Semua"],
  ["belum", "Belum diundang"],
  ["belumJawab", "Belum jawab"],
  ["hadir", "Hadir"],
  ["nggak", "Nggak bisa"],
];

const inFilter = (filter: Filter, s: GuestStatusKey) =>
  filter === "semua" ||
  (filter === "belumJawab" ? s === "belumJawab" || s === "barusan" : s === filter);

// P04 Tamu & undangan · P04d balik dari IG (toast + Batalkan 5 dtk) · P04g/P04h filter + hint ·
// P04f tambah tamu · P04e ubah tamu (🗑 di judul) · P04s swipe kiri hapus · P04b pengingat H-1
// via WA, satu-satu per tamu (tanpa kirim massal). F5 v2 · P12 tab "Makasih" (cuma setelah acara
// ditutup, sebelum data dihapus): tamu yang datang, "Kirim WA" satu-satu → Terkirim saat balik.
// Hapus tamu (🗑 / swipe): baris langsung hilang + Toast Batalkan 5 dtk; baru benar-benar dihapus
// di server saat toast habis (atau saat layar ditinggal), jadi Batalkan memulihkan semuanya.
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
  initialSwiped,
  thanks,
}: {
  eventId: string;
  reminderDateLabel: string; // "Sabtu, 7 Nov"
  templateFromCsv: boolean;
  dmTemplate: string;
  guests: GuestRowData[];
  stats: GuestStats;
  actions?: GuestActions; // kosong = pratinjau
  initialTab?: Tab;
  initialFilter?: Filter;
  initialSheet?: SheetState;
  initialToast?: Omit<Extract<ToastState, { kind: "invite" }>, "key" | "kind"> | null;
  initialSwiped?: string; // pratinjau P04s: baris dengan panel Hapus terbuka
  thanks?: ThanksView & { dateLabel: string }; // P12; kosong = tab Makasih nggak ada
}) {
  // Setelah acara ditutup (`thanks` ada) cuma P12 Makasih; Undangan & Pengingat H-1 udah lewat.
  const [tab, setTab] = useState<Tab>(
    thanks ? "makasih" : initialTab === "makasih" ? "undangan" : initialTab,
  );
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [sheet, setSheet] = useState<SheetState>(initialSheet);
  const [toast, setToast] = useState<ToastState | null>(
    initialToast ? { kind: "invite", ...initialToast, key: 0 } : null,
  );
  const [hidden, setHidden] = useState<string[]>([]); // dihapus, menunggu Batalkan habis
  const [, start] = useTransition();

  // Simpan tab di URL supaya reload tetap di tab yang sama.
  const changeTab = (t: Tab) => {
    setTab(t);
    const url = new URL(window.location.href);
    if (t !== "undangan") url.searchParams.set("tab", t);
    else url.searchParams.delete("tab");
    window.history.replaceState(null, "", url);
  };

  // ---- Hapus + Batalkan ----
  const pendingDelete = useRef<string | null>(null);
  const actionsRef = useRef(actions);
  useEffect(() => {
    actionsRef.current = actions;
  });
  const commitDelete = (id: string | null = pendingDelete.current) => {
    if (!id || pendingDelete.current !== id) return;
    pendingDelete.current = null;
    void actionsRef.current?.deleteGuest(id);
  };
  // Layar ditinggal sebelum toast habis → hapusnya tetap jalan.
  useEffect(() => {
    const flush = () => commitDelete();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);
  const remove = (g: GuestRowData) => {
    commitDelete(); // hapus sebelumnya yang masih menunggu langsung dijalankan
    pendingDelete.current = g.id;
    setHidden((h) => [...h, g.id]);
    setSheet(null);
    setToast({ kind: "hapus", guestId: g.id, name: g.name, key: g.id });
  };

  // ---- Balik dari IG / WA (visibilitychange) ----
  const guestsRef = useRef(guests);
  useEffect(() => {
    guestsRef.current = guests;
  });

  const openWa = (g: GuestRowData) => {
    if (!actions || !g.wa) return;
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ kind: "wa", id: g.id }));
    const msg = fillTemplate(REMINDER_TEMPLATE, { nama: firstName(g.name), link: g.reminderLink });
    window.open(waLink(g.wa, msg), "_blank", "noopener");
  };

  // P12: buka WA makasih; balik ke tab = Terkirim (sama pola pengingat, tanpa kirim ulang).
  const openThanks = (row: ThanksRow) => {
    if (!row.waHref) return;
    if (actions?.markThanksSent) {
      sessionStorage.setItem(PENDING_KEY, JSON.stringify({ kind: "thanks", id: row.id }));
    }
    window.open(row.waHref, "_blank", "noopener");
  };

  useEffect(() => {
    if (!actions) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) return;
      sessionStorage.removeItem(PENDING_KEY);
      const pending = JSON.parse(raw) as { kind: "ig" | "wa" | "thanks"; id: string };
      if (pending.kind === "thanks") {
        const mark = actions.markThanksSent;
        if (mark) start(() => mark(pending.id).then(() => undefined));
        return;
      }
      const g = guestsRef.current.find((x) => x.id === pending.id);
      if (!g) return;
      if (pending.kind === "ig") {
        start(async () => {
          const prev = await actions.markInvited(g.id);
          setToast({ kind: "invite", guestId: g.id, ig: g.ig, prev, key: Date.now() });
        });
      } else {
        start(() => actions.markReminderSent(g.id));
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onVisible);
    };
  }, [actions]);

  const invite = (g: GuestRowData) => {
    const msg = fillTemplate(g.dmTemplate, { nama: firstName(g.name), link: g.link });
    void copyText(msg);
    if (!actions) return;
    sessionStorage.setItem(PENDING_KEY, JSON.stringify({ kind: "ig", id: g.id }));
    window.open(igDmUrl(g.ig, msg), "_blank", "noopener");
  };

  const shown = guests.filter((g) => !hidden.includes(g.id));
  const editing = sheet?.kind === "edit" ? shown.find((g) => g.id === sheet.id) : undefined;
  const counts = Object.fromEntries(
    FILTERS.map(([f]) => [f, shown.filter((g) => inFilter(f, g.status)).length]),
  ) as Record<Filter, number>;
  const visible = shown.filter((g) => inFilter(filter, g.status));

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

  const toastView = toast && (
    <div className={f1.toastDock}>
      {toast.kind === "invite" ? (
        <Toast
          key={toast.key}
          icon={<Check />}
          undo={{
            onUndo: () => {
              setToast(null);
              if (actions) start(() => actions.undoInvite(toast.guestId, toast.prev));
            },
            onExpire: () => setToast(null),
          }}
        >
          <span className={f1.stack}>
            <span>DM ke @{toast.ig} ditandai terkirim</span>
            <span className={styles.toastSub}>Template udah disalin, tinggal tempel di IG</span>
          </span>
        </Toast>
      ) : (
        <Toast
          key={toast.key}
          icon={<Trash />}
          undo={{
            onUndo: () => {
              pendingDelete.current = null;
              setHidden((h) => h.filter((id) => id !== toast.guestId));
              setToast(null);
            },
            onExpire: () => {
              commitDelete(toast.guestId);
              setToast(null);
            },
          }}
        >
          {toast.name} dihapus
        </Toast>
      )}
    </div>
  );

  if (tab === "makasih" && thanks) {
    const all = thanks.total > 0 && thanks.sent === thanks.total;
    return (
      <Screen withBack>
        <ScreenHeader
          leading={back}
          eyebrow={`${thanks.dateLabel} · setelah acara`}
          title="Kirim makasih"
        />
        <Card>
          <div className={styles.fileRow}>
            <span className={f1.iconBox}>
              <FileText size={20} />
            </span>
            <div className={styles.grow}>
              <p className="t-body-emph">{thanks.total} tamu yang datang</p>
              <p className="t-label c-label-2">
                Kirim satu-satu lewat WA · link buku tamu & kolase
              </p>
            </div>
            {all ? (
              <span className={styles.checkCircle} role="img" aria-label="Semua udah terkirim">
                <Check size={16} />
              </span>
            ) : (
              <span className="t-label c-label-2 tabular">
                {thanks.sent}/{thanks.total} terkirim
              </span>
            )}
          </div>
        </Card>
        <Card>
          <CardLabel>Template pesan makasih</CardLabel>
          <p className={`t-body ${f1.template}`}>{THANKS_TEMPLATE}</p>
        </Card>
        {thanks.rows.length > 0 && (
          <Card inset>
            {thanks.rows.map((r) => (
              <div key={r.id} className={styles.guestRow}>
                <Avatar name={r.name} />
                <div className={styles.guestMain}>
                  <p className="t-body-emph">{r.name}</p>
                </div>
                {r.sentAt ? (
                  <Badge tone="success">Terkirim</Badge>
                ) : r.waHref ? (
                  <Button size="sm" icon={<WhatsappLogo />} onClick={() => openThanks(r)}>
                    Kirim WA
                  </Button>
                ) : (
                  <span className="t-label c-label-3">Nggak ada WA</span>
                )}
              </div>
            ))}
          </Card>
        )}
      </Screen>
    );
  }

  if (tab === "pengingat") {
    const hadir = shown.filter((g) => g.rsvp === "hadir");
    return (
      <Screen withBack>
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
                    onClick={() => openWa(g)}
                  >
                    Kirim WA
                  </Button>
                )}
              </div>
            ))}
          </Card>
        )}
        {toastView}
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
      {filter === "semua" && (
        <Card>
          <CardLabel>Template DM · {templateFromCsv ? "dari CSV" : "default"}</CardLabel>
          <p className={`t-body ${f1.template}`}>{dmTemplate}</p>
          <InnerBox icon={<Copy size={16} />}>
            Template ini otomatis disalin pas kamu tap ✈ di baris tamu
          </InnerBox>
        </Card>
      )}
      <div className={f1.chips} role="group" aria-label="Filter tamu">
        {FILTERS.map(([value, label]) => (
          <Chip key={value} selected={filter === value} onClick={() => setFilter(value)}>
            {label} {counts[value]}
          </Chip>
        ))}
      </div>
      {filter === "belumJawab" && (
        <p className={`t-label c-label-2 ${f1.hint}`}>
          <ArrowCounterClockwise size={14} />
          Udah diundang tapi belum jawab. Tap ↻ buat kirim ulang DM-nya.
        </p>
      )}
      {filter === "belum" && (
        <p className={`t-label c-label-2 ${f1.hint}`}>
          <PaperPlaneTilt size={14} />
          Belum dapat DM. Tap ✈ satu-satu, template otomatis disalin.
        </p>
      )}
      <Card inset className={styles.swipeList}>
        {visible.length === 0 ? (
          <p className={`t-label c-label-2 ${styles.guestRow}`}>Belum ada tamu di filter ini.</p>
        ) : (
          visible.map((g) => {
            const status = statusBadge(g.status);
            return (
              <SwipeRow
                key={g.id}
                className={styles.swipe}
                deleteLabel={`Hapus ${g.name}`}
                initialOpen={initialSwiped === g.id}
                onDelete={() => remove(g)}
              >
                <div className={styles.guestRow}>
                  <Avatar name={g.name} />
                  <div className={styles.guestMain}>
                    <p className={styles.guestName}>
                      <span className="t-body-emph">{g.name}</span>
                      {g.ig && <span className="t-label c-label-2">@{g.ig}</span>}
                    </p>
                    <div className={styles.badges}>
                      <Badge tone={status.tone}>{status.label}</Badge>
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
                        disabled={!g.ig}
                        onClick={() => invite(g)}
                      />
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        iconOnly
                        label={`Undang ${g.name} lagi`}
                        icon={<ArrowCounterClockwise />}
                        disabled={!g.ig}
                        onClick={() => invite(g)}
                      />
                    )}
                  </div>
                </div>
              </SwipeRow>
            );
          })
        )}
      </Card>

      {toastView}

      <GuestSheet
        key={sheet ? (sheet.kind === "edit" ? sheet.id : "add") : "closed"}
        open={sheet !== null}
        guest={editing}
        onClose={() => setSheet(null)}
        submit={(input) =>
          editing ? actions?.updateGuest(editing.id, input) : actions?.addGuest(eventId, input)
        }
        remove={editing ? () => remove(editing) : undefined}
      />
    </Screen>
  );
}

// P04f tambah tamu manual · P04e ubah tamu (🗑 di kanan judul → hapus + Batalkan).
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
  remove?: () => void;
}) {
  const [form, setForm] = useState<GuestForm>({
    name: guest?.name ?? "",
    ig: guest?.ig ? `@${guest.ig}` : "",
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
        <div className={f1.between}>
          <div className={f1.sheetHead}>
            <p className="t-card-title">{guest ? "Ubah tamu" : "Tambah tamu"}</p>
            <p className="t-label c-label-2">
              {guest
                ? `${guest.name} · ${guest.source === "csv" ? "baris dari CSV" : guest.source === "walkin" ? "walk-in di pintu" : "ditambah manual"}`
                : "Ditambah manual, CSV nggak bisa diunggah ulang."}
            </p>
          </div>
          {guest && (
            <Button
              size="sm"
              variant="destructive"
              iconOnly
              label="Hapus tamu"
              icon={<Trash />}
              onClick={remove}
            />
          )}
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
          {!guest && (
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
          )}
        </div>
      </div>
    </Sheet>
  );
}
