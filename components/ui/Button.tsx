import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Button.module.css";

// Clean/Button (Figma 4587:316): capsule 54. Primary = Ink glossy (warna tetap di kedua mode),
// Secondary = abu-abu dengan border + highlight.
type Variant = "primary" | "secondary";

type BaseProps = {
  variant?: Variant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
};

type ButtonProps = BaseProps & Omit<ComponentProps<"button">, "children"> & { href?: undefined };
type LinkProps = BaseProps & Omit<ComponentProps<typeof Link>, "children">;

export function Button(props: ButtonProps | LinkProps) {
  const { variant = "primary", icon, children, className, ...rest } = props;
  const content = (
    <>
      <span aria-hidden className={styles.layer} />
      {icon && <span className={styles.icon}>{icon}</span>}
      <span className={styles.label}>{children}</span>
    </>
  );
  const cls = cx(styles.button, styles[variant], className);
  if ("href" in rest && rest.href !== undefined) {
    return (
      <Link className={cls} {...(rest as Omit<LinkProps, keyof BaseProps>)}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" className={cls} {...(rest as Omit<ButtonProps, keyof BaseProps>)}>
      {content}
    </button>
  );
}
