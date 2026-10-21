import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./IconButton.module.css";

// Clean/IconButton (4587:317): lingkaran 44 bergaya Button Secondary.
// Varian "glass" untuk layar kamera (BT06): transparan, tanpa Border/Highlight.
type Common = {
  label: string; // aria-label wajib — ikon saja
  icon: ReactNode;
  variant?: "default" | "glass";
  className?: string;
};

export function IconButton(
  props: Common &
    (Omit<ComponentProps<"button">, "children"> | Omit<ComponentProps<typeof Link>, "children">),
) {
  const { label, icon, variant = "default", className, ...rest } = props;
  const cls = cx(styles.button, styles[variant], className);
  const content = (
    <>
      <span aria-hidden className={styles.layer} />
      <span className={styles.icon}>{icon}</span>
    </>
  );
  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link aria-label={label} className={cls} {...(rest as ComponentProps<typeof Link>)}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-label={label}
      className={cls}
      {...(rest as ComponentProps<"button">)}
    >
      {content}
    </button>
  );
}
