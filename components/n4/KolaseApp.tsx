"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import {
  ArrowClockwise,
  Camera,
  CameraRotate,
  CameraSlash,
  Check,
  CloudArrowUp,
  Hourglass,
  Info,
  Lightning,
  X,
} from "@/components/icons";
import {
  Button,
  Card,
  IconButton,
  NumberedRow,
  PhotoStrip,
  Pill,
  Polaroid,
  Screen,
  TextAction,
  Toast,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import type { PhotoSummary } from "@/lib/data/types";
import { queuePhoto } from "@/lib/offline/photoDb";
import { guestPhotoUrl, isInAppBrowser, newPhotoId, photoTilt } from "@/lib/photo";
import { captureFile, captureVideo, type Captured } from "./capture";
import s from "./n4.module.css";
import { useCamera, type CameraStatus } from "./useCamera";
import { sendPhoto, usePhotoOutbox, type SendResult } from "./usePhotoOutbox";

// N4 · Foto buat kolase polaroid (tamu). Satu komponen untuk BT06 Kamera kolase (+BT06b izin
// ditolak) dan BT07 Foto masuk kolase (+BT07b diantre, BT07c tap "+N"). Pindah layar lewat
// history.pushState (?layar=hasil) tanpa jaringan, seperti DoorApp F2.

export type KolaseView = "kamera" | "hasil";

export type KolaseResult = {
  kind: "sent" | "queued";
  id: string;
  src?: string; // blob: (baru jepret) atau URL proxy (foto terakhir dari server)
};

const UPLOAD_WAIT_MS = 5000; // lewat → BT07b, antrean lanjut di belakang
const TOAST_MS = 4000;

const STEPS = [
  "Tap ikon aA / gembok di address bar",
  "Pilih Izin situs › Kamera › Izinkan",
  "Balik ke sini, lalu tap Coba lagi",
];

const noSubscribe = () => () => {};

function pickSummary(r: Extract<SendResult, { kind: "sent" }>["res"]): PhotoSummary {
  return { total: r.total, others: r.others, latest: r.latest, mine: r.mine };
}

export function KolaseApp({
  token,
  name,
  date,
  endsAt,
  backHref,
  summary: initialSummary,
  lastOwnId,
  preview,
}: {
  token: string;
  name: string; // nama depan di caption polaroid
  date: string; // "8.11.26"
  endsAt: string; // "17.00" (toast BT07c)
  backHref: string; // layar acara
  summary: PhotoSummary;
  lastOwnId: string | null;
  // /dev/states/n4: data contoh, tanpa kamera/jaringan/IndexedDB.
  preview?: {
    view: KolaseView;
    camera?: CameraStatus;
    result?: KolaseResult;
    pending?: number;
    extraToast?: boolean;
  };
}) {
  const base = `/t/${token}/foto`;
  const [view, setView] = useState<KolaseView>(preview?.view ?? "kamera");
  const [result, setResult] = useState<KolaseResult | null>(
    preview?.result ??
      (lastOwnId
        ? { kind: "sent", id: lastOwnId, src: guestPhotoUrl(token, lastOwnId, "full") }
        : null),
  );
  const [summary, setSummary] = useState(initialSummary);
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState(0);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(
    preview?.extraToast
      ? { key: 0, text: `Kolase lengkap dibuka pas acara selesai (± ${endsAt})` }
      : null,
  );
  const [extraPressed, setExtraPressed] = useState(!!preview?.extraToast);
  const blobs = useRef<string[]>([]);
  const video = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  // Webview Instagram/Facebook: getUserMedia sering nggak jalan → langsung kamera bawaan HP.
  const inApp = useSyncExternalStore(
    noSubscribe,
    () => isInAppBrowser(navigator.userAgent),
    () => false,
  );
  const cam = useCamera(video, !preview && view === "kamera" && !inApp);
  const status: CameraStatus = preview
    ? (preview.camera ?? "live")
    : inApp
      ? "unsupported"
      : cam.status;
  const denied = status === "denied";
  const fallback = status === "unsupported" || status === "error";

  const show = useCallback((text: string) => setToast({ key: Date.now(), text }), []);
  useEffect(() => {
    if (!toast || preview) return;
    const t = setTimeout(() => {
      setToast(null);
      setExtraPressed(false);
    }, TOAST_MS);
    return () => clearTimeout(t);
  }, [toast, preview]);

  useEffect(() => () => blobs.current.forEach((u) => URL.revokeObjectURL(u)), []);

  // Antrean di belakang: foto BT07b yang akhirnya terkirim → layar pindah ke BT07.
  const onResult = useCallback(
    (r: SendResult) => {
      if (r.kind === "sent") {
        setSummary(pickSummary(r.res));
        setResult((cur) =>
          cur?.kind === "queued" && cur.id === r.res.id ? { ...cur, kind: "sent" } : cur,
        );
      } else if (r.kind === "rejected") {
        show(r.res.error);
      }
    },
    [show],
  );
  const outbox = usePhotoOutbox(token, { enabled: !preview, onResult });
  const pending = preview?.pending ?? outbox.pending;

  const go = useCallback(
    (next: KolaseView) => {
      setView(next);
      setToast(null);
      setExtraPressed(false);
      if (preview) return;
      window.history.pushState(null, "", next === "hasil" ? `${base}?layar=hasil` : base);
    },
    [base, preview],
  );
  useEffect(() => {
    const onPop = () =>
      setView(window.location.search.includes("layar=hasil") ? "hasil" : "kamera");
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Jepret → simpan di antrean dulu (foto aman walau sinyal putus) → kirim, tunggu ≤ 5 dtk.
  async function keep(cap: Captured) {
    const row = { id: newPhotoId(), token, ...cap, createdAt: Date.now() };
    await queuePhoto(row);
    const r = await sendPhoto(row, UPLOAD_WAIT_MS);
    await outbox.refreshCount();
    if (r.kind === "rejected") {
      show(r.res.error);
      return;
    }
    const src = URL.createObjectURL(cap.photo);
    blobs.current.push(src);
    if (r.kind === "sent") setSummary(pickSummary(r.res));
    setResult({ kind: r.kind === "sent" ? "sent" : "queued", id: row.id, src });
    go("hasil");
  }

  async function run(task: () => Promise<Captured>) {
    setBusy(true);
    try {
      await keep(await task());
    } catch {
      show("Fotonya gagal diambil, coba lagi");
    } finally {
      setBusy(false);
    }
  }

  function shoot() {
    if (busy || preview) return;
    if (fallback) return fileInput.current?.click();
    const el = video.current;
    if (status !== "live" || !el?.videoWidth) return;
    setFlash((n) => n + 1);
    void run(() => captureVideo(el));
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void run(() => captureFile(file));
  }

  async function retryNow() {
    if (busy || preview) return;
    setBusy(true);
    try {
      const results = await outbox.flush();
      if (!results.some((r) => r.kind === "sent")) {
        show("Sinyalnya masih lemah. Fotomu tetap aman di HP");
      }
    } finally {
      setBusy(false);
    }
  }

  const fileField = (
    <input ref={fileInput} type="file" accept="image/*" capture="user" hidden onChange={onFile} />
  );

  if (view === "hasil" && result) {
    const queued = result.kind === "queued";
    const strip = summary.latest.map((id) => ({
      id,
      src: preview ? undefined : guestPhotoUrl(token, id),
    }));
    const extra = summary.others - strip.length;
    return (
      <>
        <Screen
          bottomHeight={118}
          bottom={
            <>
              {queued ? (
                <Button icon={<ArrowClockwise />} onClick={retryNow} aria-disabled={busy}>
                  Coba kirim sekarang
                </Button>
              ) : (
                <Button icon={<Camera />} onClick={() => go("kamera")}>
                  Foto lagi
                </Button>
              )}
              <Button variant="secondary" href={backHref}>
                Kembali ke acara
              </Button>
            </>
          }
        >
          <div className={s.result}>
            <Polaroid
              key={result.id}
              size="sm"
              src={result.src}
              alt="Fotomu"
              name={name}
              tilt={photoTilt(result.id)}
              dim={queued}
              className={s.drop}
            />
            <span className={cx(s.badge, queued ? s.badgeQueued : s.badgeSent)}>
              {queued ? <CloudArrowUp size={22} /> : <Check size={22} />}
            </span>
            <h1 className="t-title">{queued ? "Fotomu lagi antre" : "Nempel di kulkas!"}</h1>
            <p className={cx("t-body c-label-2", s.body)}>
              {queued
                ? "Sinyalnya lemah. Fotomu aman di HP dan dikirim otomatis begitu sinyal balik."
                : summary.others > 0
                  ? `Fotomu sekarang bagian dari kolase bareng ${summary.others} foto tamu lain.`
                  : "Kamu yang pertama nempel di kulkas!"}
            </p>
            {queued && pending > 0 && (
              <Pill icon={<Hourglass />}>{pending} foto menunggu sinyal</Pill>
            )}
            <PhotoStrip
              photos={strip}
              extra={extra}
              pressed={extraPressed}
              onExtra={() => {
                setExtraPressed(true);
                show(`Kolase lengkap dibuka pas acara selesai (± ${endsAt})`);
              }}
            />
          </div>
        </Screen>
        {toast && (
          <div className={s.toastDock}>
            <Toast key={toast.key} icon={<Info />}>
              {toast.text}
            </Toast>
          </div>
        )}
      </>
    );
  }

  return (
    <div className={s.camera} data-theme="dark">
      <header className={s.toolbar}>
        <IconButton variant="glass" href={backHref} label="Tutup kamera" icon={<X />} />
        <Pill glass icon={<span className={s.dot} />}>
          Kulkas polaroid
        </Pill>
        {status === "live" && cam.torch.supported ? (
          <IconButton
            variant="glass"
            label={cam.torch.on ? "Matikan senter" : "Nyalakan senter"}
            aria-pressed={cam.torch.on}
            icon={<Lightning weight={cam.torch.on ? "fill" : "regular"} />}
            onClick={cam.toggleTorch}
          />
        ) : (
          <span aria-hidden className={s.toolbarSpacer} />
        )}
      </header>

      <div className={s.stage}>
        <Polaroid name={name} date={date} className={s.viewfinder}>
          {denied ? (
            <div className={s.denied}>
              <CameraSlash size={40} />
              <p className="t-body-emph">Kamera belum diizinkan</p>
            </div>
          ) : fallback ? (
            <div className={s.fallback}>
              <Camera size={32} />
              <p className="t-label">Tap tombol jepret buat buka kamera HP</p>
            </div>
          ) : preview ? undefined : (
            <video
              ref={video}
              muted
              playsInline
              autoPlay
              aria-label="Kamera kolase"
              className={cx(cam.facing === "user" && s.mirror)}
            />
          )}
          {flash > 0 && <span key={flash} aria-hidden className={s.flash} />}
        </Polaroid>
        {!denied && (
          <p className={cx("t-label", s.hint)}>
            {inApp
              ? "Buka di Safari/Chrome biar kamera langsung jalan di sini."
              : "Fotomu langsung nempel di kolase bareng."}
          </p>
        )}
      </div>

      {denied ? (
        <div className={s.deniedPanel}>
          <div className={s.lightGroup} data-theme="light">
            <Card className={s.steps}>
              <p className="t-body-emph">Cara nyalain izin kamera</p>
              <div>
                {STEPS.map((step, i) => (
                  <NumberedRow key={step} size="sm" number={i + 1} title={step} />
                ))}
              </div>
            </Card>
            <Button variant="secondary" icon={<ArrowClockwise />} onClick={cam.retry}>
              Coba lagi
            </Button>
          </div>
          <TextAction onClick={() => fileInput.current?.click()}>Pakai kamera bawaan HP</TextAction>
        </div>
      ) : (
        <div className={s.bar}>
          {result?.src ? (
            <button
              type="button"
              className={s.last}
              onClick={() => go("hasil")}
              aria-label="Lihat foto terakhirmu"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- blob: / route proxy */}
              <img src={result.src} alt="" />
            </button>
          ) : (
            <span aria-hidden className={s.barSpacer} />
          )}
          <button
            type="button"
            className={s.shutter}
            onClick={shoot}
            aria-label="Jepret"
            aria-disabled={busy || (!fallback && status !== "live")}
          >
            <span />
          </button>
          {status === "live" ? (
            <button type="button" className={s.flip} onClick={cam.flip} aria-label="Ganti kamera">
              <CameraRotate size={22} />
            </button>
          ) : (
            <span aria-hidden className={s.barSpacer} />
          )}
        </div>
      )}
      {fileField}
      {toast && (
        <div className={s.toastDock}>
          <Toast key={toast.key} icon={<Info />}>
            {toast.text}
          </Toast>
        </div>
      )}
    </div>
  );
}
