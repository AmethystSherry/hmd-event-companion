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
  ArrowCounterClockwise,
  Camera,
  CameraRotate,
  CameraSlash,
  Check,
  DownloadSimple,
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
import { saveFile } from "../f5/saveImage";
import { sendPhoto } from "./usePhotoOutbox";

// N4 · BT06 Kamera kolase (+BT06b izin ditolak). Jepret → pratinjau hasil (28 Okt): "Tempel ke
// kulkas" / "Ulangi" / "Simpan" (ke HP, tanpa ngirim). Tempel → foto masuk antrean IndexedDB dulu →
// dikirim, ditunggu ≤ 5 dtk (loading) → kamera dimatikan → layar acara + sheet hasil
// (/acara?sheet=foto&id=…, BT07/BT07b/BT07e). Ditolak server → toast, tetap di pratinjau.

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
  preview?: { camera?: CameraStatus; review?: string }; // review = URL gambar contoh pratinjau
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [flash, setFlash] = useState(0);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  // Hasil jepret yang belum dikirim (pratinjau). url = object URL buat <img>.
  const [captured, setReview] = useState<{ cap: Captured; url: string; file: File } | null>(null);
  const review =
    captured ?? (preview?.review ? { url: preview.review, cap: null, file: null } : null);
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
  useEffect(() => {
    if (!captured) return;
    return () => URL.revokeObjectURL(captured.url);
  }, [captured]);

  async function keep(cap: Captured) {
    const row = { id: newPhotoId(), token, ...cap, createdAt: Date.now() };
    await queuePhoto(row);
    // Kiriman nggak dibatalkan setelah 5 dtk (sinyal HP + server baru bangun bisa lebih lama):
    // layar pindah ke sheet BT07b, upload tetap jalan di belakang & sheet berubah ke BT07 begitu
    // sampai (router.refresh dari antrean / LiveRefresh).
    const upload = sendPhoto(row);
    const r = await Promise.race([
      upload,
      new Promise<null>((res) => setTimeout(() => res(null), UPLOAD_WAIT_MS)),
    ]);
    if (r?.kind === "rejected") {
      show(r.res.error);
      return;
    }
    if (!r) void upload.then((x) => x.kind === "sent" && router.refresh());
    setLeaving(true);
    router.replace(sheetHref(row.id));
  }

  async function run(task: () => Promise<Captured>) {
    setBusy(true);
    try {
      const cap = await task();
      const file = new File([cap.photo], "foto-hmd.jpg", { type: "image/jpeg" });
      setReview({ cap, url: URL.createObjectURL(cap.photo), file });
    } catch {
      show("Fotonya gagal diambil, coba lagi");
    } finally {
      setBusy(false);
    }
  }

  async function send() {
    if (!review?.cap || busy) return;
    setBusy(true);
    try {
      await keep(review.cap);
    } catch {
      show("Fotonya gagal disimpan, coba lagi");
    } finally {
      setBusy(false);
    }
  }

  // Simpan ke HP (langsung dari tap: iPhone = share sheet "Simpan Gambar").
  async function save() {
    if (!review?.file) return;
    const out = await saveFile(review.file, "Foto House Moving Day");
    if (out === "downloaded") show("Fotonya kesimpan di HP");
    else if (out === "fallback") show("Tekan lama fotonya buat simpan");
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
          Kolase foto
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
          {review && (
            // eslint-disable-next-line @next/next/no-img-element -- object URL hasil jepret
            <img src={review.url} alt="Hasil jepretanmu" className={s.reviewImg} />
          )}
          {flash > 0 && <span key={flash} aria-hidden className={s.flash} />}
        </Polaroid>
        {!denied && (
          <p className={cx("t-label", s.hint)}>
            {review
              ? "Suka? Masukin ke kolase, atau ulangi dulu."
              : inApp
                ? "Buka di Safari/Chrome biar kamera langsung jalan di sini."
                : "Jepret sekali, langsung masuk kolase bareng."}
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
      ) : review ? (
        <div className={s.reviewPanel}>
          <Button
            icon={<Check />}
            onClick={send}
            aria-disabled={busy || leaving}
            aria-busy={busy || leaving}
          >
            {busy || leaving ? "Lagi masukin…" : "Masukin ke kolase"}
          </Button>
          <div className={s.reviewRow}>
            <Button
              variant="secondary"
              icon={<ArrowCounterClockwise />}
              onClick={() => !busy && setReview(null)}
            >
              Ulangi
            </Button>
            <Button variant="secondary" icon={<DownloadSimple />} onClick={save}>
              Download foto
            </Button>
          </div>
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
