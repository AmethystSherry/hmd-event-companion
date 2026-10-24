"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowClockwise,
  Camera,
  CaretRight,
  ChatCircle,
  Image as ImageIcon,
  ListBullets,
  Users,
  WifiSlash,
} from "@/components/icons";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Badge, Button, JejakAcara, TicketNext, TopToast } from "@/components/ui";
import { useServerNow } from "@/components/useServerNow";
import { stampsOf, type AcaraView } from "@/lib/acara";
import { cx } from "@/lib/cx";
import { initials, timeWib } from "@/lib/format";
import { countdownParts, minutesUntil, type SessionView } from "@/lib/rundown";
import { DetailSheet, RundownSheet, SpeakerSheet, TamuSheet, type SheetKind } from "./Sheets";
import styles from "./f4.module.css";

// F4 · layar acara tamu (/t/[token]/acara): satu layar, dua mode dari state acara (prd §6).
// SESI = BT20 Open space · BT21 Talkshow · BT23 Tur kantor · BT24 Closing; JEDA = BT03 (+ jeda
// terakhir, sebelum sesi 1). Panitia Mulai/Selesaikan → rev naik → SSE/poll 2 dtk → router.refresh.
// Sheet BT22/BT21p/BT04/BT05 dibuka lewat `?sheet=` (pushState) supaya back HP menutupnya.
// Offline (S01): toast atas + layar dari data terakhir (snapshot localStorage kalau HTML-nya dari
// cache SW lebih lama). Layar ini nggak memanggil server sendiri selain LiveRefresh.

const ARTS = ["open-space", "talkshow", "office-tour", "closing", "break", "weak-signal"] as const;
const artUrl = (art: string) => `/figma/f3-${art}.webp`;
const snapKey = (token: string) => `hmd-acara:${token}`;
const SKEW_KEY = "hmd-acara-skew";

type Preview = { sheet?: SheetKind; sessionId?: string; offline?: boolean };
type OpenSheet = { kind: SheetKind; sessionId?: string };

// localStorage dibaca lewat useSyncExternalStore (server: null). Tulis tanpa notifikasi: yang
// ditulis selalu data yang lagi tampil.
const noSubscribe = () => () => {};
function useStored(key: string, enabled: boolean): string | null {
  return useSyncExternalStore(
    noSubscribe,
    () => {
      if (!enabled) return null;
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    () => null,
  );
}

function parseSnapshot(raw: string | null): AcaraView | null {
  try {
    return raw ? (JSON.parse(raw) as AcaraView) : null;
  } catch {
    return null;
  }
}

export function AcaraScreen({
  token,
  view: fresh,
  serverNow,
  initialSheet,
  preview,
}: {
  token: string;
  view: AcaraView;
  serverNow: string;
  initialSheet?: OpenSheet | null; // dari ?sheet=&sesi= (reload / buka ulang)
  preview?: Preview; // /dev/states/f4: tanpa LiveRefresh, jam beku, sheet/offline dipaksa
}) {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [sheet, setSheet] = useState<OpenSheet | null>(
    preview?.sheet ? { kind: preview.sheet, sessionId: preview.sessionId } : (initialSheet ?? null),
  );

  // HTML dari cache SW (offline) bisa lebih lama dari snapshot terakhir → pakai snapshot (rev
  // lebih tinggi); jam ikut selisih HP ↔ server yang tersimpan saat terakhir online.
  const savedRaw = useStored(snapKey(token), !preview);
  const skewRaw = useStored(SKEW_KEY, !preview);
  const saved = useMemo(() => parseSnapshot(savedRaw), [savedRaw]);
  const stale = !!saved && saved.rev > fresh.rev;
  const view = stale ? saved : fresh;
  const skew = skewRaw === null ? NaN : Number(skewRaw);
  const now = useServerNow(stale ? saved.loadedAt : serverNow, {
    frozen: !!preview,
    tickMs: 15_000,
    skewMs: stale && Number.isFinite(skew) ? skew : null,
  });

  // Data baru dari server → simpan sebagai snapshot + selisih jam.
  useEffect(() => {
    if (preview || stale) return;
    try {
      localStorage.setItem(snapKey(token), JSON.stringify(fresh));
      if (navigator.onLine)
        localStorage.setItem(SKEW_KEY, String(Date.parse(serverNow) - Date.now()));
    } catch {}
  }, [fresh, serverNow, token, preview, stale]);

  // Ilustrasi semua mode diunduh sekali (SW cache-first) supaya S01 & sesi berikutnya tetap ada
  // gambarnya walau sinyal putus.
  useEffect(() => {
    if (preview) return;
    const t = setTimeout(() => {
      for (const a of ARTS) fetch(artUrl(a)).catch(() => {});
    }, 1500);
    return () => clearTimeout(t);
  }, [preview]);

  // ?sheet=… di URL: back HP menutup sheet.
  useEffect(() => {
    if (preview) return;
    const read = () => {
      const q = new URL(window.location.href).searchParams;
      const kind = q.get("sheet") as SheetKind | null;
      setSheet(kind ? { kind, sessionId: q.get("sesi") ?? undefined } : null);
    };
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [preview]);

  const open = useCallback(
    (kind: SheetKind, sessionId?: string) => {
      setSheet({ kind, sessionId });
      if (preview) return;
      const url = new URL(window.location.href);
      url.searchParams.set("sheet", kind);
      if (sessionId) url.searchParams.set("sesi", sessionId);
      else url.searchParams.delete("sesi");
      history.pushState({ ...history.state, hmdSheet: true }, "", url);
    },
    [preview],
  );
  const close = useCallback(() => {
    setSheet(null);
    if (preview) return;
    if (history.state?.hmdSheet) return history.back();
    const url = new URL(window.location.href);
    url.searchParams.delete("sheet");
    url.searchParams.delete("sesi");
    history.replaceState(history.state, "", url);
  }, [preview]);

  const offline = preview?.offline ?? !online;
  const { active, next } = view;
  const talkshowLive = active?.type === "talkshow";
  const art = active ? active.art : offline ? "weak-signal" : "break";
  const total = view.sessions.length;
  const detailOf = (id?: string): SessionView | null =>
    view.sessions.find((s) => s.id === id) ?? active ?? next ?? null;

  return (
    <main className={styles.screen}>
      <div className={styles.art}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustrasi statis, cache SW */}
        <img src={artUrl(art)} alt="" className={styles.artImg} />
        <span aria-hidden className={styles.fade} />
      </div>

      <section className={styles.panel}>
        <Button
          iconOnly
          label="Foto buat kolase"
          icon={<Camera size={24} />}
          href={`/t/${token}/foto`}
          className={styles.fab}
        />

        {active ? (
          <header className={styles.header}>
            <div className={styles.status}>
              <Badge tone="live" pulse>
                Lagi jalan
              </Badge>
              <span className="t-label c-label-2">
                {active.room
                  ? `${active.room} · sampai ${active.endsAt}`
                  : `Sampai ${active.endsAt}`}
              </span>
            </div>
            <button
              type="button"
              className={styles.titleBtn}
              onClick={() => open("detail", active.id)}
              aria-label={`${active.title}, lihat detail sesi`}
            >
              <h1 className="t-title">{active.title}</h1>
            </button>
            {active.topic && <p className="t-body c-label-2">{active.topic}</p>}
            {active.speaker && (
              <button type="button" className={styles.speaker} onClick={() => open("pembicara")}>
                <span aria-hidden className={styles.speakerAvatar}>
                  {initials(active.speaker.name)}
                </span>
                <span className={styles.speakerText}>
                  <span className={styles.eyebrow}>Pembicara</span>
                  <span className="t-headline">{active.speaker.name}</span>
                  <span className="t-caption c-label-2">@{active.speaker.ig}</span>
                </span>
                <span aria-hidden className={styles.speakerGo}>
                  <CaretRight size={14} />
                </span>
              </button>
            )}
          </header>
        ) : (
          <header className={styles.header}>
            <div className={styles.status}>
              <Badge tone="neutral">Lagi jeda</Badge>
              <span className="t-label c-label-2">Rumah baru Potara</span>
            </div>
            <h1 className="t-title">Jeda dulu, ngopi</h1>
          </header>
        )}

        <JejakAcara
          stamps={stampsOf(view)}
          caption={
            active ? `Sesi ${active.no} dari ${total}` : `${view.done} dari ${total} selesai`
          }
        />

        {!active && next && (
          <NextTicket session={next} date={view.eventDate} now={now} onOpen={open} />
        )}
        {!active && view.finale && (
          <p className={cx("t-label c-label-2", styles.finale)}>
            Semua sesi udah selesai. Bentar lagi buku tamu kebuka.
          </p>
        )}

        <nav className={styles.shortcuts} aria-label="Pintasan">
          <button type="button" className={styles.tile} onClick={() => open("tamu")}>
            <Users size={22} />
            <span className="t-caption">Tamu</span>
          </button>
          <button type="button" className={styles.tile} onClick={() => open("rundown")}>
            <ListBullets size={22} />
            <span className="t-caption">Rundown</span>
          </button>
          <Link href={`/t/${token}/galeri`} className={styles.tile}>
            <ImageIcon size={22} />
            <span className="t-caption">Galeri</span>
          </Link>
          {talkshowLive ? (
            <Link href={`/t/${token}/tanya`} className={cx(styles.tile, styles.tileHot)}>
              <ChatCircle size={22} />
              <span className="t-caption">Tanya</span>
            </Link>
          ) : (
            <span
              role="link"
              aria-disabled="true"
              aria-label="Tanya (aktif pas Talkshow)"
              className={cx(styles.tile, styles.tileOff)}
            >
              <ChatCircle size={22} />
              <span className="t-caption">Tanya</span>
            </span>
          )}
        </nav>
      </section>

      {offline && (
        <TopToast
          icon={<WifiSlash size={20} />}
          title="Sinyal lagi lemah"
          action={{
            label: "Coba lagi",
            icon: <ArrowClockwise size={20} />,
            onClick: () => router.refresh(),
          }}
        >
          Info sesi terakhir {timeWib(view.loadedAt)}. Kuncimu tetap bisa dipakai.
        </TopToast>
      )}

      {sheet?.kind === "detail" && detailOf(sheet.sessionId) && (
        <DetailSheet session={detailOf(sheet.sessionId)!} now={now} onClose={close} />
      )}
      {sheet?.kind === "pembicara" && (active ?? next)?.speaker && (
        <SpeakerSheet session={(active?.speaker ? active : next)!} onClose={close} />
      )}
      {sheet?.kind === "rundown" && (
        <RundownSheet
          sessions={view.sessions}
          onClose={close}
          onPick={(id) => {
            setSheet({ kind: "detail", sessionId: id });
            if (!preview) {
              const url = new URL(window.location.href);
              url.searchParams.set("sheet", "detail");
              url.searchParams.set("sesi", id);
              history.replaceState(history.state, "", url);
            }
          }}
        />
      )}
      {sheet?.kind === "tamu" && <TamuSheet token={token} view={view} onClose={close} />}

      {!preview && <LiveRefresh token={token} pollMs={2000} onHealth={setOnline} />}
    </main>
  );
}

// BT03 kartu tiket Berikutnya: countdown ke jam mulai terjadwal (menit dibulatkan ke atas).
function NextTicket({
  session,
  date,
  now,
  onOpen,
}: {
  session: SessionView;
  date: string;
  now: number;
  onOpen: (kind: SheetKind, id?: string) => void;
}) {
  const c = countdownParts(minutesUntil(date, session.startsAt, now));
  return (
    <TicketNext
      value={c.value}
      unit={c.unit}
      soon={c.soon}
      eyebrow={["Berikutnya", session.startsAt, session.room].filter(Boolean).join(" · ")}
      title={session.title}
      speaker={session.speaker}
      onClick={() => onOpen("detail", session.id)}
    />
  );
}
