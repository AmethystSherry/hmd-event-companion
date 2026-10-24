import { getStore, mutateStore } from "@/lib/data";
import { purgeAt } from "@/lib/feedback";
import { guestFromToken } from "./access";
import { serverNow } from "./clock";
import { deletePhotoFiles } from "./photos";
import { summarizeFeedback } from "./summary";

// F5 di server: hapus data per orang H+30 (lazy) dan ringkasan Claude.

// Dipanggil saat halaman/API panitia & tamu dibuka. Lewat tanggal hapus (jam server, bisa
// digeser hmd_now di dev) → simpan rekap tanpa nama, hapus data per orang, lalu file foto.
// Cron Vercel menyusul di Phase 8. true = data event ini udah dihapus.
export async function ensurePurged(eventId: string): Promise<boolean> {
  const e = (await getStore()).getEvent(eventId);
  if (!e) return false;
  if (e.purgedAt) return true;
  const now = await serverNow();
  if (now < purgeAt(e.date)) return false;
  const ids = await mutateStore((s) => s.purgePersonalData(eventId, now.toISOString()));
  await Promise.all(ids.map((id) => deletePhotoFiles(eventId, id).catch(() => {})));
  return true;
}

// Buat (ulang) ringkasan kalau perlu. force = tombol "Coba lagi" (P11b). Panggilan Claude di luar
// mutateStore (fn bisa diulang saat kalah balapan); flag "sedang dibuat" mencegah dua HP memanggil
// bersamaan. true = ringkasan baru dicoba.
export async function refreshSummary(eventId: string, force = false): Promise<boolean> {
  const at = (await serverNow()).toISOString();
  const job = await mutateStore((s) => s.beginSummary(eventId, at, force));
  if (!job) return false;
  const result = await summarizeFeedback(job.items);
  const done = (await serverNow()).toISOString();
  await mutateStore((s) => s.saveSummary(eventId, job.basedOn, result, done));
  return true;
}

// Halaman tamu F5 (selesai/, buku-tamu/, kolase/): tamu valid, data belum dihapus, acara udah
// ditutup. null → halaman mengalihkan ke /t/{token} (yang memilih layar sesuai keadaan).
export async function closedGuest(token: string) {
  const guest = await guestFromToken(token);
  if (!guest || (await ensurePurged(guest.eventId))) return null;
  const store = await getStore();
  const event = store.getEvent(guest.eventId);
  if (!event || event.mode !== "closed") return null;
  const inside = store.ticketFor(guest.id)?.status === "dipakai";
  return { guest, event, store, inside };
}
