"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowClockwise, Camera, Hourglass, Info } from "@/components/icons";
import { Button, PhotoStrip, Pill, Polaroid, Sheet, Toast } from "@/components/ui";
import type { QueuedPhoto } from "@/lib/offline/photoDb";
import { guestPhotoUrl, photoTilt, type GuestPhotos } from "@/lib/photo";
import s from "./sheets.module.css";

// N4 · hasil jepret sebagai sheet di atas layar acara (?sheet=foto&id=…):
// BT07 Nempel di kulkas · BT07b Fotomu lagi antre · BT07c tap "+N" (toast) · BT07e Kamu yang pertama.
// Status dari data server (`mine`) + antrean di HP: terkirim selagi sheet kebuka → layar acara
// di-refresh → sheet berubah ke BT07 sendiri.

export type NempelStatus = "sent" | "queued";

const TOAST_MS = 4000;

// Status foto: udah di server → terkirim; masih di antrean HP → antre; nggak ada di dua-duanya
// (link basi / ditolak server) → null (sheet nggak dibuka).
export function nempelStatus(
  photoId: string,
  data: GuestPhotos,
  queued: QueuedPhoto[],
): NempelStatus | null {
  if (data.mine.some((p) => p.id === photoId)) return "sent";
  if (queued.some((r) => r.id === photoId)) return "queued";
  return null;
}

export const lockedToast = (endsAt: string) =>
  `Kolase lengkap kebuka pas acara selesai (± ${endsAt})`;

export function NempelSheet({
  token,
  data,
  photoId,
  status,
  queued,
  onRetry,
  onClose,
  preview,
}: {
  token: string;
  data: GuestPhotos;
  photoId: string;
  status: NempelStatus;
  queued: QueuedPhoto[];
  onRetry: () => Promise<boolean>; // true = ada yang terkirim
  onClose: () => void;
  preview?: { extraToast?: boolean }; // /dev/states/n4: tanpa gambar & jaringan
}) {
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(
    preview?.extraToast ? { key: 0, text: lockedToast(data.endsAt) } : null,
  );
  const [extraPressed, setExtraPressed] = useState(!!preview?.extraToast);

  useEffect(() => {
    if (!toast || preview) return;
    const t = setTimeout(() => {
      setToast(null);
      setExtraPressed(false);
    }, TOAST_MS);
    return () => clearTimeout(t);
  }, [toast, preview]);

  // Foto yang masih antre tampil dari Blob di HP.
  const row = queued.find((r) => r.id === photoId);
  const blobUrl = useMemo(() => (row ? URL.createObjectURL(row.photo) : null), [row]);
  useEffect(() => () => void (blobUrl && URL.revokeObjectURL(blobUrl)), [blobUrl]);

  const sent = status === "sent";
  const first = sent && data.others === 0; // BT07e
  const src = preview
    ? undefined
    : sent
      ? guestPhotoUrl(token, photoId, "full")
      : (blobUrl ?? undefined);
  const thumb = (id: string) => ({ id, src: preview ? undefined : guestPhotoUrl(token, id) });
  const strip = first ? data.mine.slice(0, 4).map((p) => thumb(p.id)) : data.latest.map(thumb);
  const extra = first ? 0 : data.others - strip.length;

  async function retry() {
    if (busy || preview) return;
    setBusy(true);
    try {
      if (!(await onRetry())) {
        setToast({ key: Date.now(), text: "Sinyalnya masih lemah. Fotomu tetap aman di HP" });
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Sheet open strong onClose={onClose} title="Hasil foto kolase" className={s.sheet}>
        <div className={s.stage}>
          <Polaroid
            key={photoId}
            size="sheet"
            src={src}
            alt="Fotomu"
            name={data.name}
            tilt={photoTilt(photoId)}
            magnet
            status={status}
            className={s.drop}
          />
        </div>
        <div className={s.text}>
          <p className="t-card-title">
            {!sent ? "Fotomu lagi antre" : first ? "Kamu yang pertama!" : "Nempel di kulkas!"}
          </p>
          <p className="t-body c-label-2">
            {!sent
              ? "Sinyalnya lemah. Fotomu aman di HP dan dikirim otomatis begitu sinyal balik."
              : first
                ? "Kulkasnya masih sepi. Ajak yang lain ikut foto, ya."
                : `Fotomu udah nempel bareng ${data.others} foto tamu lain.`}
          </p>
        </div>
        {!sent && queued.length > 0 && (
          <Pill icon={<Hourglass />} className={s.pill}>
            {queued.length} foto nunggu sinyal
          </Pill>
        )}
        <PhotoStrip
          photos={strip}
          extra={extra}
          pressed={extraPressed}
          className={s.strip}
          onExtra={() => {
            setExtraPressed(true);
            setToast({ key: Date.now(), text: lockedToast(data.endsAt) });
          }}
        />
        {/* BT07c: toast ikut alur sheet, di atas tombol (nggak nutupin strip). */}
        {toast && (
          <div className={s.toastInline}>
            <Toast key={toast.key} icon={<Info />}>
              {toast.text}
            </Toast>
          </div>
        )}
        <div className={s.actions}>
          {sent ? (
            <Button href={`/t/${token}/foto`} icon={<Camera />}>
              Foto lagi
            </Button>
          ) : (
            <Button icon={<ArrowClockwise />} onClick={retry} aria-disabled={busy}>
              Coba kirim sekarang
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Selesai
          </Button>
        </div>
      </Sheet>
    </>
  );
}
