import { Check } from "@/components/icons";
import s from "./n5.module.css";

// N5 · stempel "KENALAN" di pojok kanan bawah foto BTk4 (Figma 5330:9838, 6 Nov): lingkaran 72 hijau
// (--success-text, sama dengan badge ✓ N4), garis putus-putus putih, Check Bold + teks kecil kapital,
// sedikit miring. Dipasang lewat slot `stamp` Polaroid.
export function KenalanStamp() {
  return (
    <span className={s.stamp} role="img" aria-label="Udah kenalan">
      <Check weight="bold" className={s.stampIcon} />
      <span className={s.stampText}>KENALAN</span>
    </span>
  );
}
