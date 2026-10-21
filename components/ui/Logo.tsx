// Potara/Logo mark (4721:9362): vektor dari Figma, tanpa efek. Ukuran 32 di header.
export function LogoMark({ size = 32, title = "Potara" }: { size?: number; title?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- SVG statis dari Figma
    <img src="/figma/logo-mark.svg" alt={title} width={size} height={size} />
  );
}
