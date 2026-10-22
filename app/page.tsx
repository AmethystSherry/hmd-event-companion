import Link from "next/link";
import styles from "./placeholder.module.css";

// Beranda sementara: tamu masuk lewat link unik /t/{token}; panitia lewat /panitia.
export default function Home() {
  return (
    <main className={styles.screen}>
      <p className={styles.eyebrow}>Minggu, 8 November 2026 · Potara Studio</p>
      <h1 className={styles.title}>House Moving Day</h1>
      <p className={styles.body}>
        Tamu masuk lewat link undangan pribadi. Panitia masuk lewat ruang panitia.
      </p>
      <nav className={styles.links}>
        <Link href="/panitia">Ruang panitia</Link>
        <Link href="/dev/states/f1">F1 · 27 layar</Link>
        <Link href="/dev/ui">Design system</Link>
      </nav>
    </main>
  );
}
