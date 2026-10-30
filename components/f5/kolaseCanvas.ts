import { KOLASE_H, KOLASE_THUMB_MAX, KOLASE_W, kolaseWall } from "@/lib/kolase";

// T15c · gambar kolase 9:16 (1080×1920) digambar di HP pakai canvas — gratis, tanpa server render.
// Susunan dinding acak (lib/kolase `kolaseWall`, seed = tombol "Acak"): foto memenuhi bidang,
// sebagian ditempel di kertas putih & sedikit miring. Sel kecil pakai thumbnail (hemat memori HP).
// Foto diambil lewat route proxy (same-origin → canvas nggak "tainted"). Warna dari token tema
// light (bukan hex di kode), font Switzer (tunggu document.fonts). Foto gagal dimuat / pratinjau
// tanpa src → kotak gradasi seperti placeholder Figma.

export type KolaseItem = {
  id: string;
  src?: string; // foto full
  thumb?: string; // thumbnail 320 buat sel kecil
  tone: number;
};

type Palette = Record<
  "bg" | "card" | "label" | "label2" | "label3" | "card2" | "accent" | "soft",
  string
>;

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
    card: v("--card"),
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

export async function renderKolase(
  items: KolaseItem[],
  header: { title: string; subtitle: string },
  seed: number,
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = KOLASE_W;
  canvas.height = KOLASE_H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas nggak tersedia");
  const c = lightPalette();
  const font = getComputedStyle(document.body).fontFamily;
  await document.fonts?.ready;
  const cells = kolaseWall(items.length, seed);
  const images = await Promise.all(
    cells.map((cell) => {
      const it = items[cell.index];
      const small = Math.max(cell.w, cell.h) <= KOLASE_THUMB_MAX;
      return loadImage(small ? (it.thumb ?? it.src) : (it.src ?? it.thumb));
    }),
  );

  ctx.fillStyle = c.card2;
  ctx.fillRect(0, 0, KOLASE_W, KOLASE_H);

  cells.forEach((cell, i) => {
    const it = items[cell.index];
    const img = images[i];
    ctx.save();
    ctx.translate(cell.x + cell.w / 2, cell.y + cell.h / 2);
    ctx.rotate((cell.rot * Math.PI) / 180);
    const x = -cell.w / 2;
    const y = -cell.h / 2;
    // Kertas putih di belakang foto (seperti guntingan yang ditempel).
    if (cell.paper) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 3;
      ctx.fillStyle = c.card;
      ctx.fillRect(
        x - cell.paper,
        y - cell.paper,
        cell.w + cell.paper * 2,
        cell.h + cell.paper * 2,
      );
      ctx.shadowColor = "transparent";
    }
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
        x,
        y,
        cell.w,
        cell.h,
      );
    } else {
      const g = ctx.createLinearGradient(x, y, x + cell.w * 0.3, y + cell.h);
      const tones = [
        [c.accent, c.soft],
        [c.label2, c.label],
        [c.label3, c.card2],
        [c.soft, c.accent],
      ][it.tone % 4];
      g.addColorStop(0, tones[0]);
      g.addColorStop(1, tones[1]);
      ctx.fillStyle = g;
      ctx.fillRect(x, y, cell.w, cell.h);
    }
    ctx.restore();
  });

  // Label di pita bawah: "potara · HMD" + "Kolase foto · 8.11.26" di kertas putih miring dikit.
  ctx.save();
  ctx.translate(64, KOLASE_H - 150);
  ctx.rotate((-1.2 * Math.PI) / 180);
  ctx.font = `600 52px ${font}`;
  const titleW = ctx.measureText(header.title).width;
  ctx.font = `500 30px ${font}`;
  const subW = ctx.measureText(header.subtitle).width;
  ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = c.card;
  roundRect(ctx, 0, 0, Math.max(titleW, subW) + 72, 128, 6);
  ctx.fill();
  ctx.shadowColor = "transparent";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = c.label;
  ctx.font = `600 52px ${font}`;
  ctx.fillText(header.title, 36, 62);
  ctx.fillStyle = c.label2;
  ctx.font = `500 30px ${font}`;
  ctx.fillText(header.subtitle, 36, 104);
  ctx.restore();

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Gambar gagal dibuat"))),
      "image/jpeg",
      0.9,
    ),
  );
}
