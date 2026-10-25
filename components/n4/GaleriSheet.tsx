"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Camera, Check, Info, LockSimple, Trash } from "@/components/icons";
import { Button, Dialog, Polaroid, Segmented, Sheet, Toast } from "@/components/ui";
import { timeWib } from "@/lib/format";
import type { QueuedPhoto } from "@/lib/offline/photoDb";
import { guestPhotoUrl, MAX_PHOTOS_PER_GUEST, type GuestPhotos } from "@/lib/photo";
import { lockedToast } from "./NempelSheet";
import s from "./sheets.module.css";

// N4 · BT07d Galeri · Foto saya (sheet di layar acara, ?sheet=galeri). Fotoku terbaru dulu (foto
// yang masih antre ikut tampil dengan badge ⌛), hapus lewat Dialog → DELETE → layar di-refresh.
// Tab "Foto tamu" terkunci sampai acara selesai (lalu tamu pindah ke T15); tap → toast.
// TODO desain: tap polaroid belum ada perilakunya.

const TILTS = [2, -2, 1.5, -1.5];
const TOAST_MS = 4000;

type Item = { id: string; at: number; src?: string; queued: boolean };

export function GaleriSheet({
  token,
  data,
  queued,
  onClose,
  onDeleted,
  preview,
}: {
  token: string;
  data: GuestPhotos;
  queued: QueuedPhoto[];
  onClose: () => void;
  onDeleted: () => void;
  preview?: boolean; // /dev/states/n4: tanpa gambar & jaringan
}) {
  const [confirm, setConfirm] = useState<Item | null>(null);
  const [toast, setToast] = useState<{ key: number; text: string; ok?: boolean } | null>(null);
  const show = (text: string, ok?: boolean) => setToast({ key: Date.now(), text, ok });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  // Foto antre (belum di server) pakai Blob di HP; URL dilepas saat daftar berubah.
  const waiting = useMemo(
    () => queued.filter((r) => !data.mine.some((p) => p.id === r.id)),
    [queued, data.mine],
  );
  const blobs = useMemo(
    () => new Map(waiting.map((r) => [r.id, URL.createObjectURL(r.thumb)])),
    [waiting],
  );
  useEffect(() => () => blobs.forEach((u) => URL.revokeObjectURL(u)), [blobs]);

  const items: Item[] = [
    ...waiting.map((r) => ({
      id: r.id,
      at: r.createdAt,
      src: preview ? undefined : blobs.get(r.id),
      queued: true,
    })),
    ...data.mine.map((p) => ({
      id: p.id,
      at: Date.parse(p.createdAt),
      src: preview ? undefined : guestPhotoUrl(token, p.id),
      queued: false,
    })),
  ].sort((a, b) => b.at - a.at);
  const full = items.length >= MAX_PHOTOS_PER_GUEST;

  async function remove(item: Item) {
    setConfirm(null);
    if (preview) return show("Pratinjau: foto nggak dihapus");
    try {
      const res = await fetch(`/api/t/${token}/foto/${item.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error();
    } catch {
      return show("Gagal hapus, coba lagi");
    }
    show("Foto dihapus dari kolase", true);
    onDeleted();
  }

  return (
    <>
      <Sheet open strong onClose={onClose} title="Galeri foto" className={s.galeri}>
        <header className={s.galeriHead}>
          <p aria-hidden className="t-card-title">
            Galeri foto
          </p>
          <p className="t-label c-label-2">{lockedToast(data.endsAt)}</p>
        </header>
        <Segmented
          label="Galeri"
          value="saya"
          onChange={() => {}}
          onLocked={() => show(lockedToast(data.endsAt))}
          options={[
            { value: "saya", label: `Foto saya · ${items.length}` },
            { value: "tamu", label: "Foto tamu", icon: <LockSimple />, locked: true },
          ]}
        />
        <ul className={s.grid}>
          {items.map((item, i) => {
            const jam = timeWib(new Date(item.at).toISOString());
            return (
              <li key={item.id}>
                <Polaroid
                  size="grid"
                  src={item.src}
                  alt={`Fotomu jam ${jam}`}
                  name={data.name}
                  caption={`${data.name} · ${jam}`}
                  tilt={TILTS[i % TILTS.length]}
                  status={item.queued ? "queued" : undefined}
                  action={
                    item.queued ? undefined : (
                      <button
                        type="button"
                        className={s.trash}
                        aria-label={`Hapus foto ${jam}`}
                        onClick={() => setConfirm(item)}
                      >
                        <Trash size={16} />
                      </button>
                    )
                  }
                />
              </li>
            );
          })}
          {!full && (
            <li>
              <Link href={`/t/${token}/foto`} className={s.addTile}>
                <Camera size={28} />
                <span className="t-label">Foto lagi</span>
              </Link>
            </li>
          )}
        </ul>
        {items.length === 0 && (
          // TODO copy: galeri kosong belum didesain (usulan N4-deliverables v2).
          <p className="t-label c-label-2">Belum ada foto. Jepret yang pertama!</p>
        )}
        {full && <p className="t-caption c-label-2">Maks {MAX_PHOTOS_PER_GUEST} foto</p>}
      </Sheet>

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Hapus foto ini?"
        actions={
          <>
            <Button variant="destructive" onClick={() => confirm && remove(confirm)}>
              Hapus foto
            </Button>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Batal
            </Button>
          </>
        }
      >
        Fotonya hilang dari kolase semua tamu.
      </Dialog>

      {toast && (
        <div className={s.toastDock}>
          <Toast key={toast.key} icon={toast.ok ? <Check /> : <Info />}>
            {toast.text}
          </Toast>
        </div>
      )}
    </>
  );
}
