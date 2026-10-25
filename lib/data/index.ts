import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { connection } from "next/server";
import { seedData } from "./seed";
import { createStore, type DataStore } from "./store";
import { loadRemote, loadRemoteRev, saveRemote, supabaseEnv } from "./supabase";
import type { StoreData } from "./types";

export type { DataStore } from "./store";
export { isStoreError, StoreError } from "./store";
export type * from "./types";

// Store lokal (keputusan 22 Okt): in-memory + disimpan ke .data/store.json (di-gitignore) supaya
// bertahan saat server restart. Nanti diganti Supabase lewat interface yang sama (DataStore).
// Disimpan di globalThis supaya halaman, server action & SSE memakai instance yang sama saat dev.
// Kunci naik (F1 → F2 → F3 → F4 → F5 → F34 → N1) tiap method store bertambah: server dev yang sedang jalan memuat ulang dari file.
const DIR = join(process.cwd(), ".data");
const FILE = join(DIR, "store.json");

const g = globalThis as typeof globalThis & { __hmdStoreN1?: DataStore };

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

// Supabase (deploy Vercel) aktif kalau env-nya diisi; tanpa itu tetap file lokal.
export const isRemoteStore = () => supabaseEnv() !== null;

// Baca data. Remote: salinan segar dari Supabase tiap panggilan (read-only — mengubah data wajib
// lewat mutateStore, kalau tidak perubahannya hilang; commit di salinan ini melempar error).
export async function getStore(): Promise<DataStore> {
  await connection(); // data selalu dinamis (cacheComponents)
  if (isRemoteStore()) {
    return createStore(await loadRemote(seedData), {
      persist: () => {
        throw new Error("[store] ubah data lewat mutateStore()");
      },
    });
  }
  return (g.__hmdStoreN1 ??= createStore(load(), { persist }));
}

const MAX_TRIES = 5;

// Ubah data. Lokal: langsung di store global. Remote: muat → jalankan `fn` → simpan kalau ada
// commit, dengan cek `rev` (compare-and-swap). Kalah balapan (HP lain menyimpan duluan) → ulangi
// `fn` di data terbaru, jadi `fn` hanya boleh mengubah store (aman diulang).
export async function mutateStore<T>(fn: (store: DataStore) => T): Promise<T> {
  await connection();
  if (!isRemoteStore()) return fn(await getStore());
  for (let i = 0; i < MAX_TRIES; i++) {
    const data = await loadRemote(seedData);
    const baseRev = data.rev;
    const store = createStore(data);
    const result = fn(store);
    if (store.rev === baseRev || (await saveRemote(baseRev, store.snapshot()))) return result;
  }
  throw new Error("[store] gagal menyimpan: terlalu banyak perubahan bersamaan, coba lagi.");
}

// `rev` saja (polling LiveRefresh) — remote cuma membaca satu kolom.
export async function getRev(): Promise<number> {
  await connection();
  return isRemoteStore() ? loadRemoteRev() : (await getStore()).rev;
}

// Dev saja: kembali ke seed (tanpa tamu). Dipanggil dari /dev/states/f1.
export async function resetStore(): Promise<void> {
  await mutateStore((store) => store.reset(seedData()));
}
