import { getStore } from "../data";
import type { CheckInMethod } from "../data/types";
import { keyLabel } from "../event";
import { timeWib } from "../format";
import { secrets } from "./config";
import { verifyTicket } from "./crypto";

// Hasil check-in untuk sheet P06 / P06b / P06c (tanpa data selain yang tampil di layar).
export type CheckInView =
  | {
      kind: "valid" | "used";
      name: string;
      ig: string;
      keyNo: string; // "#014"
      guestNo: number | null; // "Tamu ke-9"
      time: string | null; // "13.04"
      method: CheckInMethod | null;
      count: { checkedIn: number; total: number };
    }
  | { kind: "unknown"; count: { checkedIn: number; total: number } };

// QR berisi `ticketId.sig`. Tanda tangan salah / acak / acara lain → "unknown".
export async function checkInByQr(payload: string, by: string): Promise<CheckInView> {
  const ticketId = verifyTicket(secrets().ticketSecret, payload.slice(0, 200));
  return run(ticketId ? { ticketId } : null, by, "scan");
}

// P07: check-in manual dari daftar nama (tamu lupa tiket / HP mati).
export async function checkInByGuest(guestId: string, by: string): Promise<CheckInView> {
  return run({ guestId }, by, "manual");
}

async function run(
  target: { ticketId: string } | { guestId: string } | null,
  by: string,
  method: CheckInMethod,
): Promise<CheckInView> {
  const store = await getStore();
  const res = target ? await store.checkIn(target, by, method) : { kind: "unknown" as const };
  const count = await store.checkInCount();
  if (res.kind === "unknown") return { kind: "unknown", count };
  return {
    kind: res.kind,
    name: res.guest.name,
    ig: res.guest.ig,
    keyNo: keyLabel(res.guest.keyNo),
    guestNo: res.ticket.guestNo,
    time: res.ticket.checkedInAt ? timeWib(res.ticket.checkedInAt) : null,
    method: res.ticket.method,
    count,
  };
}
