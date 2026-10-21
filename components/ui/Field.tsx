import { useId, type ComponentProps, type ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Field.module.css";

// Field input (T02, T14): label Label abu di atas, kotak card-2 radius 16, Body 15.
// `error` → garis danger + pesan; isian tetap (tidak pernah dikosongkan saat gagal).
type Shared = { label: string; hint?: ReactNode; error?: string; className?: string };

export function Field({
  label,
  hint,
  error,
  className,
  multiline,
  ...rest
}: Shared &
  (
    | ({ multiline?: false } & ComponentProps<"input">)
    | ({ multiline: true } & ComponentProps<"textarea">)
  )) {
  const id = useId();
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cx(styles.field, className)}>
      <label htmlFor={id} className="t-label c-label-2">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cx(styles.control, styles.textarea, error && styles.invalid)}
          {...(rest as ComponentProps<"textarea">)}
        />
      ) : (
        <input
          id={id}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cx(styles.control, error && styles.invalid)}
          {...(rest as ComponentProps<"input">)}
        />
      )}
      {error ? (
        <p id={`${id}-err`} className={cx("t-label", styles.error)}>
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="t-label c-label-2">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
