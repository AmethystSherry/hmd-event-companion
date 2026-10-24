import type { StoreData } from "./types";

// Penyimpanan Supabase (deploy Vercel): seluruh StoreData = satu baris JSON di tabel `hmd_store`.
// Tulis pakai compare-and-swap di kolom `rev` (PATCH … &rev=eq.<lama>): kalau HP lain menyimpan
// duluan, 0 baris berubah → pemanggil memuat ulang & mengulang operasinya. Lewat REST (PostgREST)
// dengan service key, hanya di server; RLS menutup tabel untuk anon. Skema: supabase/schema.sql.

const ROW = "main";

type Env = { url: string; key: string };

export function supabaseEnv(): Env | null {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
  return url && key ? { url: url.replace(/\/+$/, ""), key } : null;
}

function env(): Env {
  const e = supabaseEnv();
  if (!e) throw new Error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi.");
  return e;
}

async function rest(path: string, init: RequestInit & { prefer?: string } = {}): Promise<unknown> {
  const { url, key } = env();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
    },
  });
  if (!res.ok) throw new Error(`[supabase] ${init.method ?? "GET"} ${path}: ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Baca baris store; belum ada → isi dengan `seed()` (sekali, insert yang kalah balapan diabaikan).
export async function loadRemote(seed: () => StoreData): Promise<StoreData> {
  const rows = (await rest(`hmd_store?id=eq.${ROW}&select=data`)) as { data: StoreData }[];
  if (rows[0]) return rows[0].data;
  const data = seed();
  await rest("hmd_store?on_conflict=id", {
    method: "POST",
    prefer: "resolution=ignore-duplicates,return=minimal",
    body: JSON.stringify({ id: ROW, rev: data.rev, data }),
  });
  return loadRemote(seed);
}

export async function loadRemoteRev(): Promise<number> {
  const rows = (await rest(`hmd_store?id=eq.${ROW}&select=rev`)) as { rev: number }[];
  return rows[0]?.rev ?? 0;
}

// true = tersimpan; false = `rev` di server sudah bukan `baseRev` (ada yang menyimpan duluan).
export async function saveRemote(baseRev: number, data: StoreData): Promise<boolean> {
  const rows = (await rest(`hmd_store?id=eq.${ROW}&rev=eq.${baseRev}&select=rev`, {
    method: "PATCH",
    prefer: "return=representation",
    body: JSON.stringify({ rev: data.rev, data, updated_at: new Date().toISOString() }),
  })) as unknown[];
  return rows.length > 0;
}

// Rate-limit PIN (tabel `hmd_pin`, satu baris per kunci klien).
export type PinEntry = { fails: number; lockedUntil: number };

export async function loadPinEntry(clientKey: string): Promise<PinEntry | null> {
  const rows = (await rest(
    `hmd_pin?client_key=eq.${encodeURIComponent(clientKey)}&select=fails,locked_until`,
  )) as { fails: number; locked_until: number }[];
  return rows[0] ? { fails: rows[0].fails, lockedUntil: Number(rows[0].locked_until) } : null;
}

export async function savePinEntry(clientKey: string, entry: PinEntry | null): Promise<void> {
  if (!entry) {
    await rest(`hmd_pin?client_key=eq.${encodeURIComponent(clientKey)}`, { method: "DELETE" });
    return;
  }
  await rest("hmd_pin?on_conflict=client_key", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=minimal",
    body: JSON.stringify({
      client_key: clientKey,
      fails: entry.fails,
      locked_until: entry.lockedUntil,
    }),
  });
}
