import Link from "next/link";
import styles from "./dev.module.css";

export const metadata = { title: "Alat dev" };

// /dev: daftar alat uji & design system (dulu beranda `/`; sekarang `/` langsung ke P01 PIN).
export default function DevHome() {
  return (
    <main className={styles.screen}>
      <p className={styles.eyebrow}>Minggu, 8 November 2026 · Potara Studio</p>
      <h1 className={styles.title}>Alat dev</h1>
      <p className={styles.body}>
        Pratinjau layar & alat uji. Tamu masuk lewat link undangan pribadi, panitia lewat halaman
        utama.
      </p>
      <nav className={styles.links}>
        <Link href="/panitia">Ruang panitia</Link>
        <Link href="/dev/ui">Design system</Link>
        <Link href="/dev/states/f1">F1 · Undangan & konfirmasi</Link>
        <Link href="/dev/states/f2">F2 · Check-in di pintu</Link>
        <Link href="/dev/states/f4">F3 + F4 · Selama acara</Link>
        <Link href="/dev/states/n1">N1 · Pertanyaan talkshow</Link>
        <Link href="/dev/states/n3">N3 · Kenalan antartamu</Link>
        <Link href="/dev/states/n4">N4 · Foto kolase</Link>
        <Link href="/dev/states/n5">N5 · Kenalan & hadiah</Link>
        <Link href="/dev/states/f5">F5 · Tutup acara & feedback</Link>
      </nav>
    </main>
  );
}
