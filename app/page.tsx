import Link from "next/link";
import styles from "./placeholder.module.css";

// Development di-hold untuk revisi logika: yang aktif hanya design system (/dev/ui).
export default function Home() {
  return (
    <main className={styles.screen}>
      <p className={styles.eyebrow}>Minggu, 8 November 2026 · Potara Studio</p>
      <h1 className={styles.title}>House Moving Day</h1>
      <p className={styles.body}>Lagi revisi. Yang bisa dilihat sekarang hanya design system.</p>
      <nav className={styles.links}>
        <Link href="/dev/ui">Design system</Link>
      </nav>
    </main>
  );
}
