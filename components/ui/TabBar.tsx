import Link from "next/link";
import { ChatCircle, ListBullets, QrCode, Users } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./TabBar.module.css";

// Clean/TabBar · Panitia (4587:333): bar gelap Kontrol · Tamu · Tanya + tombol Scan bulat terpisah.
// Warna tetap di kedua mode. Di layar scan (P05/P06) tidak ada tab aktif: active="scan".
export type CrewTab = "kontrol" | "tamu" | "tanya" | "scan";

const TABS = [
  { id: "kontrol", label: "Kontrol", href: "/panitia", Icon: ListBullets },
  { id: "tamu", label: "Tamu", href: "/panitia/tamu", Icon: Users },
  { id: "tanya", label: "Tanya", href: "/panitia/tanya", Icon: ChatCircle },
] as const;

export function TabBar({ active, className }: { active: CrewTab; className?: string }) {
  return (
    <nav aria-label="Navigasi panitia" className={cx(styles.wrap, className)}>
      <div className={styles.bar}>
        {TABS.map(({ id, label, href, Icon }) => {
          const on = id === active;
          return (
            <Link
              key={id}
              href={href}
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
        href="/panitia/scan"
        aria-label="Scan tiket"
        aria-current={active === "scan" ? "page" : undefined}
        className={styles.scan}
      >
        <QrCode size={24} />
      </Link>
    </nav>
  );
}
