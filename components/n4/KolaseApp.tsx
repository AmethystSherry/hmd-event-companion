"use client";

import { useRouter } from "next/navigation";
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
  Info,
  Lightning,
  X,
} from "@/components/icons";
import { Button, Card, IconButton, NumberedRow, Pill, Polaroid, Toast } from "@/components/ui";
import { cx } from "@/lib/cx";
import { queuePhoto } from "@/lib/offline/photoDb";
import { guestPhotoUrl, isInAppBrowser, newPhotoId } from "@/lib/photo";
import { captureFile, captureVideo, type Captured } from "./capture";
import s from "./n4.module.css";
import { useCamera, type CameraStatus } from "./useCamera";
import { sendPhoto } from "./usePhotoOutbox";

// N4 · BT06 Kamera kolase (+BT06b izin ditolak). Jepret → foto masuk antrean IndexedDB dulu →
// dikirim, ditunggu ≤ 5 dtk (shutter loading) → kamera dimatikan → layar acara + sheet hasil
// (/acara?sheet=foto&id=…, BT07/BT07b/BT07e). Ditolak server → toast, tetap di kamera.

const UPLOAD_WAIT_MS = 5000; // lewat → sheet BT07b, antrean lanjut di layar acara
const TOAST_MS = 4000;

const STEPS = [
  "Tap ikon aA / gembok di address bar",
  "Izin situs › Kamera › Izinkan",
  "Balik ke sini, tap Coba lagi",
];

const noSubscribe = () => () => {};

export function KolaseApp({
  token,
  name,
  date,
  backHref,
  lastOwnId,
  preview,
}: {
  token: string;
  name: string; // nama depan di caption polaroid
  date: string; // "8.11.26"
  backHref: string; // layar acara
  lastOwnId: string | null; // thumbnail kiri = foto terakhirmu
  // /dev/states/n4: tanpa kamera/jaringan/IndexedDB.
  preview?: { camera?: CameraStatus };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [flash, setFlash] = useState(0);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const sheetHref = (id: string) => `/t/${token}/acara?sheet=foto&id=${id}`;

  // Webview Instagram/Facebook: getUserMedia sering nggak jalan → langsung kamera bawaan HP.
  const inApp = useSyncExternalStore(
    noSubscribe,
    () => isInAppBrowser(navigator.userAgent),
    () => false,
  );
  const cam = useCamera(video, !preview && !inApp && !leaving);
  const status: CameraStatus = preview
    ? (preview.camera ?? "live")
    : inApp
      ? "unsupported"
      : cam.status;
  const denied = status === "denied";
  const fallback = status === "unsupported" || status === "error";

  const show = useCallback((text: string) => setToast({ key: Date.now(), text }), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  // Jepret → simpan di antrean dulu (foto aman walau sinyal putus) → kirim, tunggu ≤ 5 dtk →
  // kamera mati → sheet hasil. Status pasti (✓ / ⌛) dibaca sheet dari server + antrean.
  async function keep(cap: Captured) {
    const row = { id: newPhotoId(), token, ...cap, createdAt: Date.now() };
    await queuePhoto(row);
    const r = await sendPhoto(row, UPLOAD_WAIT_MS);
    if (r.kind === "rejected") {
      show(r.res.error);
      return;
    }
    setLeaving(true);
    router.replace(sheetHref(row.id));
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
    if (busy || leaving || preview) return;
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
          ) : preview || leaving ? undefined : (
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
              : "Jepret sekali, langsung nempel di kulkas bareng."}
          </p>
        )}
      </div>

      {denied ? (
        <div className={s.deniedPanel} data-theme="light">
          <Card className={s.steps}>
            <p className="t-body-emph">Cara nyalain izin kamera</p>
            <div>
              {STEPS.map((step, i) => (
                <NumberedRow key={step} size="sm" number={i + 1} title={step} />
              ))}
            </div>
          </Card>
          <Button icon={<ArrowClockwise />} onClick={cam.retry}>
            Coba lagi
          </Button>
          <Button variant="secondary" icon={<Camera />} onClick={() => fileInput.current?.click()}>
            Pakai kamera HP
          </Button>
        </div>
      ) : (
        <div className={s.bar}>
          {lastOwnId ? (
            <button
              type="button"
              className={s.last}
              onClick={() => router.push(sheetHref(lastOwnId))}
              aria-label="Lihat foto terakhirmu"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- route proxy */}
              {!preview && <img src={guestPhotoUrl(token, lastOwnId)} alt="" />}
            </button>
          ) : (
            <span aria-hidden className={s.barSpacer} />
          )}
          <button
            type="button"
            className={cx(s.shutter, (busy || leaving) && s.sending)}
            onClick={shoot}
            aria-label={busy || leaving ? "Lagi ngirim foto" : "Jepret"}
            aria-busy={busy || leaving}
            aria-disabled={busy || leaving || (!fallback && status !== "live")}
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
      <input ref={fileInput} type="file" accept="image/*" capture="user" hidden onChange={onFile} />
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
