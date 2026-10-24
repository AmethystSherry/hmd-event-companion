import { initials } from "@/lib/format";
import { KOLASE_H, KOLASE_W, kolaseLayout } from "@/lib/kolase";

// T15c · gambar kolase 9:16 (1080×1920) digambar di HP pakai canvas — gratis, tanpa server render.
// Foto diambil lewat route proxy (same-origin → canvas nggak "tainted"). Warna dari token tema
// light (bukan hex di kode), font Switzer (tunggu document.fonts). Foto gagal dimuat / pratinjau
// tanpa src → kotak gradasi seperti placeholder Figma.

export type KolaseItem = {
  id: string;
  src?: string; // foto full
  width: number;
  height: number;
  name: string; // avatar inisial
  caption: string; // "Rara · Talkshow"
  tone: number;
};

type Palette = Record<"bg" | "label" | "label2" | "label3" | "card2" | "accent" | "soft", string>;

// Baca token warna versi light dari CSS (elemen bantu dengan data-theme="light").
function lightPalette(): Palette {
  const probe = document.createElement("div");
  probe.dataset.theme = "light";
  probe.style.display = "none";
  document.body.append(probe);
  const css = getComputedStyle(probe);
  const v = (name: string) => css.getPropertyValue(name).trim();
  const p = {
    bg: v("--bg"),
    label: v("--label"),
    label2: v("--label-2"),
    label3: v("--label-3"),
    card2: v("--card-2"),
    accent: v("--accent"),
    soft: v("--accent-soft"),
  };
  probe.remove();
  return p;
}

async function loadImage(src?: string): Promise<HTMLImageElement | null> {
  if (!src) return null;
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  try {
    await img.decode();
    return img;
  } catch {
    return null;
  }
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function ellipsis(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1);
  return `${s.trimEnd()}…`;
}

export async function renderKolase(
  items: KolaseItem[],
  header: { title: string; subtitle: string },
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = KOLASE_W;
  canvas.height = KOLASE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nggak tersedia");
  const c = lightPalette();
  const font = getComputedStyle(document.body).fontFamily;
  await document.fonts?.ready;
  const images = await Promise.all(items.map((it) => loadImage(it.src)));

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, KOLASE_W, KOLASE_H);

  // Header: "potara · HMD" + "Kulkas polaroid · 8.11.26".
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = c.label;
  ctx.font = `600 64px ${font}`;
  ctx.fillText(header.title, 64, 140);
  ctx.fillStyle = c.label2;
  ctx.font = `500 34px ${font}`;
  ctx.fillText(header.subtitle, 64, 192);

  const layout = kolaseLayout(items.map((it) => it.height / it.width));
  for (const cell of layout.cells) {
    const it = items[cell.index];
    const img = images[cell.index];
    ctx.save();
    roundRect(ctx, cell.x, cell.y, cell.w, cell.h, 28);
    ctx.clip();
    if (img) {
      // object-fit: cover
      const scale = Math.max(cell.w / img.naturalWidth, cell.h / img.naturalHeight);
      const sw = cell.w / scale;
      const sh = cell.h / scale;
      ctx.drawImage(
        img,
        (img.naturalWidth - sw) / 2,
        (img.naturalHeight - sh) / 2,
        sw,
        sh,
        cell.x,
        cell.y,
        cell.w,
        cell.h,
      );
    } else {
      const g = ctx.createLinearGradient(cell.x, cell.y, cell.x + cell.w * 0.3, cell.y + cell.h);
      const tones = [
        [c.accent, c.soft],
        [c.label2, c.label],
        [c.card2, c.label3],
        [c.soft, c.accent],
      ][it.tone % 4];
      g.addColorStop(0, tones[0]);
      g.addColorStop(1, tones[1]);
      ctx.fillStyle = g;
      ctx.fillRect(cell.x, cell.y, cell.w, cell.h);
    }
    ctx.restore();

    // Caption: avatar inisial 30 + "{nama} · {sesi}".
    const cy = cell.y + cell.h + 28;
    ctx.fillStyle = c.card2;
    ctx.beginPath();
    ctx.arc(cell.x + 17, cy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.label2;
    ctx.font = `600 13px ${font}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initials(it.name), cell.x + 17, cy + 1);
    ctx.textAlign = "left";
    ctx.font = `500 24px ${font}`;
    ctx.fillText(ellipsis(ctx, it.caption, cell.w - 44), cell.x + 42, cy + 1);
    ctx.textBaseline = "alphabetic";
  }

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Gambar gagal dibuat"))),
      "image/jpeg",
      0.9,
    ),
  );
}
