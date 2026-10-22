import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { connection } from "next/server";
import { seedData } from "./seed";
import { createStore, type DataStore } from "./store";
import type { StoreData } from "./types";

export type { DataStore } from "./store";
export { StoreError } from "./store";
export type * from "./types";

// Store lokal (keputusan 22 Okt): in-memory + disimpan ke .data/store.json (di-gitignore) supaya
// bertahan saat server restart. Nanti diganti Supabase lewat interface yang sama (DataStore).
// Disimpan di globalThis supaya halaman, server action & SSE memakai instance yang sama saat dev.
const DIR = join(process.cwd(), ".data");
const FILE = join(DIR, "store.json");

const g = globalThis as typeof globalThis & { __hmdStoreF1?: DataStore };

function load(): StoreData {
  try {
    const data = JSON.parse(readFileSync(FILE, "utf8")) as StoreData;
    if (data.version === 1) return data;
  } catch {
    // belum ada file / rusak → seed baru
  }
  return seedData();
}

// Tulis atomik (file sementara → rename). Gagal tulis (mis. FS read-only) → tetap jalan in-memory.
function persist(data: StoreData) {
  try {
    mkdirSync(DIR, { recursive: true });
    writeFileSync(`${FILE}.tmp`, JSON.stringify(data, null, 2));
    renameSync(`${FILE}.tmp`, FILE);
  } catch (err) {
    console.warn("[store] gagal menyimpan .data/store.json:", (err as Error).message);
  }
}

export async function getStore(): Promise<DataStore> {
  await connection(); // data selalu dinamis (cacheComponents)
  return (g.__hmdStoreF1 ??= createStore(load(), { persist }));
}

// Dev saja: kembali ke seed (tanpa tamu). Dipanggil dari /dev/states/f1.
export async function resetStore(): Promise<void> {
  (await getStore()).reset(seedData());
}
