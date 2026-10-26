"use client";

import { useMemo, useState } from "react";
import { CaretLeft, DownloadSimple, Image as ImageIcon, Info, Trash } from "@/components/icons";
import {
  Button,
  Chip,
  Dialog,
  HeroState,
  IconButton,
  Masonry,
  PhotoPin,
  Screen,
  Toast,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import { deviceLabel } from "@/lib/device";
import { filterPhotos, pinCaption, type KolaseFilter, type KolasePhoto } from "@/lib/kolase";
import { crewPhotoUrl } from "@/lib/photo";
import { zipStored } from "@/lib/zip";
import s from "./f3.module.css";

// F3 v3 · P13 Foto masuk (panitia, tile Foto BP02; Figma 5072:29266): semua foto tamu dalam
// masonry 2 kolom (pin bingkai putih), filter chip per sesi (K20), hapus foto yang nggak pantas
// (Dialog → DELETE /api/panitia/foto/[id], K18), unduh ZIP foto filter aktif (K19). Tap foto =
// belum ada perilaku (K21). Realtime: LiveRefresh di halaman (foto baru / dihapus HP lain).

export type FotoMasukSession = { id: string; title: string };

const slug = (t: string) =>
  t
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export function FotoMasukScreen({
  eventId,
  phaseLabel,
  photos,
  sessions,
  preview,
}: {
  eventId: string;
  phaseLabel: string; // "Hari-H" · "Persiapan · H-13"
  photos: KolasePhoto[]; // terbaru dulu, `mine` nggak dipakai
  sessions: FotoMasukSession[]; // urut rundown
  preview?: { confirmId?: string }; // /dev/states/f4: tanpa server, gambar placeholder
}) {
  const [filter, setFilter] = useState<KolaseFilter>("semua");
  const [hidden, setHidden] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<KolasePhoto | null>(
    photos.find((p) => p.id === preview?.confirmId) ?? null,
  );
  const [busy, setBusy] = useState(false);
  const [zipping, setZipping] = useState(false);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const say = (text: string) => setToast({ key: Date.now(), text });

  const visible = useMemo(() => photos.filter((p) => !hidden.has(p.id)), [photos, hidden]);
  const chips = sessions.filter((x) => visible.some((p) => p.sessionId === x.id));
  const active =
    filter !== "semua" && !chips.some((x) => `sesi:${x.id}` === filter) ? "semua" : filter;
  const shown = filterPhotos(visible, active);

  // Hapus: pin langsung hilang (optimistic); gagal → muncul lagi + Toast.
  const remove = async () => {
    if (!confirm) return;
    const p = confirm;
    if (preview) return setConfirm(null);
    setBusy(true);
    setHidden((h) => new Set(h).add(p.id));
    try {
      const res = await fetch(`/api/panitia/foto/${p.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ by: deviceLabel() }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setConfirm(null);
      say(`Foto ${p.first} dihapus`);
    } catch {
      setHidden((h) => {
        const next = new Set(h);
        next.delete(p.id);
        return next;
      });
      setConfirm(null);
      say("Fotonya belum kehapus. Cek sinyal, terus coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  // Unduh ZIP foto filter aktif (foto full lewat proxy panitia), dibuat di HP.
  const download = async () => {
    if (!shown.length || zipping || preview) return;
    setZipping(true);
    try {
      const files = await Promise.all(
        shown.map(async (p, i) => {
          const res = await fetch(crewPhotoUrl(p.id, "full"));
          if (!res.ok) throw new Error(String(res.status));
          const n = String(shown.length - i).padStart(2, "0");
          return {
            name: `${n}-${slug(p.first)}-${slug(p.session ?? "acara")}.jpg`,
            data: new Uint8Array(await res.arrayBuffer()),
          };
        }),
      );
      const label =
        active === "semua"
          ? "semua"
          : slug(chips.find((x) => `sesi:${x.id}` === active)?.title ?? "sesi");
      const blob = new Blob([zipStored(files.reverse()) as BlobPart], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `foto-hmd-${label}.zip`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      say("Gagal nyiapin unduhan. Coba lagi pas sinyal bagus.");
    } finally {
      setZipping(false);
    }
  };

  return (
    <Screen withBack>
      <div className={s.toolbar}>
        <IconButton
          href={`/panitia/event/${eventId}/kontrol`}
          label="Kembali ke Kontrol acara"
          icon={<CaretLeft />}
        />
      </div>
      <header className={s.header}>
        <div className={s.headerText}>
          <p className="t-label c-label-2">Kontrol acara · {phaseLabel}</p>
          <h1 className="t-title">Foto masuk</h1>
          <p className="t-label c-label-2">
            {visible.length} foto · tamu lihat semua pas acara selesai
          </p>
        </div>
        <IconButton
          label={zipping ? "Lagi nyiapin unduhan…" : "Unduh foto"}
          icon={<DownloadSimple size={20} />}
          onClick={download}
          aria-disabled={!shown.length || zipping || undefined}
          aria-busy={zipping || undefined}
          className={cx(s.download, (!shown.length || zipping) && s.disabled)}
        />
      </header>

      {visible.length === 0 ? (
        <HeroState icon={<ImageIcon size={30} />} title="Belum ada foto">
          Foto tamu muncul di sini begitu nempel di kulkas.
        </HeroState>
      ) : (
        <>
          <div className={s.filterRow} role="toolbar" aria-label="Filter foto">
            <Chip look="card" selected={active === "semua"} onClick={() => setFilter("semua")}>
              Semua
            </Chip>
            {chips.map((x) => (
              <Chip
                key={x.id}
                look="card"
                selected={active === `sesi:${x.id}`}
                onClick={() => setFilter(`sesi:${x.id}`)}
              >
                {x.title}
              </Chip>
            ))}
          </div>
          <Masonry
            items={shown}
            itemKey={(p) => p.id}
            ratio={(p) => p.height / p.width}
            captionRatio={0.25}
            render={(p) => (
              <PhotoPin
                frame
                src={preview ? undefined : crewPhotoUrl(p.id)}
                width={p.width}
                height={p.height}
                name={p.name}
                caption={pinCaption(p)}
                tone={p.tone}
                action={
                  <button
                    type="button"
                    className={s.trash}
                    aria-label={`Hapus foto ${p.first}`}
                    onClick={() => setConfirm(p)}
                  >
                    <Trash size={16} />
                  </button>
                }
              />
            )}
          />
        </>
      )}

      <Dialog
        open={!!confirm}
        onClose={() => !busy && setConfirm(null)}
        title="Hapus foto ini?"
        actions={
          <>
            <Button variant="destructive" onClick={remove} aria-disabled={busy || undefined}>
              {busy ? "Menghapus…" : "Hapus"}
            </Button>
            <Button variant="secondary" onClick={() => !busy && setConfirm(null)}>
              Batal
            </Button>
          </>
        }
      >
        Fotonya hilang dari galeri & kolase semua tamu.
      </Dialog>

      {toast && (
        <div className={s.toast}>
          <Toast key={toast.key} icon={<Info />}>
            {toast.text}
          </Toast>
        </div>
      )}
    </Screen>
  );
}
