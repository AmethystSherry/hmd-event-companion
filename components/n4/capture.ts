import {
  centerCrop,
  fitSize,
  JPEG_QUALITIES,
  MAX_PHOTO_BYTES,
  MAX_THUMB_BYTES,
  PHOTO_LONG_SIDE,
  THUMB_LONG_SIDE,
  type Rect,
} from "@/lib/photo";

// N4 · jepret & kompres di HP (prd §9): potong tengah 5:6 (persis yang terlihat di viewfinder),
// sisi panjang 1280, JPEG dengan kualitas turun bertahap sampai ≤ 400 KB, + thumbnail 320 (≤ 40 KB).
// Hasil disimpan TIDAK di-mirror (preview kamera depan saja yang di-mirror).

export type Captured = { photo: Blob; thumb: Blob; width: number; height: number };

function toBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Gagal mengompres foto"))),
      "image/jpeg",
      quality,
    ),
  );
}

function draw(src: CanvasImageSource, crop: Rect, w: number, h: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
  return canvas;
}

async function encode(
  src: CanvasImageSource,
  crop: Rect,
  longSide: number,
  maxBytes: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  let size = fitSize(crop.w, crop.h, longSide);
  for (let round = 0; round < 4; round++) {
    const canvas = draw(src, crop, size.w, size.h);
    let blob: Blob | null = null;
    for (const q of JPEG_QUALITIES) {
      blob = await toBlob(canvas, q);
      if (blob.size <= maxBytes) return { blob, width: size.w, height: size.h };
    }
    size = { w: Math.round(size.w * 0.85), h: Math.round(size.h * 0.85) };
  }
  throw new Error("Fotonya terlalu besar");
}

async function compress(src: CanvasImageSource, srcW: number, srcH: number): Promise<Captured> {
  const crop = centerCrop(srcW, srcH);
  const full = await encode(src, crop, PHOTO_LONG_SIDE, MAX_PHOTO_BYTES);
  const thumb = await encode(src, crop, THUMB_LONG_SIDE, MAX_THUMB_BYTES);
  return { photo: full.blob, thumb: thumb.blob, width: full.width, height: full.height };
}

// Dari kamera live (BT06).
export function captureVideo(video: HTMLVideoElement): Promise<Captured> {
  return compress(video, video.videoWidth, video.videoHeight);
}

// Jalur cadangan: foto dari kamera bawaan HP (<input capture>), orientasi EXIF ikut diterapkan.
export async function captureFile(file: File): Promise<Captured> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    return await compress(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}
