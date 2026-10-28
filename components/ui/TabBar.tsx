import Link from "next/link";
import type { ReactNode } from "react";
import { ChatCircle, ListBullets, QrCode, Users } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./TabBar.module.css";

// Clean/TabBar · Panitia (4587:333): bar gelap Kontrol · Tamu · Tanya + tombol Scan bulat terpisah.
// Warna tetap di kedua mode. Di layar scan (P05/P06) tidak ada tab aktif: active="scan".
export type CrewTab = "kontrol" | "tamu" | "tanya" | "scan";

// Rute per event: /panitia/event/{id}/kontrol · /tamu · /tanya (belum ada) · /scan.
const TABS = [
  { id: "kontrol", label: "Kontrol", path: "kontrol", Icon: ListBullets },
  { id: "tamu", label: "Tamu", path: "tamu", Icon: Users },
  { id: "tanya", label: "Tanya", path: "tanya", Icon: ChatCircle },
] as const;

export function TabBar({
  active,
  eventId,
  className,
}: {
  active: CrewTab;
  eventId?: string; // kosong = pratinjau /dev/ui (tautan ke /panitia)
  className?: string;
}) {
  const href = (path: string) => (eventId ? `/panitia/event/${eventId}/${path}` : "/panitia");
  return (
    <nav aria-label="Navigasi panitia" className={cx(styles.wrap, className)}>
      <div className={styles.bar}>
        {TABS.map(({ id, label, path, Icon }) => {
          const on = id === active;
          return (
            <Link
              key={id}
              href={href(path)}
              aria-label={label}
              aria-current={on ? "page" : undefined}
              className={cx(styles.tab, on && styles.active)}
            >
              <Icon size={22} />
              {on && <span className={styles.label}>{label}</span>}
            </Link>
          );
        })}
      </div>
      <Link
        href={href("scan")}
        aria-label="Scan tiket"
        aria-current={active === "scan" ? "page" : undefined}
        className={styles.scan}
      >
        <QrCode size={24} />
      </Link>
    </nav>
  );
}

// Varian tamu (layar acara BT03/BT2x, 28 Okt): anatomi sama — tombol bulat terpisah (kanan = Tanya,
// redup kalau Talkshow belum jalan) + bar gelap berisi pintasan sheet (Tamu · Rundown · Galeri).
// Tombol (bukan link): tiap item membuka sheet; nggak ada tab aktif → ikon saja + aria-label.
export type GuestTab = { id: string; label: string; icon: ReactNode; onClick: () => void };

export function GuestTabBar({
  tabs,
  ask,
  className,
}: {
  tabs: GuestTab[];
  ask: { label: string; icon: ReactNode; onClick: () => void; disabled?: boolean; hint?: string };
  className?: string;
}) {
  return (
    <nav aria-label="Pintasan" className={cx(styles.wrap, styles.guest, className)}>
      <div className={cx(styles.bar, styles.fill)}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-label={t.label}
            onClick={t.onClick}
            className={cx(styles.tab, styles.tabFill)}
          >
            {t.icon}
          </button>
        ))}
      </div>
      <button
        type="button"
        aria-label={ask.disabled ? (ask.hint ?? ask.label) : ask.label}
        aria-disabled={ask.disabled || undefined}
        onClick={ask.disabled ? undefined : ask.onClick}
        className={cx(styles.scan, ask.disabled && styles.off)}
      >
        {ask.icon}
      </button>
    </nav>
  );
}
