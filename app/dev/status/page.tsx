import { connection } from "next/server";
import { Suspense } from "react";
import { getStore } from "@/lib/data";
import { secrets } from "@/lib/server/config";
import styles from "../../placeholder.module.css";

export const metadata = { title: "Status build · HMD" };

async function DataStatus() {
  await connection();
  const status = await readStatus();
  if ("error" in status) {
    return (
      <dl className={styles.card}>
        <Row label="Konfigurasi" value={status.error} tone="bad" />
      </dl>
    );
  }
  const { ping, mode, guests, pinSet } = status;
  return (
    <dl className={styles.card}>
      <Row label="Sumber data" value="Mock (in-memory)" />
      <Row
        label="Koneksi data"
        value={ping.ok ? `OK · ${ping.latencyMs} ms` : "Gagal"}
        tone={ping.ok ? "ok" : "bad"}
      />
      <Row label="Tamu dummy" value={String(guests)} />
      <Row label="Mode acara" value={mode} />
      <Row
        label="PIN panitia"
        value={pinSet ? "Terpasang" : "Belum diisi (.env.local)"}
        tone={pinSet ? "ok" : "bad"}
      />
      <Row label="Realtime" value="Belum dipasang" />
    </dl>
  );
}

type Status =
  | { error: string }
  | { ping: { ok: boolean; latencyMs: number }; mode: string; guests: number; pinSet: boolean };

async function readStatus(): Promise<Status> {
  try {
    const store = await getStore();
    const [ping, state, guests] = await Promise.all([
      store.ping(),
      store.getEventState(),
      store.listGuests(),
    ]);
    return { ping, mode: state.mode, guests: guests.length, pinSet: !!secrets().eventPin };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

function Row({ label, value, tone }: { label: string; value: string; tone?: "ok" | "bad" }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd className={tone ? styles[tone] : undefined}>{value}</dd>
    </div>
  );
}

export default function StatusPage() {
  return (
    <main className={styles.screen}>
      <p className={styles.eyebrow}>Dev</p>
      <h1 className={styles.title}>Status build</h1>
      <dl className={styles.card}>
        <Row
          label="Versi"
          value={`${process.env.NEXT_PUBLIC_APP_VERSION} · ${process.env.NEXT_PUBLIC_BUILD_SHA}`}
        />
        <Row
          label="Dibangun"
          value={`${process.env.NEXT_PUBLIC_BUILD_TIME?.slice(0, 16).replace("T", " ")} UTC`}
        />
      </dl>
      <Suspense fallback={<div className={styles.card}>Mengecek data…</div>}>
        <DataStatus />
      </Suspense>
    </main>
  );
}
