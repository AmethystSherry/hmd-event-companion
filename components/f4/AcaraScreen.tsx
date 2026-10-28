"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  ArrowClockwise,
  Camera,
  CaretRight,
  ChatCircle,
  Check,
  ListBullets,
  Users,
  WifiSlash,
} from "@/components/icons";
import { LiveRefresh } from "@/components/LiveRefresh";
import { GaleriSheet } from "@/components/n4/GaleriSheet";
import { NempelSheet, nempelStatus, type NempelStatus } from "@/components/n4/NempelSheet";
import { TanyaSheet, type TanyaPreview } from "@/components/n1/TanyaSheet";
import type { MyQuestion } from "@/lib/questions";
import { KartuSheet, type KartuPreview } from "@/components/n3/KartuSheet";
import { usePhotoOutbox } from "@/components/n4/usePhotoOutbox";
import {
  ArtVideo,
  Badge,
  Button,
  EventTickets,
  GuestTabBar,
  PhotoStack,
  TopToast,
  type StackPhoto,
} from "@/components/ui";
import { ART_VIDEO } from "@/lib/artVideo";
import { useServerNow } from "@/components/useServerNow";
import type { AcaraView } from "@/lib/acara";
import { cx } from "@/lib/cx";
import { initials, timeWib } from "@/lib/format";
import type { GuestCard } from "@/lib/data/types";
import type { QueuedPhoto } from "@/lib/offline/photoDb";
import { guestPhotoUrl, type GuestPhotos } from "@/lib/photo";
import type { SessionView } from "@/lib/rundown";
import { DetailSheet, RundownSheet, SpeakerSheet, TamuSheet, type SheetKind } from "./Sheets";
import styles from "./f4.module.css";

// F4 · layar acara tamu (/t/[token]/acara): satu layar, dua mode dari state acara (prd §6).
// SESI = BT20 Open space · BT21 Talkshow · BT23 Tur kantor · BT24 Closing; JEDA = BT03 (+ jeda
// terakhir, sebelum sesi 1, BT03s "Bentar lagi mulai"). Panitia Mulai/Selesaikan → rev naik → SSE/
// poll 2 dtk → router.refresh. v3 (26 Okt): header cuma badge "Sedang berjalan"/"Sedang jeda",
// Tiket acara (geser) ganti Jejak acara + kartu countdown (K13); tap tiket → BT22 sesi itu.
// Sheet BT22/BT21p/BT04/BT05 dibuka lewat `?sheet=` (pushState) supaya back HP menutupnya.
// N4: sheet hasil foto (?sheet=foto&id=…, dari kamera) & Galeri (?sheet=galeri); antrean foto
// dikirim dari sini (terkirim → router.refresh → sheet BT07b berubah ke BT07).
// N1: sheet Tanya pembicara (?sheet=tanya) cuma selagi Talkshow jalan; sesi pindah → sheet nutup.
// N3: sheet Kartu kamu (?sheet=kartu) dibuka dari BT05; back/tutup → balik ke BT05, simpan → BT05 +
// toast gelap T11s (kartu baru langsung tampil sebelum data server masuk).
// Offline (S01): toast atas + layar dari data terakhir (snapshot localStorage kalau HTML-nya dari
// cache SW lebih lama). Layar ini nggak memanggil server sendiri selain LiveRefresh.

const ARTS = ["open-space", "talkshow", "office-tour", "closing", "break", "weak-signal"] as const;
const artUrl = (art: string) => `/figma/f3-${art}.webp`;
const snapKey = (token: string) => `hmd-acara:${token}`;
const SKEW_KEY = "hmd-acara-skew";

type Preview = {
  sheet?: SheetKind;
  sessionId?: string;
  photoId?: string;
  offline?: boolean;
  photo?: { status: NempelStatus; pending?: number; extraToast?: boolean }; // /dev/states/n4
  galeri?: { pending?: string }; // /dev/states/n4 BT07dh: foto ini disembunyikan + toast Batalkan
  tanya?: TanyaPreview; // /dev/states/n1
  kartu?: KartuPreview & { saved?: boolean; query?: string }; // /dev/states/n3 (T11s, BT05b)
};
type OpenSheet = { kind: SheetKind; sessionId?: string; photoId?: string };

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
  photos,
  questions = [],
  serverNow,
  initialSheet,
  preview,
}: {
  token: string;
  view: AcaraView;
  questions?: MyQuestion[]; // N1: riwayat pertanyaan tamu ini (sheet Tanya)
  photos: GuestPhotos; // N4: foto sendiri + ringkasan tamu lain (sheet foto & galeri)
  serverNow: string;
  initialSheet?: OpenSheet | null; // dari ?sheet=&sesi= (reload / buka ulang)
  preview?: Preview; // /dev/states/f4: tanpa LiveRefresh, jam beku, sheet/offline dipaksa
}) {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [talkEnded, setTalkEnded] = useState(false); // N1: kirim ditolak, talkshow keburu selesai
  const [sheet, setSheet] = useState<OpenSheet | null>(
    preview?.sheet
      ? { kind: preview.sheet, sessionId: preview.sessionId, photoId: preview.photoId }
      : (initialSheet ?? null),
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
      setSheet(
        kind
          ? { kind, sessionId: q.get("sesi") ?? undefined, photoId: q.get("id") ?? undefined }
          : null,
      );
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
  // N3 · T11 di atas BT05: dari BT05 = pushState (back HP balik ke BT05); dibuka langsung (link
  // /kartu, reload) → tutup = ganti URL ke ?sheet=tamu.
  const openKartu = useCallback(() => {
    setSheet({ kind: "kartu" });
    if (preview) return;
    const url = new URL(window.location.href);
    url.searchParams.set("sheet", "kartu");
    history.pushState({ ...history.state, hmdSheet: true, hmdFromTamu: true }, "", url);
  }, [preview]);
  const backToTamu = useCallback(() => {
    setSheet({ kind: "tamu" });
    if (preview) return;
    if (history.state?.hmdFromTamu) return history.back();
    const url = new URL(window.location.href);
    url.searchParams.set("sheet", "tamu");
    history.replaceState({ ...history.state, hmdFromTamu: false }, "", url);
  }, [preview]);
  // Kartu yang baru disimpan dipakai selama data server masih rev lama.
  const [savedCard, setSavedCard] = useState<{ card: GuestCard; rev: number } | null>(null);
  const [cardToast, setCardToast] = useState(!!preview?.kartu?.saved);
  useEffect(() => {
    if (!cardToast || preview) return;
    const t = setTimeout(() => setCardToast(false), 3000);
    return () => clearTimeout(t);
  }, [cardToast, preview]);

  const close = useCallback(() => {
    setSheet(null);
    if (preview) return;
    if (history.state?.hmdSheet) return history.back();
    const url = new URL(window.location.href);
    url.searchParams.delete("sheet");
    url.searchParams.delete("sesi");
    url.searchParams.delete("id");
    history.replaceState(history.state, "", url);
  }, [preview]);
  // Navbar (tetap kelihatan di atas sheet): tab yang kebuka → tutup; sheet lain kebuka → ganti
  // sheet di entri riwayat yang sama (back HP tetap langsung balik ke layar acara).
  const toggle = (kind: SheetKind) => {
    const current = sheet?.kind === "kartu" ? "tamu" : sheet?.kind;
    if (current === kind) return close();
    if (!sheet || preview) return open(kind);
    setSheet({ kind });
    const url = new URL(window.location.href);
    url.searchParams.set("sheet", kind);
    url.searchParams.delete("sesi");
    url.searchParams.delete("id");
    history.replaceState({ ...history.state, hmdFromTamu: false }, "", url);
  };

  // N4 · antrean foto (BT07b): satu pengirim untuk layar ini, foto terkirim → data server baru.
  const outbox = usePhotoOutbox(token, {
    enabled: !preview,
    onResult: (r) => r.kind === "sent" && router.refresh(),
  });
  const previewQueued = useMemo<QueuedPhoto[]>(
    () =>
      Array.from({ length: preview?.photo?.pending ?? 0 }, (_, i) => ({
        id: i === 0 && preview?.photoId ? preview.photoId : `antre-${i}`,
        token,
        photo: new Blob(),
        thumb: new Blob(),
        width: 0,
        height: 0,
        createdAt: 0,
      })),
    [preview, token],
  );
  const queued = preview ? previewQueued : outbox.queued;
  // Tumpukan galeri: foto antre (Blob di HP) + foto terkirim (thumbnail proxy), terbaru dulu.
  const waiting = useMemo(
    () =>
      queued
        .filter((q) => !photos.mine.some((m) => m.id === q.id))
        .sort((a, b) => b.createdAt - a.createdAt),
    [queued, photos.mine],
  );
  const waitingUrls = useMemo(
    () => waiting.map((q) => (q.thumb.size ? URL.createObjectURL(q.thumb) : undefined)),
    [waiting],
  );
  useEffect(() => () => waitingUrls.forEach((u) => u && URL.revokeObjectURL(u)), [waitingUrls]);
  const stack: StackPhoto[] = [
    ...waiting.map((q, i) => ({ id: q.id, src: waitingUrls[i] })),
    ...photos.mine.map((m) => ({
      id: m.id,
      src: preview ? undefined : guestPhotoUrl(token, m.id),
    })),
  ];
  const photoId = sheet?.kind === "foto" ? sheet.photoId : undefined;
  const photoStatus = photoId
    ? (preview?.photo?.status ?? nempelStatus(photoId, photos, queued))
    : null;

  const offline = preview?.offline ?? !online;
  const { active, next } = view;

  // BT03s: jam mulai sesi berikutnya lewat tanpa ada perubahan rev → ambil data baru tepat di jam
  // itu (jam server), supaya judul & tiket pindah ke "sebentar lagi mulai" sendiri.
  useEffect(() => {
    if (preview || stale || !view.soonAt) return;
    const skewNow = Date.parse(serverNow) - Date.now();
    const wait = Date.parse(view.soonAt) - (Date.now() + skewNow) + 500;
    const t = setTimeout(() => router.refresh(), Math.min(Math.max(wait, 0), 2 ** 31 - 1));
    return () => clearTimeout(t);
  }, [preview, stale, view.soonAt, serverNow, router]);
  const talkshowLive = active?.type === "talkshow";
  const art = active ? active.art : offline ? "weak-signal" : "break";
  const total = view.sessions.length;
  // N1 · talkshow selesai (rev → refresh) pas sheet Tanya kebuka → sheet ikut nutup (state saat
  // render, ?sheet=tanya dibuang dari URL di efek).
  if (sheet?.kind === "tanya" && !talkshowLive) setSheet(null);
  const tanyaOpen = sheet?.kind === "tanya";
  useEffect(() => {
    if (preview || talkshowLive) return;
    const url = new URL(window.location.href);
    if (url.searchParams.get("sheet") !== "tanya") return;
    url.searchParams.delete("sheet");
    history.replaceState(history.state, "", url);
  }, [preview, talkshowLive]);
  useEffect(() => {
    if (!talkEnded) return;
    const t = setTimeout(() => setTalkEnded(false), 4000);
    return () => clearTimeout(t);
  }, [talkEnded]);

  const me = savedCard && savedCard.rev === view.rev ? { ...view.me, ...savedCard.card } : view.me;

  const detailOf = (id?: string): SessionView | null =>
    view.sessions.find((s) => s.id === id) ?? active ?? next ?? null;

  return (
    <main className={styles.screen}>
      <div className={styles.art}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustrasi statis, cache SW */}
        <img src={artUrl(art)} alt="" className={styles.artImg} />
        {/* Sinyal kuat → video ilustrasi; lemah / offline (S01) → gambar saja. */}
        <ArtVideo fit={ART_VIDEO[`f3-${art}`]} enabled={!offline} />
        <span aria-hidden className={styles.fade} />
      </div>

      <section className={styles.panel}>
        {/* Galeri = tumpukan fotomu (terbaru di atas + jumlah) di samping tombol kamera; kosong = kartu ikon. */}
        <div className={styles.fabs}>
          <PhotoStack
            photos={stack}
            count={stack.length}
            label={
              stack.length
                ? `Galeri foto · ${stack.length} foto kamu`
                : "Galeri foto · belum ada foto"
            }
            onClick={() => open("galeri")}
          />
          <Button
            iconOnly
            label="Foto buat kolase"
            icon={<Camera size={24} />}
            href={`/t/${token}/foto`}
          />
        </div>

        {active ? (
          <header className={styles.header}>
            <div className={styles.status}>
              <Badge tone="live" pulse>
                Sedang berjalan
              </Badge>
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
              <Badge tone="neutral">Sedang jeda</Badge>
            </div>
            <h1 className="t-title">{view.soon ? "Bentar lagi mulai" : "Jeda dulu, ngopi"}</h1>
          </header>
        )}

        <EventTickets
          tickets={view.tickets}
          caption={
            active ? `Sesi ${active.no} dari ${total}` : `${view.done} dari ${total} selesai`
          }
          onOpen={(id) => open("detail", id)}
        />

        {!active && view.finale && (
          <p className={cx("t-label c-label-2", styles.finale)}>
            Semua sesi udah selesai. Bentar lagi buku tamu kebuka.
          </p>
        )}
      </section>

      {/* Navbar di luar panel (panel punya z-index sendiri) supaya tetap di atas sheet. */}
      <GuestTabBar
        className={styles.nav}
        active={sheet?.kind === "kartu" ? "tamu" : (sheet?.kind ?? null)}
        ask={{
          label: "Tanya pembicara",
          icon: <ChatCircle size={24} />,
          onClick: () => toggle("tanya"),
          disabled: !talkshowLive,
          hint: "Tanya (aktif pas Talkshow)",
        }}
        tabs={[
          { id: "tamu", label: "Tamu", icon: <Users size={22} />, onClick: () => toggle("tamu") },
          {
            id: "rundown",
            label: "Rundown",
            icon: <ListBullets size={22} />,
            onClick: () => toggle("rundown"),
          },
        ]}
      />

      {/* N3: di sheet Kartu kamu toast gagal simpan yang tampil (posisi sama). */}
      {offline && sheet?.kind !== "kartu" && (
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
      {sheet?.kind === "tamu" && (
        <TamuSheet
          view={view}
          me={me}
          onClose={close}
          onEdit={openKartu}
          initialQuery={preview?.kartu?.query}
        />
      )}
      {sheet?.kind === "kartu" && (
        <KartuSheet
          token={token}
          me={me}
          onClose={backToTamu}
          onSaved={(card) => {
            setSavedCard({ card, rev: view.rev });
            backToTamu();
            setCardToast(true);
            router.refresh();
          }}
          onEventClosed={() => {
            close();
            router.refresh(); // acara ditutup → server mengalihkan ke BT12
          }}
          preview={preview?.kartu}
        />
      )}
      {cardToast && (
        <TopToast
          tone="dark"
          icon={<Check size={18} />}
          title="Kartu kamu kesimpan. Tamu lain bisa lihat sekarang."
        />
      )}
      {tanyaOpen && active && (
        <TanyaSheet
          token={token}
          session={active}
          history={questions}
          serverNow={serverNow}
          onClose={close}
          onEnded={() => {
            close();
            setTalkEnded(true);
            router.refresh();
          }}
          preview={preview ? (preview.tanya ?? {}) : undefined}
        />
      )}
      {talkEnded && (
        <TopToast icon={<ChatCircle size={20} />} title="Sesi talkshow udah selesai">
          Pertanyaan baru bisa dikirim pas talkshow jalan.
        </TopToast>
      )}
      {photoId && photoStatus && (
        <NempelSheet
          token={token}
          data={photos}
          photoId={photoId}
          status={photoStatus}
          queued={queued}
          onRetry={async () => (await outbox.flush()).some((r) => r.kind === "sent")}
          onClose={close}
          preview={preview ? { extraToast: preview.photo?.extraToast } : undefined}
        />
      )}
      {sheet?.kind === "galeri" && (
        <GaleriSheet
          token={token}
          data={photos}
          queued={queued}
          onRetry={outbox.flush}
          onClose={close}
          onDeleted={() => router.refresh()}
          preview={preview ? { pending: preview.galeri?.pending } : undefined}
        />
      )}

      {!preview && <LiveRefresh token={token} pollMs={2000} onHealth={setOnline} />}
    </main>
  );
}
