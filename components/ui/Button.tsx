import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Button.module.css";

// Clean/Button (Figma 4587:316): Size × Style × Content = 12 varian.
// - size "lg" 54 (CTA bawah & sheet, lebar penuh) · "sm" 36 (aksi header/kartu/baris, lebar hug).
// - variant primary = Ink glossy, destructive = merah (keduanya warna tetap di light & dark),
//   secondary = abu-abu dengan border + highlight (ikut tema).
// - iconOnly → lingkaran 54/36, `label` jadi aria-label.
// Ikon selalu ikut warna label (currentColor). Jangan override warna/efek di pemakaian.
type Variant = "primary" | "secondary" | "destructive";
type Size = "lg" | "sm";

type BaseProps = {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  className?: string;
};

type ContentProps =
  | { iconOnly?: false; label?: undefined; children: ReactNode }
  | { iconOnly: true; label: string; icon: ReactNode; children?: undefined };

type ButtonProps = BaseProps &
  ContentProps &
  Omit<ComponentProps<"button">, "children"> & { href?: undefined };
type LinkProps = BaseProps & ContentProps & Omit<ComponentProps<typeof Link>, "children">;

export function Button(props: ButtonProps | LinkProps) {
  const {
    variant = "primary",
    size = "lg",
    iconOnly,
    label,
    icon,
    children,
    className,
    ...rest
  } = props;
  const content = (
    <>
      <span aria-hidden className={styles.layer} />
      {icon && (
        <span aria-hidden className={styles.icon}>
          {icon}
        </span>
      )}
      {!iconOnly && <span className={styles.label}>{children}</span>}
    </>
  );
  const cls = cx(
    styles.button,
    styles[variant],
    styles[size],
    iconOnly && styles.iconOnly,
    className,
  );
  const a11y = iconOnly ? { "aria-label": label } : {};
  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link className={cls} {...a11y} {...(rest as Omit<LinkProps, keyof BaseProps>)}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      className={cls}
      {...a11y}
      {...(rest as Omit<ButtonProps, keyof BaseProps>)}
    >
      {content}
    </button>
  );
}
