import styles from "../../../placeholder.module.css";

// Halaman tamu (link unik bertoken). Alur T01–T05 dibangun di Phase 3–4.
// Token tidak pernah ditampilkan atau di-log.
export default function GuestPage() {
  return (
    <main className={styles.screen}>
      <p className={styles.eyebrow}>Undangan pribadi · House Moving Day</p>
      <h1 className={styles.title}>Potara pindah rumah.</h1>
      <p className={styles.body}>Halaman undangan lagi disiapkan.</p>
    </main>
  );
}
