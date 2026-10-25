"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { preload } from "react-dom";
import { Check, Key, QrCode, Sun } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  IllustratedScreen,
  Pill,
  Screen,
  ScreenHeader,
  Ticket,
  TicketStub,
} from "@/components/ui";
import type { Event } from "@/lib/data/types";
import { dateShort, firstName } from "@/lib/format";
import { POTARA_IG } from "@/lib/invite";
import f1 from "../f1/f1.module.css";
import s from "./f2.module.css";

// Layar tamu F2 (hari-H) di /t/[token]: T05 tiket + QR → T05a discan, tiket sobek →
// BT02 selamat datang (sekali, 3 dtk) → layar acara /t/[token]/acara · tiket dibuka lagi → T03b (QR nonaktif).

export type DayPhase = "t05" | "t05a" | "bt02" | "t03b";

export type Stamp = { time: string; guestNo: number | null; total: number };

type TicketProps = {
  guestName: string;
  event: Pick<Event, "date" | "startsAt" | "location">;
  keyNo: string;
  code: string;
  qr?: ReactNode;
  stamp: Stamp | null;
};

const TEAR_MS = 900; // design.md "Animasi sobek"
const HOLD_MS = 700; // jeda di T05a sebelum BT02
const WELCOME_SEC = 3;
export const BT02_ART = "/figma/bt02-welcome-at-door.webp";

export function DayTicketScreen({
  phase,
  guestName,
  event,
  keyNo,
  code,
  qr,
  stamp,
  countdown = WELCOME_SEC,
  onEnter,
  eventHref,
  brightness,
  onBrightness,
}: TicketProps & {
  phase: DayPhase;
  countdown?: number;
  onEnter?: () => void;
  eventHref?: string; // layar acara (Sesi/Jeda); kosong = pratinjau
  brightness?: boolean; // T05 · mode QR layar penuh
  onBrightness?: (open: boolean) => void;
}) {
  const data = {
    name: guestName,
    keyNo,
    when: `${dateShort(event.date)} · ${event.startsAt}`,
    where: event.location,
    code,
    followNote: `Sudah follow @${POTARA_IG}`,
  };

  if (phase === "t05") {
    return (
      <Screen>
        <ScreenHeader
          eyebrow="Hari-H · pintu udah dibuka"
          title="Tunjukkan QR ke panitia"
          trailing={
            <button
              type="button"
              className={s.badgeButton}
              onClick={() => onBrightness?.(true)}
              aria-label="Kecerahan maks: tampilkan QR layar penuh"
            >
              <Badge tone="neutral" icon={<Sun size={13} />}>
                Kecerahan maks
              </Badge>
            </button>
          }
        />
        <Ticket state="aktif" data={data} qr={qr} />
        {brightness && (
          <QrFullscreen
            qr={qr}
            name={guestName}
            code={code}
            onClose={() => onBrightness?.(false)}
          />
        )}
      </Screen>
    );
  }

  if (phase === "t05a") {
    return (
      <Screen>
        <ScreenHeader
          eyebrow={`Hari-H · pintu dibuka ${event.startsAt}`}
          title={<span className={s.success}>Tiket valid!</span>}
        />
        <div className={s.tearWrap}>
          <Ticket state="valid" torn data={data} className={s.tearHead} />
          <TicketStub code={code} qr={qr} className={s.tearStub} />
        </div>
      </Screen>
    );
  }

  const stampText = stamp
    ? `Masuk ${stamp.time}${stamp.guestNo ? ` · tamu ke-${stamp.guestNo} dari ${stamp.total}` : ""}`
    : "Udah masuk";

  // BT02 (Figma 4961:7021): Pota di pintu + panel. Tiket sobek cuma di T05a.
  if (phase === "bt02") {
    return (
      <IllustratedScreen src={BT02_ART} priority>
        <p className="t-label c-label-2">{stampText}</p>
        <h1 className="t-title">Selamat datang di rumah baru, {firstName(guestName)}!</h1>
        <div className={s.pills}>
          <Pill icon={<Key />}>Kunci {keyNo}</Pill>
          <Pill icon={<Check />}>Sudah masuk</Pill>
        </div>
        <Button onClick={onEnter}>Masuk sekarang</Button>
        <p className={`t-caption c-label-2 ${f1.caption}`} aria-live="polite">
          Otomatis lanjut ke acara dalam {countdown} detik
        </p>
      </IllustratedScreen>
    );
  }

  // T03b
  return (
    <Screen
      bottomHeight={82}
      bottom={
        <>
          <p className={`t-label c-label-2 ${f1.caption}`}>
            QR udah nggak aktif. Tiket ini jadi bukti kamu hadir.
          </p>
          {eventHref ? (
            <Button href={eventHref}>Kembali ke acara</Button>
          ) : (
            <Button aria-disabled="true" onClick={(e) => e.preventDefault()}>
              Kembali ke acara
            </Button>
          )}
        </>
      }
    >
      <ScreenHeader eyebrow="Tiket kamu · udah dipakai" title="Kamu udah di dalam" />
      <Ticket state="sobek" data={data} stamp={stamp ?? undefined} />
      <Card className={s.qrOff}>
        <span className={s.rowIcon}>
          <QrCode size={20} />
        </span>
        <div>
          <p className="t-body-emph">QR nonaktif</p>
          <p className="t-label c-label-2">
            {stamp ? `Discan panitia ${stamp.time} · ` : ""}nggak bisa dipakai lagi
          </p>
        </div>
      </Card>
    </Screen>
  );
}

// "Kecerahan maks": browser nggak bisa mengatur brightness, jadi QR besar di latar putih +
// Wake Lock (layar nggak meredup selama ditunjukkan). Tap di mana aja buat tutup.
function QrFullscreen({
  qr,
  name,
  code,
  onClose,
}: {
  qr?: ReactNode;
  name: string;
  code: string;
  onClose: () => void;
}) {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    navigator.wakeLock
      ?.request("screen")
      .then((l) => (lock = l))
      .catch(() => {});
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      lock?.release().catch(() => {});
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  return (
    <button
      type="button"
      className={s.fullscreen}
      onClick={onClose}
      aria-label="Tutup QR layar penuh"
    >
      <span className={s.bigQr}>{qr}</span>
      <span className="t-headline">{name}</span>
      <span className="t-code">{code}</span>
      <span className={`t-label ${s.fullscreenHint}`}>Tap di mana aja buat tutup</span>
    </button>
  );
}

const seenKey = (ticketKey: string) => `hmd-welcome:${ticketKey}`;
const noopSubscribe = () => () => {};

function markSeen(ticketKey: string) {
  try {
    localStorage.setItem(seenKey(ticketKey), "1");
  } catch {}
}

function wasSeen(ticketKey: string): boolean {
  try {
    return localStorage.getItem(seenKey(ticketKey)) === "1";
  } catch {
    return false;
  }
}

// Pengendali alur di HP tamu. `status` datang dari server (refresh lewat SSE /api/live):
// berubah aktif → dipakai saat halaman terbuka = momen sobek (T05a → BT02 → T03b).
// Dibuka setelah masuk: BT02 sekali (kalau baru masuk), selanjutnya langsung T03b.
export function GuestDayTicket({
  ticketKey,
  status,
  justCheckedIn,
  eventHref,
  ...ticket
}: TicketProps & {
  ticketKey: string;
  eventHref: string; // BT02 selesai → layar acara (mode Sesi/Jeda yang aktif)
  status: "aktif" | "dipakai";
  justCheckedIn: boolean; // check-in < 10 menit lalu (dari server) → tampilkan BT02 sekali
}) {
  // Ilustrasi BT02 diunduh sejak T05 tampil → muncul tanpa kedip tepat setelah T05a.
  preload(BT02_ART, { as: "image", fetchPriority: "high" });
  const [phase, setPhase] = useState<DayPhase>(
    status === "aktif" ? "t05" : justCheckedIn ? "bt02" : "t03b",
  );
  const [live, setLive] = useState(false); // sobek terjadi selagi halaman terbuka
  const [bright, setBright] = useState(false);
  const [countdown, setCountdown] = useState(WELCOME_SEC);
  const [lastStatus, setLastStatus] = useState(status);
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  // Status berubah dari server (tanpa effect: state disesuaikan saat render).
  if (status !== lastStatus) {
    setLastStatus(status);
    setBright(false);
    setLive(status === "dipakai");
    // aktif lagi = panitia membatalkan check-in (salah tap ✓) → tiket utuh lagi.
    setPhase(status === "aktif" ? "t05" : "t05a");
  }

  useEffect(() => {
    if (phase === "t05") {
      try {
        localStorage.removeItem(seenKey(ticketKey));
      } catch {}
    }
    if (phase !== "t05a") return;
    navigator.vibrate?.(60);
    const t = setTimeout(() => {
      setCountdown(WELCOME_SEC);
      setPhase("bt02");
    }, TEAR_MS + HOLD_MS);
    return () => clearTimeout(t);
  }, [phase, ticketKey]);

  const router = useRouter();
  // BT02 selesai (3 dtk / "Masuk sekarang") → layar acara; tiket ini dibuka lagi nanti → T03b.
  const finishWelcome = useCallback(() => {
    markSeen(ticketKey);
    setPhase("t03b");
    router.push(eventHref);
  }, [ticketKey, eventHref, router]);

  useEffect(() => {
    if (phase !== "bt02") return;
    const tick = setInterval(() => setCountdown((n) => Math.max(0, n - 1)), 1000);
    const done = setTimeout(finishWelcome, WELCOME_SEC * 1000);
    return () => {
      clearInterval(tick);
      clearTimeout(done);
    };
  }, [phase, finishWelcome]);

  // Dibuka ulang setelah BT02 pernah tampil → langsung T03b.
  const shown = phase === "bt02" && !live && hydrated && wasSeen(ticketKey) ? "t03b" : phase;

  return (
    <DayTicketScreen
      {...ticket}
      phase={shown}
      countdown={countdown}
      onEnter={finishWelcome}
      eventHref={eventHref}
      brightness={bright}
      onBrightness={setBright}
    />
  );
}
