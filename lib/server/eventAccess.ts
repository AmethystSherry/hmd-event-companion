import { guestFromToken, isCrew } from "./access";

// State acara & rundown boleh dibaca panitia (cookie) atau tamu yang sudah konfirmasi (?t=token).
// Isinya hanya jadwal & mode, tanpa data pribadi tamu.
export async function canReadEvent(req: Request): Promise<boolean> {
  if (await isCrew()) return true;
  const token = new URL(req.url).searchParams.get("t");
  if (!token) return false;
  const guest = await guestFromToken(token);
  return guest?.rsvp === "hadir";
}
