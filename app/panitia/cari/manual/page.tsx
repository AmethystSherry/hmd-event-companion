import { Suspense } from "react";
import { CaretLeft, Check, DownloadSimple, Printer } from "@/components/icons";
import { Banner, Button, IconButton, Screen, ScreenHeader, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { EVENT, keyLabel } from "@/lib/event";
import { requireCrew } from "@/lib/server/access";
import styles from "./manual.module.css";

export const metadata = { title: "Daftar manual · Panitia" };

// P07d · Daftar manual (PDF): cadangan terakhir kalau semua sistem mati.
export default function ManualPage() {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={100} />
          <Skeleton height={90} radius={20} />
          <Skeleton height={400} radius={6} />
        </Screen>
      }
    >
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireCrew("/panitia/cari/manual");
  const store = await getStore();
  const guests = (await store.listGuests()).filter((g) => g.rsvp !== "tidak");
  const tickets = await Promise.all(guests.map((g) => store.getTicketForGuest(g.id)));

  return (
    <Screen
      withBack
      bottom={
        <Button href="/api/panitia/daftar-manual" prefetch={false} icon={<DownloadSimple />}>
          Unduh PDF
        </Button>
      }
    >
      <ScreenHeader
        leading={<IconButton href="/panitia/cari" label="Kembali" icon={<CaretLeft />} />}
        eyebrow="Cadangan terakhir · semua sistem mati"
        title="Daftar manual"
      />
      <Banner tone="neutral" icon={<Printer />} title="Cetak H-1, taruh di meja depan">
        Kalau HP &amp; sinyal mati semua, centang tamu di kertas. Input ulang setelah sistem balik.
      </Banner>

      {/* Pratinjau kertas: putih tetap di kedua mode. */}
      <div className={styles.paper} aria-label="Pratinjau daftar manual">
        <div className={styles.head}>
          <div>
            <p className={styles.title}>HMD · Daftar tamu</p>
            <p className={styles.caption}>Minggu, 8 Nov 2026 · {EVENT.location}</p>
          </div>
          <p className={styles.page}>Hal 1/{Math.max(1, Math.ceil(guests.length / 28))}</p>
        </div>
        <div className={`${styles.row} ${styles.tableHead}`}>
          <span className={styles.check}>✓</span>
          <span className={styles.no}>No</span>
          <span className={styles.name}>Nama</span>
          <span className={styles.ig}>Instagram</span>
          <span className={styles.code}>Kode</span>
        </div>
        {guests.map((g, i) => {
          const done = tickets[i]?.status === "dipakai";
          return (
            <div key={g.id} className={styles.row}>
              <span className={styles.check}>
                <span className={styles.box}>{done && <Check size={14} />}</span>
              </span>
              <span className={`${styles.no} ${styles.mono}`}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className={styles.name}>{g.name}</span>
              <span className={styles.ig}>@{g.ig}</span>
              <span className={`${styles.code} ${styles.mono}`}>{keyLabel(g.keyNo)}</span>
            </div>
          );
        })}
        <p className={styles.footer}>Walk-in: tulis nama + IG di baliknya</p>
      </div>
    </Screen>
  );
}
