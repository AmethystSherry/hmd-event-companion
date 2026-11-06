"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
  type ReactNode,
} from "react";
import {
  ArrowClockwise,
  Camera,
  CameraRotate,
  CameraSlash,
  HandWaving,
  Info,
  QrCode,
  WifiSlash,
  X,
} from "@/components/icons";
import { Viewfinder } from "@/components/f2/Viewfinder";
import { captureFile, captureVideo, type Captured } from "@/components/n4/capture";
import n4 from "@/components/n4/n4.module.css";
import { useCamera, type CameraStatus } from "@/components/n4/useCamera";
import {
  Button,
  IconButton,
  Pill,
  Polaroid,
  Sheet,
  Segmented,
  Toast,
  TopToast,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import { initials, keyLabel } from "@/lib/format";
import type { KenalanCekResponse, KenalanPostResponse, KenalanView } from "@/lib/kenalan";
import { isInAppBrowser, newPhotoId } from "@/lib/photo";
import s from "./n5.module.css";

// N5 · sheet Kenalan di layar acara (`?sheet=kenalan-qr`, dibuka dari tombol Kenalan BT05k / "Scan
// QR lain" BTk4). (6 Nov) Dulu halaman /t/[token]/kenalan; sekarang bottom sheet mengambang di atas
// navbar, tab QR saya dulu (default) baru Scan QR. BTk2 QR saya (QR kenalan dari server) ⇄ BTk1
// Scan QR (kamera belakang, qr-scanner), lalu BTk3 Selfie bukti kenalan (layar penuh di atas sheet,
// kamera depan N4). Alur (K2/K3): scan → POST …/kenalan/cek (error tampil di sini) → selfie →
// jepret → kompres N4 → POST …/kenalan (kode + foto, tanpa antrean) → `onSent(id)` (AcaraScreen
// buka BTk4). HP pemilik QR pindah sendiri ke BTk4 lewat AcaraScreen (LiveRefresh → latest baru).
// Kamera ditolak / webview → jalur cadangan K8.

export type KenalanTab = "qr" | "scan";
type Friend = { id: string; name: string; firstName: string };
export type KenalanMe = {
  name: string;
  firstName: string;
  ig: string;
  role: string | null;
  keyNo: number;
};
type Step = { kind: "scan" } | { kind: "selfie"; friend: Friend; code: string };

export type KenalanPreview = {
  step?: "selfie" | "gagal" | "kirim";
  friend?: Friend;
  scanError?: boolean; // K8 kamera scan ditolak
  camera?: CameraStatus;
  toast?: string;
};

const TOAST_MS = 3500;
const CHECK_MS = 8000;
const SEND_MS = 10_000;
const SCAN_REPEAT_MS = 2500; // QR yang sama kebaca berkali-kali per detik
const OFFLINE = "Sinyal lagi lemah. Coba scan lagi, ya."; // TODO copy

const noSubscribe = () => () => {};

export function KenalanQrSheet({
  token,
  me,
  view,
  qr,
  date,
  initialTab = "qr",
  onClose,
  onSent,
  onSelfieChange,
  preview,
}: {
  token: string;
  me: KenalanMe;
  view: KenalanView;
  qr: ReactNode; // QR kenalan (SVG dari server, TicketQr)
  date: string; // "8.11.26"
  initialTab?: KenalanTab;
  onClose: () => void;
  onSent: (introId: string) => void; // selfie terkirim → BTk4
  onSelfieChange?: (on: boolean) => void; // BTk3 jalan → AcaraScreen tahan BTk4/BTk5 otomatis
  preview?: KenalanPreview; // /dev/states/n5: tanpa kamera & jaringan
}) {
  const [tab, setTab] = useState<KenalanTab>(initialTab);
  const [step, setStep] = useState<Step>(
    preview?.step && preview.friend
      ? { kind: "selfie", friend: preview.friend, code: "" }
      : { kind: "scan" },
  );
  const [toast, setToast] = useState<{ key: number; text: string } | null>(
    preview?.toast ? { key: 0, text: preview.toast } : null,
  );
  const [scanError, setScanError] = useState(!!preview?.scanError);
  const [scanAttempt, setScanAttempt] = useState(0);
  const [checking, setChecking] = useState(false);
  const lastScan = useRef<{ text: string; at: number } | null>(null);
  const qrFile = useRef<HTMLInputElement>(null);

  const show = useCallback((text: string) => setToast({ key: Date.now(), text }), []);
  useEffect(() => {
    if (!toast || preview) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast, preview]);

  const selfie = step.kind === "selfie";
  useEffect(() => {
    onSelfieChange?.(selfie);
    return () => onSelfieChange?.(false);
  }, [selfie, onSelfieChange]);

  const onScan = useCallback(
    async (text: string) => {
      const now = Date.now();
      const last = lastScan.current;
      if (checking || (last && last.text === text && now - last.at < SCAN_REPEAT_MS)) return;
      lastScan.current = { text, at: now };
      setChecking(true);
      try {
        const res = await fetch(`/api/t/${token}/kenalan/cek`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code: text }),
          signal: AbortSignal.timeout(CHECK_MS),
        });
        const body = (await res.json()) as KenalanCekResponse;
        if (body.ok) setStep({ kind: "selfie", friend: body.friend, code: text });
        else show(body.message);
      } catch {
        show(OFFLINE);
      } finally {
        setChecking(false);
      }
    },
    [checking, token, show],
  );

  // K8: kamera scan nggak jalan → foto QR pakai kamera HP, dibaca qr-scanner dari gambar.
  async function onQrFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      // Dinamis: qr-scanner cuma jalan di browser & cuma dibutuhkan di jalur cadangan K8.
      const { default: QrScanner } = await import("qr-scanner");
      const r = await QrScanner.scanImage(file, { returnDetailedScanResult: true });
      lastScan.current = null;
      await onScan(r.data);
    } catch {
      show("QR-nya nggak kebaca. Coba foto lebih dekat, ya."); // TODO copy
    }
  }

  if (step.kind === "selfie") {
    return (
      <div className={s.selfieLayer}>
        <SelfieStep
          token={token}
          me={me}
          friend={step.friend}
          code={step.code}
          date={date}
          onCancel={() => setStep({ kind: "scan" })}
          onRejected={(text) => {
            setStep({ kind: "scan" });
            show(text);
          }}
          onSent={onSent}
          preview={preview}
        />
      </div>
    );
  }

  const live = !preview && tab === "scan" && !scanError;
  return (
    <>
      <Sheet open aboveNav onClose={onClose} title="Kenalan" className={s.qrSheet}>
        <p aria-hidden className={cx("t-card-title", s.title)}>
          Kenalan
        </p>
        <Segmented
          look="tabs"
          label="Kenalan"
          value={tab}
          onChange={setTab}
          options={[
            { value: "qr", label: "QR saya" },
            { value: "scan", label: "Scan QR" },
          ]}
        />

        {/* Dua tab ditumpuk di satu sel grid (yang nggak aktif disembunyikan, `inert`): tinggi sheet =
            panel tertinggi, jadi nggak loncat waktu ganti tab. */}
        <div className={s.tabBody}>
          <div className={s.tabPanel} data-active={tab === "qr" || undefined} inert={tab !== "qr"}>
            <section className={s.qrCard} aria-label="QR kenalan kamu">
              <div className={s.who}>
                <span aria-hidden className={s.whoAvatar}>
                  {initials(me.name)}
                </span>
                <span className={s.whoText}>
                  <span className={s.whoName}>{me.name}</span>
                  <span className={s.whoMeta}>
                    @{me.ig}
                    {me.role ? ` · ${me.role}` : ""}
                  </span>
                </span>
              </div>
              <div className={s.plate}>{qr}</div>
              <div className={s.chips}>
                <span>{view.count} kenalan</span>
                {view.rank && <span>Peringkat #{view.rank}</span>}
                <span>{keyLabel(me.keyNo)}</span>
              </div>
            </section>
            <div className={s.info}>
              <span aria-hidden className={s.infoIcon}>
                <QrCode size={22} />
              </span>
              <span className={s.infoText}>
                <span className="t-label-emph">Tunjukin QR ini ke temanmu</span>
                <span className="t-caption c-label-2">
                  Biar dia yang scan. Habis discan, kalian langsung selfie berdua.
                </span>
              </span>
            </div>
          </div>
          <div
            className={s.tabPanel}
            data-active={tab === "scan" || undefined}
            inert={tab !== "scan"}
          >
            <Viewfinder
              key={scanAttempt}
              live={live}
              onScan={(text) => void onScan(text)}
              onError={() => setScanError(true)}
              hint="Arahkan ke QR kenalan temanmu"
              label="Kamera scan QR kenalan"
              className={s.scanBox}
            >
              {scanError ? (
                // K8 · TODO desain: kamera scan ditolak / nggak ada (webview IG, http).
                <div className={s.scanDenied}>
                  <CameraSlash size={36} />
                  <p className="t-body-emph">Kamera belum bisa dipakai</p>
                  <p className="t-label" style={{ opacity: 0.8 }}>
                    Izinkan kamera di browser, atau foto QR temanmu pakai kamera HP.
                  </p>
                  <div className={s.scanDeniedActions} data-theme="light">
                    <Button
                      icon={<ArrowClockwise />}
                      onClick={() => {
                        setScanError(false);
                        setScanAttempt((n) => n + 1);
                      }}
                    >
                      Coba lagi
                    </Button>
                    <Button
                      variant="secondary"
                      icon={<Camera />}
                      onClick={() => qrFile.current?.click()}
                    >
                      Pakai kamera HP
                    </Button>
                  </div>
                </div>
              ) : undefined}
            </Viewfinder>
            <div className={s.info}>
              <span aria-hidden className={s.infoIcon}>
                <HandWaving size={22} />
              </span>
              <span className={s.infoText}>
                <span className="t-label-emph">Scan QR teman yang mau dikenalin</span>
                <span className="t-caption c-label-2">
                  Minta temanmu buka tab QR saya. Habis discan, kalian langsung selfie berdua.
                </span>
              </span>
            </div>
            <input
              ref={qrFile}
              type="file"
              accept="image/*"
              capture="environment"
              hidden
              onChange={onQrFile}
            />
          </div>
        </div>
      </Sheet>
      {toast && <TopToast key={toast.key} icon={<Info size={20} />} title={toast.text} />}
    </>
  );
}

// ---- BTk3 · Selfie bukti kenalan ----
function SelfieStep({
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
  friend: Friend;
  code: string;
  date: string;
  onCancel: () => void;
  onRejected: (text: string) => void;
  onSent: (introId: string) => void;
  preview?: KenalanPreview;
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
        onSent(id);
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
        <p className={cx("t-label", n4.hint)}>
          {inApp
            ? "Buka di Safari/Chrome biar kamera langsung jalan di sini."
            : "Selfie berdua buat bukti kenalan. Nggak masuk kolase foto."}
        </p>
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
