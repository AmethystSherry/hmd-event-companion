"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  CameraSlash,
  CaretLeft,
  Check,
  Clock,
  Info,
  QrCode,
  UserPlus,
  Users,
  WifiSlash,
  X,
} from "@/components/icons";
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  Chip,
  Field,
  IconButton,
  InnerBox,
  ListRow,
  Screen,
  ScreenHeader,
  SearchField,
  Sheet,
  Skeleton,
  Toast,
} from "@/components/ui";
import type { CheckInMethod } from "@/lib/data/types";
import {
  cleanWalkIn,
  doorCounts,
  searchGuests,
  validateLocally,
  type DoorFilter,
  type DoorGuest,
  type DoorOp,
  type DoorOpResult,
} from "@/lib/door";
import { dayMonth, timeWib } from "@/lib/format";
import { igProfileUrl } from "@/lib/invite";
import f1 from "../f1/f1.module.css";
import s from "./f2.module.css";
import { newOpId, useDoor } from "./useDoor";
import { Viewfinder } from "./Viewfinder";

// Pintu masuk panitia: P05 Scan tiket (+P05b antre, P06/P06b/P06c sheet hasil) dan
// P07 Cari nama (+P07b kamera error, P07c walk-in). Satu komponen untuk /scan dan /scan/cari
// supaya pindah layar nggak butuh jaringan (URL diganti lewat history.pushState).

export type DoorView = "scan" | "cari";

export type ScanSheet =
  | {
      kind: "valid";
      guest: DoorGuest; // keadaan sebelum check-in ini (RSVP asli untuk "RSVP Hadir")
      guestNo: number;
      total: number;
      at: string;
      queued: boolean;
    }
  | { kind: "sudah-dipakai"; guest: DoorGuest; at: string; method: CheckInMethod }
  | { kind: "tidak-dikenal" };

type ToastState = { key: number; text: string; undoOp?: string };

const VALID_CLOSE_MS = 2000;
const SAME_QR_MS = 3000;

export function DoorApp({
  eventId,
  eventName,
  initialView,
  cameraFailed: cameraFailedInit = false,
  preview,
}: {
  eventId: string;
  eventName: string;
  initialView: DoorView;
  cameraFailed?: boolean;
  // /dev/states/f2: data contoh, tanpa kamera/jaringan/IndexedDB.
  preview?: {
    guests: DoorGuest[];
    sheet?: ScanSheet;
    pending?: number;
    query?: string;
    walkIn?: boolean;
    profile?: string; // id tamu → P07d terbuka
  };
}) {
  const base = `/panitia/event/${eventId}/scan`;
  const [view, setView] = useState<DoorView>(initialView);
  const [cameraFailed, setCameraFailed] = useState(cameraFailedInit);
  const [sheet, setSheet] = useState<ScanSheet | null>(preview?.sheet ?? null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [query, setQuery] = useState(preview?.query ?? "");
  const [filter, setFilter] = useState<DoorFilter>("semua");
  // Dibuka dari tile Check-in BP02 (`?status=udah&dari=kontrol`): back balik ke Kontrol acara.
  const [fromKontrol, setFromKontrol] = useState(false);
  const [walkIn, setWalkIn] = useState(preview?.walkIn ?? false);
  const [profileId, setProfileId] = useState<string | null>(preview?.profile ?? null);
  const lastScan = useRef({ text: "", at: 0 });
  const busy = useRef(false);

  const show = useCallback((text: string, undoOp?: string) => {
    setToast({ key: Date.now(), text, undoOp });
  }, []);

  // Hasil server yang datang belakangan (antrean offline) dan beda dari tampilan lokal.
  const onSynced = useCallback(
    (op: DoorOp, result: DoorOpResult) => {
      if (op.kind === "undo" || result.kind === "valid" || result.kind === "dibatalkan") return;
      if (result.kind === "sudah-dipakai") {
        show("Ternyata udah masuk duluan lewat HP lain · hitungan nggak nambah");
      } else if (result.kind === "gagal") {
        show(`Check-in gagal: ${result.error}`);
      } else if (op.kind === "scan") {
        show("QR tadi ternyata bukan tiket acara ini · cek lewat Cari nama");
      }
    },
    [show],
  );

  const { guests, pending, online, submit } = useDoor(eventId, {
    preview: preview?.guests,
    onSynced,
  });
  const list = useMemo(() => guests ?? [], [guests]);
  const counts = doorCounts(list);

  // ---- navigasi scan ↔ cari tanpa jaringan ----
  const go = useCallback(
    (next: DoorView, opts: { q?: string; kamera?: boolean } = {}) => {
      setView(next);
      setSheet(null);
      if (opts.q !== undefined) setQuery(opts.q);
      if (preview) return;
      const url = next === "cari" ? `${base}/cari${opts.kamera ? "?kamera=gagal" : ""}` : base;
      window.history.pushState(null, "", url);
    },
    [base, preview],
  );
  // Next (cacheComponents) menyimpan state route yang pernah dibuka: /scan/cari yang dipindah ke
  // Scan lewat pushState tetap di Scan saat dibuka lagi dari BP02. Effect ini jalan lagi tiap route
  // kelihatan lagi → layar, filter & asal disamakan dengan URL.
  useEffect(() => {
    if (preview) return;
    const url = new URL(window.location.href);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sinkron dengan URL saat route tampil
    setView(url.pathname.endsWith("/cari") ? "cari" : "scan");
    setFilter(url.searchParams.get("status") === "udah" ? "udah" : "semua");
    setFromKontrol(url.searchParams.get("dari") === "kontrol");
  }, [preview]);
  useEffect(() => {
    const onPop = () => setView(window.location.pathname.endsWith("/cari") ? "cari" : "scan");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // ---- bunyi & getar (iPhone: getar nggak didukung, bunyi saja) ----
  const audio = useRef<AudioContext | null>(null);
  useEffect(() => {
    const unlock = () => {
      try {
        audio.current ??= new AudioContext();
        audio.current.resume();
      } catch {}
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);
  const feedback = useCallback((ok: boolean) => {
    navigator.vibrate?.(ok ? 60 : [80, 60, 80]);
    const ctx = audio.current;
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = ok ? 880 : 240;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (ok ? 0.14 : 0.3));
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  }, []);

  // ---- P05 → P06 ----
  const onScan = useCallback(
    async (text: string) => {
      const now = Date.now();
      if (sheet || walkIn || busy.current) return;
      if (lastScan.current.text === text && now - lastScan.current.at < SAME_QR_MS) return;
      lastScan.current = { text, at: now };
      busy.current = true;
      try {
        const at = new Date().toISOString();
        const local = validateLocally(list, text, at);
        let result: DoorOpResult | null = null;
        let queued = false;
        // Offline dan jelas gagal → nggak perlu diantre.
        if (!online && local.kind !== "valid") {
          result = local;
        } else {
          result = await submit({ opId: newOpId(), kind: "scan", payload: text, at }, 3000);
          if (!result) {
            result = local;
            queued = local.kind === "valid";
          }
        }
        const guestOf = (id: string) => list.find((g) => g.id === id);
        if (result.kind === "valid") {
          const g = guestOf(result.guestId);
          // "dari {total}" = pembagi setelah check-in ini (tamu RSVP non-hadir ikut jadi hadir),
          // sama dengan header P05 & cap BT02 di HP tamu.
          const before = doorCounts(list);
          const total = Math.max(
            before.expected + (g && g.rsvp !== "hadir" ? 1 : 0),
            result.guestNo,
          );
          setSheet(
            g
              ? { kind: "valid", guest: g, guestNo: result.guestNo, total, at: result.at, queued }
              : { kind: "tidak-dikenal" },
          );
          feedback(true);
        } else if (result.kind === "sudah-dipakai") {
          const g = guestOf(result.guestId);
          setSheet(
            g
              ? { kind: "sudah-dipakai", guest: g, at: result.at, method: result.method }
              : { kind: "tidak-dikenal" },
          );
          feedback(false);
        } else {
          setSheet({ kind: "tidak-dikenal" });
          feedback(false);
        }
      } finally {
        busy.current = false;
      }
    },
    [sheet, walkIn, list, online, submit, feedback],
  );

  useEffect(() => {
    if (preview || sheet?.kind !== "valid") return;
    const t = setTimeout(() => setSheet(null), VALID_CLOSE_MS);
    return () => clearTimeout(t);
  }, [sheet, preview]);

  const onCameraError = useCallback(() => {
    setCameraFailed(true);
    go("cari", { kamera: true });
  }, [go]);

  // ---- P07 ✓ manual · Batalkan · P07c walk-in ----
  const checkInManual = (g: DoorGuest) => {
    const opId = newOpId();
    submit({ opId, kind: "manual", guestId: g.id, at: new Date().toISOString() });
    feedback(true);
    show(`${g.name} udah masuk`, opId);
  };
  const undo = (target: string) => {
    submit({ opId: newOpId(), kind: "undo", target, at: new Date().toISOString() });
    setToast(null);
  };

  const pendingCount = preview?.pending ?? pending;
  const weak = pendingCount > 0 || !online;

  const toastEl = toast && (
    <div className={s.toast}>
      <Toast
        key={toast.key}
        icon={<Check size={18} />}
        undo={
          toast.undoOp
            ? { onUndo: () => undo(toast.undoOp!), onExpire: () => setToast(null) }
            : undefined
        }
      >
        {toast.text}
      </Toast>
    </div>
  );
  useEffect(() => {
    if (!toast || toast.undoOp) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  if (view === "scan") {
    return (
      <Screen
        withBack
        bottom={
          <Button icon={<Users />} onClick={() => go("cari")}>
            Lihat daftar tamu
          </Button>
        }
      >
        <ScreenHeader
          leading={
            <div className={s.headerStack}>
              <div className={s.toolbar}>
                <IconButton
                  href={`/panitia/event/${eventId}/kontrol`}
                  label="Kembali ke Kontrol acara"
                  icon={<CaretLeft />}
                />
                <Badge tone="crew" pulse>
                  Hari-H · Live
                </Badge>
              </div>
              {/* P05b: toast sinyal lemah di atas, di bawah baris tombol back (nggak nutupin back
                  maupun judul). */}
              {weak && (
                <div className={s.topToast}>
                  <Toast icon={<WifiSlash size={18} />}>
                    {pendingCount > 0
                      ? `Sinyal lemah · ${pendingCount} check-in nunggu, terkirim otomatis`
                      : "Sinyal lemah · scan tetap jalan, terkirim otomatis"}
                  </Toast>
                </div>
              )}
            </div>
          }
          eyebrow={`Pintu masuk · ${counts.checkedIn} dari ${counts.expected} udah masuk`}
          title="Scan tiket"
        />
        <Viewfinder live={!preview} onScan={onScan} onError={onCameraError} />
        <Sheet open={!!sheet} onClose={() => setSheet(null)} title={sheetTitle(sheet)} floating>
          {sheet && (
            <ScanResult
              sheet={sheet}
              eventName={eventName}
              onNext={() => setSheet(null)}
              onDetail={(name) => go("cari", { q: name })}
            />
          )}
        </Sheet>
        {toastEl}
      </Screen>
    );
  }

  const results = searchGuests(list, query, filter);
  const all = list.length;
  return (
    <Screen>
      <ScreenHeader
        leading={
          <div className={f1.topBar}>
            {fromKontrol ? (
              <IconButton
                label="Kembali ke Kontrol acara"
                icon={<CaretLeft />}
                href={`/panitia/event/${eventId}/kontrol`}
              />
            ) : (
              <IconButton
                label="Kembali ke Scan tiket"
                icon={<CaretLeft />}
                onClick={() => go("scan")}
              />
            )}
            <Button
              size="sm"
              variant="secondary"
              icon={<UserPlus />}
              onClick={() => setWalkIn(true)}
            >
              Tambah tamu
            </Button>
          </div>
        }
        eyebrow={`Hari-H · ${counts.checkedIn} dari ${counts.expected} udah masuk`}
        title="Cari nama"
      />
      {cameraFailed && (
        <Banner tone="warning" icon={<CameraSlash />} title="Kamera nggak bisa dipakai">
          Langsung pindah ke cari nama. Cocokkan nama + IG tamu, lalu check-in.
        </Banner>
      )}
      <SearchField
        label="Cari tamu"
        placeholder="Cari nama atau @instagram"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
      />
      <div className={s.filters} role="group" aria-label="Filter status">
        <Chip selected={filter === "semua"} onClick={() => setFilter("semua")}>
          Semua {all}
        </Chip>
        <Chip selected={filter === "belum"} onClick={() => setFilter("belum")}>
          Belum masuk {all - counts.checkedIn}
        </Chip>
        <Chip selected={filter === "udah"} onClick={() => setFilter("udah")}>
          Udah masuk {counts.checkedIn}
        </Chip>
      </div>
      {!guests ? (
        <Skeleton height={320} />
      ) : results.length ? (
        <Card inset>
          {results.map((g) => (
            <GuestRow
              key={g.id}
              guest={g}
              onOpen={() => setProfileId(g.id)}
              onCheckIn={() => checkInManual(g)}
            />
          ))}
        </Card>
      ) : (
        <Card className={s.empty}>
          {query.trim() ? (
            <>
              <p className="t-body-emph">“{query.trim()}” nggak ada di daftar</p>
              <p className="t-label c-label-2">Tamu walk-in? Tambahkan cepat di bawah.</p>
            </>
          ) : (
            <p className="t-label c-label-2">Belum ada tamu di filter ini.</p>
          )}
        </Card>
      )}
      <GuestProfileSheet
        guest={list.find((g) => g.id === profileId) ?? null}
        onClose={() => setProfileId(null)}
        onCheckIn={(g) => {
          setProfileId(null);
          checkInManual(g);
        }}
      />
      <WalkInSheet
        open={walkIn}
        initialName={query.trim().startsWith("@") ? "" : query.trim()}
        guests={list}
        onClose={() => setWalkIn(false)}
        onSubmit={(name, ig) => {
          submit({ opId: newOpId(), kind: "walkin", name, ig, at: new Date().toISOString() });
          feedback(true);
          setWalkIn(false);
          setQuery("");
          show(`${name} udah masuk`);
        }}
      />
      {toastEl}
    </Screen>
  );
}

function sheetTitle(sheet: ScanSheet | null): string {
  if (!sheet) return "Hasil scan";
  if (sheet.kind === "valid") return `Valid: ${sheet.guest.name}`;
  if (sheet.kind === "sudah-dipakai") return "Tiket sudah dipakai";
  return "Tiket tidak dikenal";
}

// P06 · P06b · P06c
function ScanResult({
  sheet,
  eventName,
  onNext,
  onDetail,
}: {
  sheet: ScanSheet;
  eventName: string;
  onNext: () => void;
  onDetail: (name: string) => void;
}) {
  if (sheet.kind === "valid") {
    const g = sheet.guest;
    return (
      <div className={s.result}>
        <div className={s.resultHero}>
          <span className={s.okHero}>
            <Check size={30} weight="bold" />
          </span>
          <p className={`t-headline ${s.success}`}>Tiket valid, silakan masuk!</p>
          <p className="t-label c-label-2">
            Tamu ke-{sheet.guestNo} dari {sheet.total} · tiket di HP tamu ikut sobek
          </p>
        </div>
        <div className={s.resultGuest}>
          <Avatar name={g.name} size={44} />
          <div>
            <p className="t-headline">{g.name}</p>
            <p className="t-label c-label-2">
              {g.ig ? `@${g.ig} · ` : ""}RSVP {RSVP_LABEL[g.rsvp]}
            </p>
          </div>
        </div>
        <div className={s.badges}>
          <Badge tone="success">Valid · tamu ke-{sheet.guestNo}</Badge>
          <Badge tone="neutral">Masuk {timeWib(sheet.at)}</Badge>
        </div>
        <Button icon={<QrCode />} onClick={onNext}>
          Scan berikutnya
        </Button>
        <p className={`t-label c-label-2 ${f1.caption}`}>
          {sheet.queued
            ? "Sinyal lemah · check-in diantre, terkirim otomatis"
            : "Tutup sendiri dalam 2 detik, kamera tetap nyala"}
        </p>
      </div>
    );
  }
  if (sheet.kind === "sudah-dipakai") {
    const g = sheet.guest;
    return (
      <div className={s.result}>
        <div className={s.resultHero}>
          <span className={s.heroIcon} data-tone="warning">
            <Clock size={26} />
          </span>
          <p className="t-headline">Tiket sudah dipakai</p>
          <p className="t-label c-label-2">
            {g.name} sudah masuk {timeWib(sheet.at)} lewat{" "}
            {sheet.method === "scan" ? "scan" : "cari nama"}. Hitungan tamu tidak bertambah.
          </p>
        </div>
        <div className={s.actions}>
          <Button icon={<QrCode />} onClick={onNext}>
            Scan berikutnya
          </Button>
          <Button variant="secondary" onClick={() => onDetail(g.name)}>
            Lihat detail tamu
          </Button>
        </div>
      </div>
    );
  }
  return (
    <div className={s.result}>
      <div className={s.resultHero}>
        <span className={s.heroIcon} data-tone="danger">
          <X size={26} />
        </span>
        <p className="t-headline">Tiket tidak dikenal</p>
        <p className="t-label c-label-2">
          QR ini bukan tiket {eventName}. Minta tamu buka tiket dari link WA-nya, lalu scan lagi.
        </p>
      </div>
      <Button onClick={onNext}>Scan lagi</Button>
    </div>
  );
}

const RSVP_LABEL = { hadir: "Hadir", nggak: "Nggak bisa", belum: "Belum jawab" } as const;

// Baris P07: tap baris → P07d; yang udah masuk → Badge "Udah masuk", yang belum → ✓ saja.
// Dua tombol bersebelahan (bukan bersarang), jadi baris bukan ListRow interaktif.
function GuestRow({
  guest: g,
  onOpen,
  onCheckIn,
}: {
  guest: DoorGuest;
  onOpen: () => void;
  onCheckIn: () => void;
}) {
  const inside = g.status === "dipakai";
  return (
    <div className={s.guestRow}>
      <button type="button" className={s.guestMain} onClick={onOpen}>
        <Avatar name={g.name} />
        <span className={s.guestText}>
          <span className="t-body-emph">{g.name}</span>
          <span className="t-label c-label-2">
            {[g.ig && `@${g.ig}`, !inside && g.rsvp === "nggak" && "RSVP Nggak bisa"]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </span>
      </button>
      {inside ? (
        <Badge tone="success">Udah masuk</Badge>
      ) : (
        <Button
          size="sm"
          iconOnly
          label={`Check-in ${g.name}`}
          icon={<Check />}
          onClick={onCheckIn}
        />
      )}
    </div>
  );
}

// P07d · Profil tamu (sheet dari P07): status, WA disamarkan, undangan, konfirmasi.
function GuestProfileSheet({
  guest: g,
  onClose,
  onCheckIn,
}: {
  guest: DoorGuest | null;
  onClose: () => void;
  onCheckIn: (g: DoorGuest) => void;
}) {
  const inside = g?.status === "dipakai";
  return (
    <Sheet open={!!g} onClose={onClose} title={g ? `Profil ${g.name}` : "Profil tamu"}>
      {g && (
        <div className={s.profile}>
          <div className={s.profileHead}>
            <Avatar name={g.name} size={56} />
            <div>
              <p className="t-card-title">{g.name}</p>
              {g.ig && <p className="t-label c-label-2">@{g.ig}</p>}
            </div>
          </div>
          <div className={s.badges}>
            {g.rsvp === "hadir" ? (
              <Badge tone="success">RSVP Hadir</Badge>
            ) : g.rsvp === "nggak" ? (
              <Badge tone="danger">RSVP Nggak bisa</Badge>
            ) : (
              <Badge tone="neutral">RSVP Belum jawab</Badge>
            )}
            {inside ? (
              <Badge tone="success">Udah masuk {g.checkedInAt ? timeWib(g.checkedInAt) : ""}</Badge>
            ) : (
              <Badge tone="neutral">Belum masuk</Badge>
            )}
          </div>
          <div className={s.profileRows}>
            <ListRow title="WhatsApp" subtitle={g.waMasked ?? "Belum diisi"} />
            <ListRow
              title="Undangan"
              subtitle={g.inviteStatus === "diundang" ? "Dikirim lewat DM IG" : "Belum diundang"}
              trailing={g.invitedAt ? dayMonth(g.invitedAt) : undefined}
            />
            <ListRow
              title="Konfirmasi"
              subtitle={g.rsvp === "belum" ? "Belum jawab" : RSVP_LABEL[g.rsvp]}
              trailing={g.respondedAt ? dayMonth(g.respondedAt) : undefined}
            />
          </div>
          <div className={s.actions}>
            {!inside && (
              <Button icon={<Check />} onClick={() => onCheckIn(g)}>
                Check-in sekarang
              </Button>
            )}
            {g.ig && (
              <Button
                variant="secondary"
                href={igProfileUrl(g.ig)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka Instagram
              </Button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

// P07c · Tambah tamu cepat (walk-in)
function WalkInSheet({
  open,
  initialName,
  guests,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialName: string;
  guests: DoorGuest[];
  onClose: () => void;
  onSubmit: (name: string, ig: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [ig, setIg] = useState("");
  const [error, setError] = useState<{ field: "name" | "ig"; error: string } | null>(null);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(initialName);
      setIg("");
      setError(null);
    }
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const r = cleanWalkIn({ name, ig }, guests);
    if (!r.ok) return setError(r);
    onSubmit(r.name, r.ig);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Tambah tamu cepat">
      <form className={s.form} onSubmit={submit} noValidate>
        <div className={s.sheetHead}>
          <p className="t-card-title">Tambah tamu cepat</p>
          <p className="t-label c-label-2">
            Walk-in · nggak ada di daftar, langsung tercatat masuk
          </p>
        </div>
        <Field
          label="Nama"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error?.field === "name" ? error.error : undefined}
          autoComplete="off"
        />
        <Field
          label="Username Instagram"
          value={ig}
          placeholder="@username"
          onChange={(e) => setIg(e.target.value)}
          error={error?.field === "ig" ? error.error : undefined}
          autoCapitalize="none"
          autoComplete="off"
        />
        <InnerBox icon={<Info size={18} />}>
          Statusnya langsung “Udah masuk” dan ikut kehitung di jumlah tamu.
        </InnerBox>
        <div className={s.actions}>
          <Button type="submit">Tambah &amp; check-in</Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
