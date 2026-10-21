import styles from "../placeholder.module.css";

// Ruang panitia. P01 PIN dan tab Kontrol · Tamu · Scan · Tanya dibangun mulai Phase 3.
export default function PanitiaPage() {
  return (
    <main className={styles.screen}>
      <p className={styles.eyebrow}>Panitia</p>
      <h1 className={styles.title}>Masuk ruang panitia</h1>
      <p className={styles.body}>Masuk pakai PIN acara. Lagi disiapkan.</p>
    </main>
  );
}
