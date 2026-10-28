"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { BookOpen, CaretRight, Check, InstagramLogo } from "@/components/icons";
import {
  Badge,
  Button,
  EventTickets,
  IllustratedScreen,
  type EventTicketItem,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import { ART_VIDEO } from "@/lib/artVideo";
import { BukuTamuSheet, type BukuTamuDraft } from "./BukuTamu";
import s from "./f5.module.css";

// F5 v2 · BT12 Acara selesai (Figma 5060:28710): kerangka layar acara — ilustrasi Closing + panel.
// Badge "Acara selesai", judul, baris "{n} foto · {m} pertanyaan · {k} tamu", Tiket acara (sobekan
// sesi + tiket "SATU LAGI · Isi buku tamu"), kartu "Kolase kulkas · {n} foto". Tanpa tombol bawah.
// Buku tamu (T14/T14b/T14c) = sheet lewat `?sheet=buku-tamu` (pushState, back HP menutup).
// Udah isi → tiket jadi sobekan ke-5 (K2), tap → kolase + toast T14d.
// (28 Okt) Buku tamu bukan tiket lagi tapi tombol di bawah panel (jelas bisa di-tap): belum isi =
// primary "Isi buku tamu", udah = secondary "Buku tamu udah diisi" → kolase + T14d. Belum isi →
// sheet buku tamu kebuka sendiri sekali per HP (localStorage) begitu layar ini muncul.

const ART = "/figma/f3-closing.webp";
const SHEET = "buku-tamu";
const autoKey = (token: string) => `hmd-buku-tamu-auto:${token}`;

export function SelesaiScreen({
  token,
  photoCount,
  questionCount,
  guestCount,
  tickets,
  ticketCaption,
  latest,
  filled,
  sessions,
  kolaseHref,
  initialSheet,
  preview,
}: {
  token: string | null; // null = pratinjau /dev/states
  photoCount: number;
  questionCount: number;
  guestCount: number; // tamu yang udah masuk
  tickets: EventTicketItem[]; // sesi rundown, semua sobekan
  ticketCaption: string; // "4 dari 4 selesai"
  latest: { id: string; src?: string; tone: number }[]; // 4 foto terbaru
  filled: boolean; // udah isi buku tamu
  sessions: { id: string; title: string }[]; // opsi "paling seru" (label pendek)
  kolaseHref: string;
  initialSheet?: boolean; // ?sheet=buku-tamu (link WA, reload)
  preview?: { draft?: Partial<BukuTamuDraft>; failed?: boolean; hint?: boolean };
}) {
  const router = useRouter();
  const [sheet, setSheet] = useState(!!initialSheet);

  useEffect(() => {
    if (preview) return;
    const read = () => setSheet(new URL(window.location.href).searchParams.get("sheet") === SHEET);
    // Next menyimpan state layar yang pernah dibuka: balik (back) dari kolase setelah kirim buku tamu
    // bakal nampilin sheet yang masih "kebuka". Effect ini jalan lagi tiap layar tampil → samakan
    // dengan URL, dan ambil data terbaru (udah isi → tombol "Buku tamu udah diisi").
    read();
    router.refresh();
    window.addEventListener("popstate", read);
    return () => window.removeEventListener("popstate", read);
  }, [preview, router]);

  const open = useCallback(() => {
    if (filled) return router.push(`${kolaseHref}?isi=1`);
    setSheet(true);
    if (preview) return;
    const url = new URL(window.location.href);
    url.searchParams.set("sheet", SHEET);
    history.pushState({ ...history.state, hmdSheet: true }, "", url);
  }, [filled, kolaseHref, preview, router]);

  // Acara selesai → minta isi buku tamu langsung (sekali per HP; tutup = nggak muncul lagi).
  useEffect(() => {
    if (preview || filled || initialSheet || !token) return;
    try {
      if (localStorage.getItem(autoKey(token))) return;
      localStorage.setItem(autoKey(token), "1");
    } catch {
      return;
    }
    const t = setTimeout(open, 600); // panel muncul dulu, baru sheet naik
    return () => clearTimeout(t);
  }, [preview, filled, initialSheet, token, open]);

  const close = useCallback(() => {
    setSheet(false);
    if (preview) return;
    if (history.state?.hmdSheet) return history.back();
    const url = new URL(window.location.href);
    url.searchParams.delete("sheet");
    history.replaceState(history.state, "", url);
  }, [preview]);

  const extra = Math.max(0, photoCount - latest.length);
  return (
    <>
      <IllustratedScreen src={ART} video={ART_VIDEO["f3-closing"]} priority>
        <Badge tone="neutral" className={s.doneBadge}>
          Acara selesai
        </Badge>
        <div className={s.doneHead}>
          <h1 className="t-title">Makasih udah mampir!</h1>
          <p className="t-label c-label-2">
            {photoCount} foto · {questionCount} pertanyaan · {guestCount} tamu
          </p>
        </div>
        <EventTickets tickets={tickets} caption={ticketCaption} />
        <Link href={kolaseHref} className={s.kolaseCard}>
          <span className={s.kolaseHead}>
            <span className="t-label-emph">
              Kolase kulkas <span className="c-label-2">· {photoCount} foto</span>
            </span>
            <CaretRight size={16} className="c-label-3" />
          </span>
          {latest.length > 0 ? (
            <span className={s.kolaseStrip} aria-hidden>
              {latest.map((p) => (
                <span key={p.id} className={cx(s.thumb, !p.src && s[`ph${p.tone % 4}`])}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- route proxy, bukan aset statis */}
                  {p.src && <img src={p.src} alt="" loading="lazy" draggable={false} />}
                </span>
              ))}
              {extra > 0 && (
                <span className={cx("t-label-emph tabular", s.thumbMore)}>+{extra}</span>
              )}
            </span>
          ) : (
            <span className="t-label c-label-2">Belum ada foto</span>
          )}
        </Link>
        {filled ? (
          <Button variant="secondary" icon={<Check />} onClick={open}>
            Buku tamu udah diisi
          </Button>
        ) : (
          <Button icon={<BookOpen />} onClick={open}>
            Isi buku tamu · ± 1 menit
          </Button>
        )}
      </IllustratedScreen>
      <BukuTamuSheet
        token={token}
        open={sheet}
        onClose={close}
        sessions={sessions}
        kolaseHref={kolaseHref}
        preview={preview}
      />
    </>
  );
}

// Tamu yang belum check-in buka link setelah acara ditutup: kerangka sama, tanpa tiket & buku tamu
// (temuan v2 #16). Copy bukan dari Figma.
export function SelesaiLuarScreen({ followHref }: { followHref: string }) {
  return (
    <IllustratedScreen src={ART} video={ART_VIDEO["f3-closing"]} priority>
      <Badge tone="neutral" className={s.doneBadge}>
        Acara selesai
      </Badge>
      <div className={s.doneHead}>
        <h1 className="t-title">Acaranya udah selesai</h1>
        <p className="t-body c-label-2">
          Makasih udah mau datang. Sampai ketemu di acara Potara berikutnya, kabarnya ada di
          Instagram kami.
        </p>
      </div>
      <Button variant="secondary" href={followHref} icon={<InstagramLogo />}>
        Follow @potarastudio
      </Button>
    </IllustratedScreen>
  );
}
