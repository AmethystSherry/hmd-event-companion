"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowClockwise, Camera, Info, LockSimple, Trash, WifiSlash } from "@/components/icons";
import { Banner, Button, Polaroid, Segmented, Sheet, Toast } from "@/components/ui";
import { timeWib } from "@/lib/format";
import type { QueuedPhoto } from "@/lib/offline/photoDb";
import { guestPhotoUrl, type GuestPhotos } from "@/lib/photo";
import { lockedToast } from "./NempelSheet";
import type { SendResult } from "./usePhotoOutbox";
import s from "./sheets.module.css";

// N4 · BT07d Galeri · Foto saya (sheet di layar acara, ?sheet=galeri). Fotoku terbaru dulu (foto
// yang masih antre ikut tampil dengan badge ⌛). Hapus (v3, BT07dh) tanpa Dialog: foto langsung
// disembunyikan di HP + Toast "Batalkan" 5 dtk; DELETE baru dikirim setelah toast habis, saat foto
// lain dihapus, atau saat sheet ditutup (dianggap final). Tab ditutup < 5 dtk = nggak jadi kehapus.
// Gagal → foto balik + toast. Berhasil → layar di-refresh (jumlah HP lain & tile panitia lewat rev).
// Tab "Foto tamu" terkunci sampai acara selesai (lalu tamu pindah ke T15); tap → toast.
// Foto antre (28 Okt): Banner "{n} foto belum terkirim" + "Kirim sekarang" (antrean juga dicoba
// otomatis tiap 5 dtk dari layar acara, termasuk setelah halaman di-refresh).
// TODO desain: tap polaroid belum ada perilakunya.

const TILTS = [2, -2, 1.5, -1.5];
const TOAST_MS = 4000;
const UNDO_SECONDS = 5;

type Item = { id: string; at: number; src?: string; queued: boolean };

export function GaleriSheet({
  token,
  data,
  queued,
  onRetry,
  onClose,
  onDeleted,
  preview,
}: {
  token: string;
  data: GuestPhotos;
  queued: QueuedPhoto[];
  onRetry?: () => Promise<SendResult[]>; // kirim ulang antrean sekarang
  onClose: () => void;
  onDeleted: () => void;
  preview?: { pending?: string }; // /dev/states/n4: tanpa gambar & jaringan (BT07dh: toast beku)
}) {
  const [hidden, setHidden] = useState<string[]>(preview?.pending ? [preview.pending] : []);
  const [toast, setToast] = useState<{
    key: number;
    text: string;
    kind: "info" | "undo";
  } | null>(preview?.pending ? { key: 0, text: "Foto dihapus dari kolase", kind: "undo" } : null);
  // Foto yang toast Batalkan-nya lagi jalan (ref: dibaca saat sheet ditutup).
  const pending = useRef<string | null>(preview?.pending ?? null);
  const show = (text: string) => setToast({ key: Date.now(), text, kind: "info" });

  useEffect(() => {
    if (!toast || toast.kind === "undo") return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast]);

  // Kirim DELETE (final). keepalive: tetap jalan walau sheet baru ditutup.
  const commit = useCallback(
    async (id: string) => {
      if (preview) return;
      try {
        const res = await fetch(`/api/t/${token}/foto/${id}`, {
          method: "DELETE",
          keepalive: true,
        });
        if (!res.ok && res.status !== 404) throw new Error();
      } catch {
        setHidden((h) => h.filter((x) => x !== id));
        setToast({ key: Date.now(), text: "Gagal hapus, coba lagi", kind: "info" });
        return;
      }
      onDeleted();
    },
    [token, preview, onDeleted],
  );

  // Sheet ditutup selagi toast jalan → nggak ada lagi tombol Batalkan, jadi hapusnya final.
  const commitRef = useRef(commit);
  useEffect(() => {
    commitRef.current = commit;
  });
  useEffect(
    () => () => {
      if (pending.current) void commitRef.current(pending.current);
    },
    [],
  );

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
  ]
    .filter((item) => !hidden.includes(item.id)) // pending hapus nggak dihitung di HP ini
    .sort((a, b) => b.at - a.at);

  const [retrying, setRetrying] = useState(false);
  async function retry() {
    if (!onRetry || retrying || preview) return;
    setRetrying(true);
    try {
      const results = await onRetry();
      const sent = results.filter((r) => r.kind === "sent").length;
      const rejected = results.find((r) => r.kind === "rejected");
      const stuck = results.find((r) => r.kind === "offline");
      if (rejected?.kind === "rejected") show(rejected.res.error);
      else if (stuck?.kind === "offline")
        show(
          stuck.server
            ? "Server lagi bermasalah. Fotonya aman di HP, coba lagi sebentar lagi."
            : "Masih belum kekirim. Cek sinyal, terus coba lagi.",
        );
      else if (sent) show(sent > 1 ? `${sent} foto terkirim` : "Foto terkirim");
    } finally {
      setRetrying(false);
    }
  }

  // 🗑 → langsung hilang + toast Batalkan. Foto sebelumnya yang masih pending langsung final.
  function remove(item: Item) {
    if (preview) return;
    if (pending.current) void commit(pending.current);
    pending.current = item.id;
    setHidden((h) => [...h, item.id]);
    // key baru → ring Batalkan mulai dari awal tiap hapus.
    setToast((t) => ({ key: (t?.key ?? 0) + 1, text: "Foto dihapus dari kolase", kind: "undo" }));
  }

  function undo() {
    const id = pending.current;
    pending.current = null;
    setToast(null);
    if (id) setHidden((h) => h.filter((x) => x !== id));
  }

  function expire() {
    if (preview) return; // pratinjau BT07dh: toast tetap tampil
    const id = pending.current;
    pending.current = null;
    setToast(null);
    if (id) void commit(id);
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
        {waiting.length > 0 && (
          <Banner
            tone="warning"
            icon={<WifiSlash />}
            title={`${waiting.length} foto belum terkirim`}
            action={
              <Button
                size="sm"
                variant="secondary"
                icon={<ArrowClockwise />}
                onClick={retry}
                aria-disabled={retrying}
              >
                {retrying ? "Mengirim…" : "Kirim sekarang"}
              </Button>
            }
          >
            Fotonya aman di HP ini. Dikirim otomatis begitu sinyal balik.
          </Banner>
        )}
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
                        onClick={() => remove(item)}
                      >
                        <Trash size={16} />
                      </button>
                    )
                  }
                />
              </li>
            );
          })}
          <li>
            <Link href={`/t/${token}/foto`} className={s.addTile}>
              <Camera size={28} />
              <span className="t-label">Foto lagi</span>
            </Link>
          </li>
        </ul>
        {items.length === 0 && (
          // TODO copy: galeri kosong belum didesain (usulan N4-deliverables v2).
          <p className="t-label c-label-2">Belum ada foto. Jepret yang pertama!</p>
        )}
      </Sheet>

      {toast?.kind === "undo" && (
        <div className={s.undoDock}>
          <Toast
            key={toast.key}
            icon={<Trash />}
            className={s.undoToast}
            undo={{ seconds: UNDO_SECONDS, onUndo: undo, onExpire: expire }}
          >
            {toast.text}
          </Toast>
        </div>
      )}
      {toast?.kind === "info" && (
        <div className={s.toastDock}>
          <Toast key={toast.key} icon={<Info />}>
            {toast.text}
          </Toast>
        </div>
      )}
    </>
  );
}
