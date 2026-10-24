import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { supabaseEnv } from "../data/supabase";

// N4 · file foto kolase. Store cuma 1 baris JSON, jadi gambarnya disimpan terpisah:
// - Supabase (Vercel): Storage bucket privat `hmd-photos`, lewat REST dengan service key — hanya
//   dari server. HP membaca lewat route proxy yang mengecek token tamu / sesi panitia.
// - Lokal: .data/photos/{eventId}/{id}.jpg (di-gitignore).
// Tiap foto 2 file: utuh (≤ 400 KB) dan thumbnail (≤ 40 KB, strip BT07 & kolase).

export type PhotoVariant = "full" | "thumb";

const BUCKET = process.env.SUPABASE_PHOTO_BUCKET || "hmd-photos";
const DIR = join(process.cwd(), ".data", "photos");

const fileName = (id: string, v: PhotoVariant) => (v === "thumb" ? `${id}_t.jpg` : `${id}.jpg`);
const objectPath = (eventId: string, id: string, v: PhotoVariant) =>
  `${eventId}/${fileName(id, v)}`;

async function storage(path: string, init: RequestInit & { upsert?: boolean } = {}) {
  const env = supabaseEnv()!;
  const { upsert, ...rest } = init;
  return fetch(`${env.url}/storage/v1/${path}`, {
    ...rest,
    cache: "no-store",
    headers: {
      apikey: env.key,
      Authorization: `Bearer ${env.key}`,
      ...(upsert ? { "x-upsert": "true" } : {}),
      ...rest.headers,
    },
  });
}

// Tulis (atau timpa — upload ulang dengan id sama aman). Dipanggil sebelum metadata masuk store,
// jadi store nggak pernah menunjuk file yang belum ada.
export async function putPhotoFile(
  eventId: string,
  id: string,
  variant: PhotoVariant,
  bytes: Uint8Array,
): Promise<void> {
  if (supabaseEnv()) {
    const res = await storage(`object/${BUCKET}/${objectPath(eventId, id, variant)}`, {
      method: "POST",
      upsert: true,
      headers: { "Content-Type": "image/jpeg" },
      body: bytes as BodyInit,
    });
    if (!res.ok) throw new Error(`[photos] upload ${res.status}`);
    return;
  }
  const dir = join(DIR, eventId);
  await mkdir(dir, { recursive: true });
  const file = join(dir, fileName(id, variant));
  await writeFile(`${file}.tmp`, bytes);
  await rename(`${file}.tmp`, file);
}

export async function readPhotoFile(
  eventId: string,
  id: string,
  variant: PhotoVariant,
): Promise<Uint8Array | null> {
  if (supabaseEnv()) {
    const res = await storage(`object/authenticated/${BUCKET}/${objectPath(eventId, id, variant)}`);
    if (res.status === 400 || res.status === 404) return null;
    if (!res.ok) throw new Error(`[photos] baca ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  }
  try {
    return new Uint8Array(await readFile(join(DIR, eventId, fileName(id, variant))));
  } catch {
    return null;
  }
}

export async function deletePhotoFiles(eventId: string, id: string): Promise<void> {
  const variants: PhotoVariant[] = ["full", "thumb"];
  if (supabaseEnv()) {
    await storage(`object/${BUCKET}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefixes: variants.map((v) => objectPath(eventId, id, v)) }),
    });
    return;
  }
  await Promise.all(
    variants.map((v) => unlink(join(DIR, eventId, fileName(id, v))).catch(() => {})),
  );
}
