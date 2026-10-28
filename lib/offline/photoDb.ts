// IndexedDB kecil (tanpa library) untuk antrean foto kolase di HP tamu (N4 BT07b): foto yang
// belum sampai server disimpan, dikirim ulang tiap 5 dtk / saat `online`.
// Disimpan sebagai ArrayBuffer (28 Okt), bukan Blob: di iPhone (WebKit, semua browser) Blob yang
// dibaca balik dari IndexedDB sering gagal dikirim lewat fetch → antrean nyangkut selamanya.
// Saat dibaca, dibungkus jadi Blob baru di memori.
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

// Bentuk di IndexedDB: Blob diganti ArrayBuffer (baris lama bisa masih Blob).
type StoredPhoto = Omit<QueuedPhoto, "photo" | "thumb"> & {
  photo: ArrayBuffer | Blob;
  thumb: ArrayBuffer | Blob;
};

async function toBuffer(b: Blob): Promise<ArrayBuffer | Blob> {
  try {
    return await b.arrayBuffer();
  } catch {
    return b; // nggak kebaca (bug WebKit) → simpan apa adanya
  }
}

async function toBlob(v: ArrayBuffer | Blob): Promise<Blob> {
  if (v instanceof Blob) {
    // Baris lama: salin ke Blob memori kalau bisa dibaca.
    const buf = await toBuffer(v);
    return buf instanceof Blob ? buf : new Blob([buf], { type: "image/jpeg" });
  }
  return new Blob([v], { type: "image/jpeg" });
}

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
  const stored: StoredPhoto = {
    ...row,
    photo: await toBuffer(row.photo),
    thumb: await toBuffer(row.thumb),
  };
  await run("readwrite", (s) => s.put(stored)).catch(() => {});
}

export async function listQueued(token: string): Promise<QueuedPhoto[]> {
  const db = await open();
  const stored = db ? ((await run<StoredPhoto[]>("readonly", (s) => s.getAll())) ?? []) : [];
  const rows = await Promise.all(
    stored
      .filter((r) => !memory.has(r.id)) // di memori = Blob asli hasil jepret, pakai itu
      .map(async (r) => ({ ...r, photo: await toBlob(r.photo), thumb: await toBlob(r.thumb) })),
  );
  const all = new Map([...memory, ...rows.map((r) => [r.id, r] as const)]);
  return [...all.values()]
    .filter((r) => r.token === token)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export async function removeQueued(id: string): Promise<void> {
  memory.delete(id);
  await run("readwrite", (s) => s.delete(id)).catch(() => {});
}
