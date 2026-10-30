"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CaretLeft,
  Check,
  DownloadSimple,
  Export,
  Image as ImageIcon,
  Info,
  ShareNetwork,
  Shuffle,
  X,
} from "@/components/icons";
import {
  Button,
  Chip,
  Dialog,
  HeroState,
  IconButton,
  Masonry,
  PhotoPin,
  Screen,
  ScreenHeader,
  Sheet,
  Skeleton,
  TextAction,
  Toast,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import {
  filterPhotos,
  KOLASE_FILE,
  KOLASE_MAX,
  photoFileName,
  pinCaption,
  seededRandom,
  shuffled,
  type KolaseFilter,
  type KolasePhoto,
} from "@/lib/kolase";
import { guestPhotoUrl, isInAppBrowser } from "@/lib/photo";
import { FotoDetail } from "./FotoDetail";
import { renderKolase } from "./kolaseCanvas";
import {
  canShareFiles,
  downloadFiles,
  isIOS,
  saveFile,
  shareFile,
  shareFiles,
  type SaveOutcome,
} from "./saveImage";
import s from "./f5.module.css";

// T15 · Kolase foto (masonry 2 kolom, filter Semua/Foto saya/per sesi; pin bingkai F5 v2) + T15b detail foto
// (?foto={id}, back HP menutup) + T15c sheet gambar 9:16 + T15e share sheet HP + T15d kosong +
// T14d toast "udah pernah isi" (?isi=1). Foto baru/terhapus ikut muncul lewat rev → SSE.
// Feedback 30 Okt: gambar 9:16 = kolase dinding acak (tombol "Acak" di T15c) + T15p "Unduh foto":
// mode pilih (semua terpilih dulu), tiap foto diunduh sebagai file sendiri.

const SHARE_TITLE = "Kolase foto · potara HMD";
const TOAST_MS = 3000;

type Preview = {
  filter?: KolaseFilter;
  openId?: string;
  sheet?: boolean;
  filledToast?: boolean;
  picking?: boolean; // T15p
};

export function KolaseScreen({
  token,
  greeting,
  dateLabel,
  shortDate,
  photos,
  photoGuests,
  sessions,
  backHref,
  followHref,
  filledToast,
  preview,
}: {
  token: string | null; // null = pratinjau (tanpa foto asli & tanpa server)
  greeting: string; // "Terima kasih sudah mampir, Rara"
  dateLabel: string; // "8 Nov 2026"
  shortDate: string; // "8.11.26" (gambar 9:16)
  photos: KolasePhoto[]; // terbaru dulu
  photoGuests: number;
  sessions: { id: string; title: string }[]; // urutan rundown
  backHref: string;
  followHref: string;
  filledToast?: boolean; // T14d
  preview?: Preview;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<KolaseFilter>(preview?.filter ?? "semua");
  const [openId, setOpenId] = useState<string | null>(preview?.openId ?? null);
  const [sheet, setSheet] = useState(!!preview?.sheet);
  const [toast, setToast] = useState<{ key: number; text: string; ok?: boolean } | null>(
    filledToast || preview?.filledToast
      ? { key: 0, text: "Kamu sudah isi buku tamu. Terima kasih!", ok: true }
      : null,
  );
  const [confirm, setConfirm] = useState<KolasePhoto | null>(null);
  const [fallback, setFallback] = useState<string | null>(null); // gambar buat tekan-lama
  const pushed = useRef(false);
  // T15p: null = bukan mode pilih. Default semua foto terpilih.
  const [picked, setPicked] = useState<Set<string> | null>(
    preview?.picking ? new Set(photos.map((p) => p.id)) : null,
  );
  const [fetching, setFetching] = useState<{ done: number; total: number } | null>(null);
  const [pickedFiles, setPickedFiles] = useState<File[] | null>(null); // iPhone: tap kedua = share

  const show = useCallback((text: string, ok?: boolean) => {
    setToast({ key: Date.now(), text, ok });
  }, []);

  useEffect(() => {
    if (!toast || preview) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast, preview]);

  // T14d: hapus ?isi=1 dari URL supaya refresh nggak memunculkan toast lagi.
  useEffect(() => {
    if (!filledToast) return;
    const url = new URL(window.location.href);
    url.searchParams.delete("isi");
    history.replaceState(history.state, "", url);
  }, [filledToast]);

  // ?foto={id} dari URL (link dibuka langsung / tombol back-forward HP).
  useEffect(() => {
    if (preview) return;
    const read = () => setOpenId(new URL(window.location.href).searchParams.get("foto"));
    read();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [preview]);

  const sessionChips = useMemo(
    () => sessions.filter((x) => photos.some((p) => p.sessionId === x.id)),
    [sessions, photos],
  );
  const shown = useMemo(() => filterPhotos(photos, filter), [photos, filter]);
  const openIndex = openId ? shown.findIndex((p) => p.id === openId) : -1;
  const thumb = (p: KolasePhoto) => (token ? guestPhotoUrl(token, p.id, "thumb") : undefined);
  const full = (p: KolasePhoto) => (token ? guestPhotoUrl(token, p.id, "full") : undefined);

  function openPhoto(p: KolasePhoto) {
    setOpenId(p.id);
    if (preview) return;
    const url = new URL(window.location.href);
    url.searchParams.set("foto", p.id);
    history.pushState(history.state, "", url);
    pushed.current = true;
  }

  const closePhoto = useCallback(() => {
    setOpenId(null);
    if (preview) return;
    if (pushed.current) {
      pushed.current = false;
      history.back();
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("foto");
      history.replaceState(history.state, "", url);
    }
  }, [preview]);

  function moveTo(i: number) {
    const p = shown[i];
    if (!p) return;
    setOpenId(p.id);
    if (preview) return;
    const url = new URL(window.location.href);
    url.searchParams.set("foto", p.id);
    history.replaceState(history.state, "", url);
  }

  // ---- Gambar 9:16 (T15c). Dibuat di HP; disiapkan duluan supaya share() tetap dipanggil
  // langsung dari tap (Safari iOS menolak share setelah menunggu lama). ----
  // Lebih dari KOLASE_MAX foto → tiap susunan ambil foto acak (seed sama dengan susunan).
  const [seed, setSeed] = useState(1);
  const kolaseItems = useMemo(
    () =>
      (shown.length > KOLASE_MAX
        ? shuffled(shown, seededRandom(seed)).slice(0, KOLASE_MAX)
        : shown
      ).map((p) => ({ id: p.id, src: full(p), thumb: thumb(p), tone: p.tone })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- full()/thumb() cuma bergantung pada token
    [shown, token, seed],
  );
  const kolaseKey = `${seed}:${kolaseItems.map((x) => x.id).join(",")}`;
  const [image, setImage] = useState<{ key: string; file: File; url: string } | null>(null);
  const [imageError, setImageError] = useState(false);
  const making = useRef<string | null>(null);

  const ensureImage = useCallback(async () => {
    if (!kolaseItems.length || making.current === kolaseKey) return;
    making.current = kolaseKey;
    setImageError(false);
    try {
      const blob = await renderKolase(
        kolaseItems,
        { title: "potara · HMD", subtitle: `Kolase foto · ${shortDate}` },
        seed,
      );
      if (making.current !== kolaseKey) return;
      const file = new File([blob], KOLASE_FILE, { type: "image/jpeg" });
      setImage((prev) => {
        if (prev) URL.revokeObjectURL(prev.url);
        return { key: kolaseKey, file, url: URL.createObjectURL(blob) };
      });
    } catch {
      setImageError(true);
    } finally {
      if (making.current === kolaseKey) making.current = null;
    }
  }, [kolaseItems, kolaseKey, shortDate, seed]);

  const ready = image?.key === kolaseKey ? image : null;

  useEffect(() => {
    if (ready || !kolaseItems.length) return;
    if (!sheet && preview) return;
    // Sheet terbuka → langsung; selain itu siapkan diam-diam setelah halaman tenang.
    const t = setTimeout(() => void ensureImage(), sheet ? 0 : 1500);
    return () => clearTimeout(t);
  }, [sheet, ready, kolaseItems.length, ensureImage, preview]);

  // Webview IG/FB: tampilkan gambarnya (data: URL — blob: sering nggak bisa disimpan di webview).
  function afterSave(outcome: SaveOutcome, file: File) {
    if (outcome === "fallback") {
      const reader = new FileReader();
      reader.onload = () => setFallback(String(reader.result));
      reader.readAsDataURL(file);
      show("Tekan lama gambarnya buat simpan");
    } else if (outcome === "downloaded") {
      show("Gambar tersimpan", true);
    }
  }

  async function onShare() {
    if (!ready) return setSheet(true);
    afterSave(await shareFile(ready.file, SHARE_TITLE), ready.file);
  }

  async function onSaveKolase() {
    if (!ready) return;
    afterSave(await saveFile(ready.file, SHARE_TITLE), ready.file);
  }

  // ---- T15b: simpan & hapus foto ----
  const blobs = useRef(new Map<string, File>());
  useEffect(() => {
    const p = openIndex >= 0 ? shown[openIndex] : null;
    const url = p ? full(p) : undefined;
    if (!p || !url || blobs.current.has(p.id)) return;
    fetch(url)
      .then((r) => (r.ok ? r.blob() : Promise.reject()))
      .then((b) =>
        blobs.current.set(
          p.id,
          new File([b], `foto-hmd-${p.id.slice(0, 8)}.jpg`, { type: b.type }),
        ),
      )
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- full() cuma bergantung pada token
  }, [openIndex, shown, token]);

  async function onSavePhoto(p: KolasePhoto) {
    const url = full(p);
    if (!url) return show("Pratinjau: nggak ada file foto");
    let file = blobs.current.get(p.id);
    if (!file) {
      try {
        const b = await (await fetch(url)).blob();
        file = new File([b], `foto-hmd-${p.id.slice(0, 8)}.jpg`, { type: b.type });
      } catch {
        return show("Fotonya belum kebuka, coba lagi");
      }
    }
    afterSave(await saveFile(file, SHARE_TITLE), file);
  }

  // ---- T15p: pilih & unduh foto satu-satu ----
  const pickedCount = picked?.size ?? 0;
  const allShownPicked = !!picked && shown.every((p) => picked.has(p.id));

  function editPicked(fn: (next: Set<string>) => void) {
    setPicked((prev) => {
      const next = new Set(prev);
      fn(next);
      return next;
    });
    setPickedFiles(null); // pilihan berubah → file iPhone disiapkan ulang
  }

  function startPicking() {
    setPicked(new Set(photos.map((p) => p.id)));
    setPickedFiles(null);
  }

  function stopPicking() {
    setPicked(null);
    setPickedFiles(null);
    setFetching(null);
  }

  const togglePick = (id: string) =>
    editPicked((next) => {
      if (next.has(id)) next.delete(id);
      else next.add(id);
    });

  const toggleAllShown = () =>
    editPicked((next) => {
      for (const p of shown) {
        if (allShownPicked) next.delete(p.id);
        else next.add(p.id);
      }
    });

  async function onDownloadPicked() {
    if (!picked?.size || fetching) return;
    if (pickedFiles) {
      // iPhone: share sheet wajib dari tap langsung → file udah disiapkan di tap pertama.
      const outcome = await shareFiles(pickedFiles, SHARE_TITLE);
      if (outcome === "fallback") show("Browser ini belum bisa simpan banyak foto sekaligus");
      if (outcome === "shared") stopPicking();
      return;
    }
    if (!token) return show("Pratinjau: nggak ada file foto");
    if (isInAppBrowser(navigator.userAgent)) {
      return show("Buka di Safari/Chrome buat unduh banyak foto");
    }
    const list = photos.filter((p) => picked.has(p.id)).reverse(); // lama → baru
    let done = 0;
    setFetching({ done, total: list.length });
    const files: File[] = new Array(list.length);
    try {
      let next = 0;
      const worker = async () => {
        while (next < list.length) {
          const i = next++;
          const res = await fetch(guestPhotoUrl(token, list[i].id, "full"));
          if (!res.ok) throw new Error(String(res.status));
          const blob = await res.blob();
          files[i] = new File([blob], photoFileName(list[i], i + 1), { type: "image/jpeg" });
          setFetching({ done: ++done, total: list.length });
        }
      };
      await Promise.all(Array.from({ length: Math.min(4, list.length) }, worker));
    } catch {
      setFetching(null);
      return show("Ada foto yang gagal diunduh, coba lagi");
    }
    setFetching(null);
    if (isIOS() && canShareFiles(files)) return setPickedFiles(files);
    await downloadFiles(files);
    show(`${files.length} foto diunduh`, true);
    stopPicking();
  }

  async function onDelete(p: KolasePhoto) {
    setConfirm(null);
    if (!token) return show("Pratinjau: foto nggak dihapus");
    try {
      const res = await fetch(`/api/t/${token}/foto/${p.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) throw new Error();
    } catch {
      return show("Gagal hapus, coba lagi");
    }
    closePhoto();
    show("Foto dihapus dari kolase", true);
    router.refresh();
  }

  const empty = photos.length === 0;
  return (
    <>
      <Screen
        withBack
        bottom={
          <div className={s.bottomRow}>
            {picked ? (
              <Button
                icon={<DownloadSimple />}
                aria-disabled={!pickedCount || !!fetching || undefined}
                onClick={pickedCount && !fetching ? onDownloadPicked : undefined}
              >
                {fetching
                  ? `Menyiapkan ${fetching.done} dari ${fetching.total}…`
                  : pickedFiles
                    ? `Simpan ${pickedFiles.length} foto ke HP`
                    : pickedCount
                      ? `Unduh ${pickedCount} foto`
                      : "Pilih fotonya dulu"}
              </Button>
            ) : empty ? (
              <Button variant="secondary" href={backHref} icon={<CaretLeft />}>
                Kembali
              </Button>
            ) : (
              <Button icon={<DownloadSimple />} onClick={() => setSheet(true)}>
                Simpan kolase
              </Button>
            )}
            {picked ? (
              <Button
                variant="secondary"
                iconOnly
                label="Batal pilih foto"
                icon={<X />}
                onClick={stopPicking}
              />
            ) : (
              <Button
                variant="secondary"
                iconOnly
                label="Bagikan kolase"
                icon={<Export />}
                aria-disabled={empty || undefined}
                onClick={empty ? undefined : onShare}
              />
            )}
          </div>
        }
      >
        <ScreenHeader
          leading={<IconButton href={backHref} label="Kembali" icon={<CaretLeft />} />}
          eyebrow={greeting}
          title="Kolase foto"
          trailing={
            empty ? undefined : picked ? (
              <TextAction onClick={toggleAllShown}>
                {allShownPicked ? "Kosongkan" : "Pilih semua"}
              </TextAction>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                icon={<DownloadSimple />}
                onClick={startPicking}
              >
                Unduh foto
              </Button>
            )
          }
        />
        <div className={s.meta}>
          <p className="t-label c-label-2">
            {picked
              ? `${pickedCount} dari ${photos.length} foto dipilih`
              : empty
                ? `Belum ada foto · ${dateLabel}`
                : `${photos.length} foto dari ${photoGuests} tamu · ${dateLabel}`}
          </p>
          <TextAction href={followHref}>Follow @potarastudio</TextAction>
        </div>

        {empty ? (
          <HeroState
            icon={<ImageIcon size={30} />}
            tone="accent"
            title="Kolasenya masih kosong"
            className={s.empty}
          >
            Nggak ada foto yang masuk kolase selama acara ini.
          </HeroState>
        ) : (
          <>
            <div className={s.filterRow} role="toolbar" aria-label="Filter foto">
              <Chip selected={filter === "semua"} onClick={() => setFilter("semua")}>
                Semua
              </Chip>
              {photos.some((p) => p.mine) && (
                <Chip selected={filter === "fotoku"} onClick={() => setFilter("fotoku")}>
                  Foto saya
                </Chip>
              )}
              {sessionChips.map((x) => (
                <Chip
                  key={x.id}
                  selected={filter === `sesi:${x.id}`}
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
              render={(p) => (
                <PhotoPin
                  src={thumb(p)}
                  width={p.width}
                  height={p.height}
                  name={p.name}
                  caption={pinCaption(p)}
                  mine={p.mine}
                  tone={p.tone}
                  label={picked ? `Pilih foto dari ${p.first}` : `Buka foto dari ${p.first}`}
                  onOpen={picked ? () => togglePick(p.id) : () => openPhoto(p)}
                  selected={picked ? picked.has(p.id) : undefined}
                  frame
                />
              )}
            />
          </>
        )}
      </Screen>

      {openIndex >= 0 && (
        <FotoDetail
          photos={shown}
          index={openIndex}
          src={full}
          onIndex={moveTo}
          onClose={closePhoto}
          onSave={onSavePhoto}
          onDelete={setConfirm}
        />
      )}

      <Dialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Hapus foto ini?"
        actions={
          <>
            <Button variant="destructive" onClick={() => confirm && onDelete(confirm)}>
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

      <Sheet open={sheet} onClose={() => setSheet(false)} title="Simpan kolase">
        <div className={s.sheetHead}>
          <h2 className="t-headline">Simpan kolase</h2>
          <p className="t-label c-label-2">Ukuran 9:16, pas buat story</p>
        </div>
        <div className={s.storyFrame}>
          {ready ? (
            // eslint-disable-next-line @next/next/no-img-element -- blob: gambar hasil canvas
            <img src={ready.url} alt="Pratinjau kolase 9:16" className={s.story} />
          ) : imageError ? (
            <p className={cx("t-label c-label-2", s.storyError)}>
              Gambar belum bisa dibuat.{" "}
              <TextAction onClick={() => void ensureImage()}>Coba lagi</TextAction>
            </p>
          ) : (
            <Skeleton height={360} radius={16} />
          )}
        </div>
        <div className={s.shuffleRow}>
          <p className="t-label c-label-2">
            {shown.length > KOLASE_MAX
              ? `${KOLASE_MAX} dari ${shown.length} foto, dipilih acak`
              : `${shown.length} foto · susunan acak`}
          </p>
          <Button
            size="sm"
            variant="secondary"
            icon={<Shuffle />}
            aria-disabled={!ready || undefined}
            onClick={ready ? () => setSeed(Math.floor(Math.random() * 2 ** 31)) : undefined}
          >
            Acak
          </Button>
        </div>
        <div className={s.sheetActions}>
          <Button
            variant="secondary"
            icon={<ShareNetwork />}
            aria-disabled={!ready || undefined}
            onClick={ready ? onShare : undefined}
          >
            Bagikan
          </Button>
          <Button
            icon={<DownloadSimple />}
            aria-disabled={!ready || undefined}
            onClick={ready ? onSaveKolase : undefined}
          >
            Simpan
          </Button>
        </div>
      </Sheet>

      {fallback && (
        <div
          className={s.fallback}
          role="dialog"
          aria-modal="true"
          aria-label="Gambar buat disimpan"
        >
          <div className={s.fallbackClose}>
            <IconButton
              variant="glass"
              label="Tutup gambar"
              icon={<X />}
              onClick={() => setFallback(null)}
            />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element -- blob: gambar yang ditekan lama */}
          <img src={fallback} alt="Gambar kolase" className={s.fallbackImg} />
        </div>
      )}

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
