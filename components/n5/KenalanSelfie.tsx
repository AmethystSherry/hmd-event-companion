"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { ArrowClockwise, Camera, CameraRotate, Info, WifiSlash, X } from "@/components/icons";
import { captureFile, captureVideo, type Captured } from "@/components/n4/capture";
import n4 from "@/components/n4/n4.module.css";
import { useCamera, type CameraStatus } from "@/components/n4/useCamera";
import { Button, IconButton, Pill, Polaroid, Toast, TopToast } from "@/components/ui";
import { cx } from "@/lib/cx";
import type { KenalanPostResponse, KenalanSent } from "@/lib/kenalan";
import { isInAppBrowser, newPhotoId } from "@/lib/photo";
import s from "./n5.module.css";

// N5 · BTk3 Selfie bukti kenalan (layar penuh, kamera depan N4). Dipakai sheet Kenalan (layar acara)
// & mode Scan QR kamera kolase (BT06). Jepret → kompres N4 → POST …/kenalan (kode + foto, tanpa
// antrean) → `onSent(id)` (pemanggil buka BTk4). 4xx → `onRejected` (balik ke scan + pesan);
// 5xx/offline/timeout → selfie tetap + "Coba lagi" (id sama). Kamera ditolak / webview → kamera HP.

export type KenalanFriend = { id: string; name: string; firstName: string };
export type KenalanMe = {
  name: string;
  firstName: string;
  ig: string;
  role: string | null;
  keyNo: number;
};
export type KenalanSelfiePreview = { step?: "selfie" | "gagal" | "kirim"; camera?: CameraStatus };

const TOAST_MS = 3500;
const SEND_MS = 10_000;

const noSubscribe = () => () => {};

export function KenalanSelfie({
  token,
  me,
  friend,
  code,
  date,
  onCancel,
  onRejected,
  onSent,
  preview,
}: {
  token: string;
  me: KenalanMe;
  friend: KenalanFriend;
  code: string;
  date: string;
  onCancel: () => void;
  onRejected: (text: string) => void;
  onSent: (sent: KenalanSent) => void;
  preview?: KenalanSelfiePreview; // /dev/states: tanpa kamera & jaringan
}) {
  const video = useRef<HTMLVideoElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [shot, setShot] = useState<{ cap: Captured; url: string; id: string } | null>(null);
  const [sending, setSending] = useState(preview?.step === "kirim");
  const [failed, setFailed] = useState(preview?.step === "gagal");
  const [leaving, setLeaving] = useState(false);
  const [flash, setFlash] = useState(0);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);

  const inApp = useSyncExternalStore(
    noSubscribe,
    () => isInAppBrowser(navigator.userAgent),
    () => false,
  );
  const cam = useCamera(video, !preview && !inApp && !shot && !leaving);
  const status: CameraStatus = preview
    ? (preview.camera ?? "live")
    : inApp
      ? "unsupported"
      : cam.status;
  const fallback = status === "unsupported" || status === "error" || status === "denied";

  useEffect(() => {
    if (!shot) return;
    return () => URL.revokeObjectURL(shot.url);
  }, [shot]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  async function send(cap: Captured, id: string) {
    setSending(true);
    setFailed(false);
    const fd = new FormData();
    fd.set("id", id);
    fd.set("code", code);
    fd.set("photo", cap.photo, "selfie.jpg");
    fd.set("thumb", cap.thumb, "selfie_t.jpg");
    try {
      const res = await fetch(`/api/t/${token}/kenalan`, {
        method: "POST",
        body: fd,
        signal: AbortSignal.timeout(SEND_MS),
      });
      const body = (await res.json().catch(() => null)) as KenalanPostResponse | null;
      if (body?.ok) {
        setLeaving(true);
        onSent({ id: body.id, intro: body.intro ?? null, view: body.view ?? null });
        return;
      }
      if (res.status >= 500 || !body) throw new Error(`status ${res.status}`);
      // 4xx: udah kenalan (HP teman duluan), papan dikunci, selfie rusak … → balik ke scan.
      if (body.error === "foto-rusak") {
        setShot(null);
        setToast({ key: Date.now(), text: body.message });
      } else onRejected(body.message);
    } catch {
      setFailed(true); // offline / timeout / 5xx: selfie tetap di layar, "Coba lagi" id sama
    } finally {
      setSending(false);
    }
  }

  async function take(task: () => Promise<Captured>) {
    setSending(true);
    try {
      const cap = await task();
      const next = { cap, url: URL.createObjectURL(cap.photo), id: newPhotoId() };
      setShot(next);
      await send(cap, next.id);
    } catch {
      setSending(false);
      setToast({ key: Date.now(), text: "Selfie-nya gagal diambil, coba lagi" });
    }
  }

  function shoot() {
    if (sending || leaving || preview) return;
    if (failed && shot) return void send(shot.cap, shot.id);
    if (fallback) return fileInput.current?.click();
    const el = video.current;
    if (status !== "live" || !el?.videoWidth) return;
    setFlash((n) => n + 1);
    void take(() => captureVideo(el));
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void take(() => captureFile(file));
  }

  const busy = sending || leaving;
  return (
    <div className={n4.camera} data-theme="dark">
      <header className={n4.toolbar}>
        <IconButton
          variant="glass"
          label="Batal selfie"
          icon={<X />}
          onClick={() => !busy && onCancel()}
        />
        <Pill glass icon={<span className={n4.dot} />}>
          Selfie kenalan
        </Pill>
        <span aria-hidden className={n4.toolbarSpacer} />
      </header>

      <div className={n4.stage}>
        {/* (6 Nov) Arahan jelas habis scan: kamera langsung kebuka, jadi bilang ini selfie berdua buat
            bukti kenalan. */}
        <div className={s.selfieIntro}>
          <p className="t-card-title">Selfie bareng {friend.firstName}, yuk!</p>
          <p className="t-label">
            QR {friend.firstName} udah kebaca. Foto berdua ini jadi bukti kalian udah kenalan.
          </p>
        </div>
        <Polaroid
          name={me.firstName}
          caption={`${me.firstName} × ${friend.firstName}`}
          date={date}
          className={n4.viewfinder}
        >
          {shot ? (
            // eslint-disable-next-line @next/next/no-img-element -- object URL hasil jepret
            <img
              src={shot.url}
              alt={`Selfie kamu & ${friend.firstName}`}
              className={n4.reviewImg}
            />
          ) : fallback && !preview ? (
            <div className={n4.fallback}>
              <Camera size={32} />
              <p className="t-label">Tap tombol jepret buat buka kamera HP</p>
            </div>
          ) : preview || leaving ? undefined : (
            <video
              ref={video}
              muted
              playsInline
              autoPlay
              aria-label="Kamera selfie kenalan"
              className={cx(cam.facing === "user" && n4.mirror)}
            />
          )}
          {flash > 0 && <span key={flash} aria-hidden className={n4.flash} />}
        </Polaroid>
        {inApp && (
          <p className={cx("t-label", n4.hint)}>
            Buka di Safari/Chrome biar kamera langsung jalan di sini.
          </p>
        )}
      </div>

      {failed ? (
        // TODO desain: gagal kirim selfie (offline / timeout).
        <div className={n4.reviewPanel}>
          <Button
            icon={<ArrowClockwise />}
            onClick={() => (preview ? undefined : shoot())}
            aria-disabled={busy}
            aria-busy={busy}
          >
            {busy ? "Lagi ngirim…" : "Coba lagi"}
          </Button>
        </div>
      ) : (
        <div className={n4.bar}>
          <span aria-hidden className={n4.barSpacer} />
          <button
            type="button"
            className={cx(n4.shutter, busy && n4.sending)}
            onClick={shoot}
            aria-label={busy ? "Lagi ngirim selfie" : "Jepret selfie"}
            aria-busy={busy}
            aria-disabled={busy || (!fallback && status !== "live")}
          >
            <span />
          </button>
          {status === "live" && !shot ? (
            <button type="button" className={n4.flip} onClick={cam.flip} aria-label="Ganti kamera">
              <CameraRotate size={22} />
            </button>
          ) : (
            <span aria-hidden className={n4.barSpacer} />
          )}
        </div>
      )}
      <input ref={fileInput} type="file" accept="image/*" capture="user" hidden onChange={onFile} />
      {failed && (
        <div data-theme="light">
          <TopToast
            className={s.toastBelow}
            icon={<WifiSlash size={20} />}
            title="Selfie belum kekirim"
            action={
              preview
                ? undefined
                : { label: "Coba lagi", icon: <ArrowClockwise size={20} />, onClick: shoot }
            }
          >
            Sinyal lagi lemah. Selfie-nya masih di sini, tinggal coba lagi.
          </TopToast>
        </div>
      )}
      {toast && (
        <div className={n4.toastDock}>
          <Toast key={toast.key} icon={<Info />}>
            {toast.text}
          </Toast>
        </div>
      )}
    </div>
  );
}
