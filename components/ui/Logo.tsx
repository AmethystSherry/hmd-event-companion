import styles from "./Logo.module.css";

// Potara/Logo mark (4721:9362): vektor dari Figma, tanpa efek. Ukuran 32 di header.
export function LogoMark({ size = 32, title = "Potara" }: { size?: number; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG statis dari Figma
    <img src="/figma/logo-mark.svg" alt={title} width={size} height={size} />
  );
}

// Logo Potara × logo kolaborasi HMD (5 Nov): prangko T01 & amplop T01a. Dekoratif (aria-hidden).
export function CollabMark({ size = 18, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={`${styles.collab} ${className ?? ""}`}
      style={{ gap: Math.max(3, Math.round(size * 0.2)) }}
    >
      <LogoMark size={size} title="" />
      <span className={styles.x} style={{ fontSize: Math.round(size * 0.66) }}>
        ×
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element -- logo statis */}
      <img
        src="/figma/collab-logo.png"
        alt=""
        width={size}
        height={size}
        className={styles.partner}
        style={{ borderRadius: Math.round(size * 0.22) }}
      />
    </span>
  );
}
