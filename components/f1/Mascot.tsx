import { Sparkle } from "@/components/icons";
import { cx } from "@/lib/cx";
import styles from "./invite.module.css";

// Panggung undangan (Figma 4920:28510 T01a / 4920:28467 T01): lingkaran putih, Pota (maskot)
// ngintip atau duduk, stiker miring, kilau. Dekorasi saja — disembunyikan dari pembaca layar.
// Posisi = koordinat Figma ×2 relatif terhadap panggung yang selebar layar (390).
const SPARKLES = {
  ngintip: [
    { x: 36, y: 72, s: 24, tone: "accent" },
    { x: 330, y: 132, s: 18, tone: "crew" },
    { x: 24, y: 192, s: 14, tone: "crew" },
  ],
  duduk: [
    { x: 30, y: 109, s: 22, tone: "accent" },
    { x: 330, y: 99, s: 18, tone: "crew" },
    { x: 310, y: 259, s: 26, tone: "crew" },
    { x: 40, y: 259, s: 16, tone: "accent" },
    { x: 200, y: 69, s: 14, tone: "crew" },
  ],
} as const;

export function MascotStage({
  pose,
  sticker,
  className,
}: {
  pose: "ngintip" | "duduk";
  sticker: string;
  className?: string;
}) {
  return (
    <div aria-hidden className={cx(styles.stage, styles[pose], className)}>
      <span className={styles.panggung} />
      {/* eslint-disable-next-line @next/next/no-img-element -- ilustrasi statis dari Figma */}
      <img
        className={styles.pota}
        src={pose === "ngintip" ? "/figma/pota-ngintip.webp" : "/figma/pota-duduk.webp"}
        alt=""
      />
      <span className={styles.sticker}>
        <Sparkle size={16} weight="fill" />
        {sticker}
      </span>
      {SPARKLES[pose].map((p, i) => (
        <Sparkle
          key={i}
          className={cx(styles.sparkle, styles[`sparkle-${p.tone}`])}
          size={p.s}
          weight="fill"
          style={{ left: p.x, top: p.y }}
        />
      ))}
    </div>
  );
}
