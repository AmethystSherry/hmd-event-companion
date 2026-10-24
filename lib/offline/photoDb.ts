// IndexedDB kecil (tanpa library) untuk antrean foto kolase di HP tamu (N4 BT07b): foto yang
// belum sampai server disimpan sebagai Blob, dikirim ulang tiap 5 dtk / saat `online`.
// Pola sama dengan doorDb (F2), DB terpisah supaya pintu panitia nggak ikut tersentuh.
// IndexedDB nggak tersedia → jatuh ke memori (tetap jalan selama tab terbuka).

export type QueuedPhoto = {
  id: string; // clientId (UUID) → idempoten di server
  token: string;
  photo: Blob;
  thumb: Blob;
  width: number;
  height: number;
  createdAt: number;
};

const DB = "hmd-photos";
const STORE = "outbox";
const memory = new Map<string, QueuedPhoto>();
let dbPromise: Promise<IDBDatabase | null> | null = null;

function open(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") return resolve(null);
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  });
  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  return open().then(
    (db) =>
      new Promise((resolve, reject) => {
        if (!db) return resolve(undefined);
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req ? req.result : undefined);
        tx.onerror = () => reject(tx.error);
      }),
  );
}

export async function queuePhoto(row: QueuedPhoto): Promise<void> {
  memory.set(row.id, row);
  // Simpan Blob gagal (mis. kuota penuh) → tetap di memori; foto tetap dicoba dikirim.
  await run("readwrite", (s) => s.put(row)).catch(() => {});
}

export async function listQueued(token: string): Promise<QueuedPhoto[]> {
  const db = await open();
  const rows = db ? ((await run<QueuedPhoto[]>("readonly", (s) => s.getAll())) ?? []) : [];
  const all = new Map([...memory, ...rows.map((r) => [r.id, r] as const)]);
  return [...all.values()]
    .filter((r) => r.token === token)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeQueued(id: string): Promise<void> {
  memory.delete(id);
  await run("readwrite", (s) => s.delete(id)).catch(() => {});
}
