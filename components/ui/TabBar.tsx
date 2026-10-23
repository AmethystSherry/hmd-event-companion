import Link from "next/link";
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
