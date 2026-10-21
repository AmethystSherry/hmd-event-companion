import { connection } from "next/server";
import { Suspense } from "react";
import { getStore } from "@/lib/data";
import styles from "../../placeholder.module.css";

export const metadata = { title: "Status build · HMD" };

async function DataStatus() {
  await connection();
  const store = getStore();
  const [ping, state] = await Promise.all([store.ping(), store.getEventState()]);
  return (
    <dl className={styles.card}>
      <div className={styles.row}>
        <dt>Sumber data</dt>
        <dd>{store.kind === "mock" ? "Mock (in-memory)" : store.kind}</dd>
      </div>
      <div className={styles.row}>
        <dt>Koneksi data</dt>
        <dd className={ping.ok ? styles.ok : styles.bad}>
          {ping.ok ? `OK · ${ping.latencyMs} ms` : "Gagal"}
        </dd>
      </div>
      <div className={styles.row}>
        <dt>Mode acara</dt>
        <dd>{state.mode}</dd>
      </div>
      <div className={styles.row}>
        <dt>Realtime</dt>
        <dd>Belum dipasang</dd>
      </div>
    </dl>
  );
}

export default function StatusPage() {
  return (
    <main className={styles.screen}>
      <p className={styles.eyebrow}>Dev</p>
      <h1 className={styles.title}>Status build</h1>
      <dl className={styles.card}>
        <div className={styles.row}>
          <dt>Versi</dt>
          <dd>
            {process.env.NEXT_PUBLIC_APP_VERSION} · {process.env.NEXT_PUBLIC_BUILD_SHA}
          </dd>
        </div>
        <div className={styles.row}>
          <dt>Dibangun</dt>
          <dd>{process.env.NEXT_PUBLIC_BUILD_TIME?.slice(0, 16).replace("T", " ")} UTC</dd>
        </div>
      </dl>
      <Suspense fallback={<div className={styles.card}>Mengecek data…</div>}>
        <DataStatus />
      </Suspense>
    </main>
  );
}
