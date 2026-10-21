import type { ReactNode } from "react";
import { Check } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./Badge.module.css";

// Clean/Badge (4587:307): Live = oranye (tamu), Crew = amber (panitia), Success, Neutral,
// plus Warning/Danger untuk status (G10: token terpisah dari amber panitia).
export type BadgeTone = "live" | "crew" | "success" | "neutral" | "warning" | "danger";

export function Badge({
  tone = "neutral",
  children,
  icon,
  pulse,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  icon?: ReactNode;
  pulse?: boolean; // titik Live berdenyut
  className?: string;
}) {
  const lead =
    icon ??
    (tone === "success" ? (
      <Check size={13} weight="regular" />
    ) : (
      <span aria-hidden className={cx(styles.dot, pulse && styles.pulse)} />
    ));
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      {lead}
      {children}
    </span>
  );
}
