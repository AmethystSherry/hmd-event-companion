import type { DoorManifest, DoorOp } from "../door";

// IndexedDB kecil (tanpa library) untuk HP panitia di pintu:
// - "manifest": daftar tamu terakhir per event (scan & Cari nama tetap jalan offline)
// - "outbox": check-in yang belum sampai server, dikirim berurutan (seq)
// Kalau IndexedDB nggak tersedia (mode privat lama), jatuh ke memori — tetap jalan selama tab terbuka.

type OutboxRow = { opId: string; eventId: string; seq: number; op: DoorOp };

const DB = "hmd-door";
const memory = { manifest: new Map<string, DoorManifest>(), outbox: new Map<string, OutboxRow>() };
let dbPromise: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("manifest", { keyPath: "eventId" });
      req.result.createObjectStore("outbox", { keyPath: "opId" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

function run<T>(
  store: "manifest" | "outbox",
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        if (!db) return resolve(undefined);
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(req ? req.result : undefined);
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export async function loadManifest(eventId: string): Promise<DoorManifest | null> {
  const db = await open();
  if (!db) return memory.manifest.get(eventId) ?? null;
  return (await run<DoorManifest>("manifest", "readonly", (s) => s.get(eventId))) ?? null;
}

export async function saveManifest(m: DoorManifest): Promise<void> {
  memory.manifest.set(m.eventId, m);
  await run("manifest", "readwrite", (s) => s.put(m));
}

export async function listOps(eventId: string): Promise<DoorOp[]> {
  const db = await open();
  const rows = db
    ? ((await run<OutboxRow[]>("outbox", "readonly", (s) => s.getAll())) ?? [])
    : [...memory.outbox.values()];
  return rows
    .filter((r) => r.eventId === eventId)
    .sort((a, b) => a.seq - b.seq)
    .map((r) => r.op);
}

let seq = 0;
export async function addOp(eventId: string, op: DoorOp): Promise<void> {
  const row: OutboxRow = { opId: op.opId, eventId, seq: Date.now() * 1000 + (seq++ % 1000), op };
  memory.outbox.set(op.opId, row);
  await run("outbox", "readwrite", (s) => s.put(row));
}

export async function removeOps(opIds: string[]): Promise<void> {
  for (const id of opIds) memory.outbox.delete(id);
  await run("outbox", "readwrite", (s) => {
    for (const id of opIds) s.delete(id);
  });
}

// Sesi panitia habis (401) → hapus daftar tamu dari HP ini. Antrean ikut dibuang.
export async function clearDoorData(): Promise<void> {
  memory.manifest.clear();
  memory.outbox.clear();
  await run("manifest", "readwrite", (s) => s.clear());
  await run("outbox", "readwrite", (s) => s.clear());
}
