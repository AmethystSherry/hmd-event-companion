"use server";

import { revalidatePath } from "next/cache";
import { getStore } from "@/lib/data";
import { normalizeIg, normalizeWa } from "@/lib/csv";
import { guestFromToken } from "@/lib/server/access";

export type RsvpState =
  | { status: "idle" }
  | { status: "invalid"; fields: { ig?: string; wa?: string; follow?: string } }
  | { status: "error" } // T02d: gagal kirim, isian tetap
  | { status: "done"; rsvp: "hadir" | "tidak" };

const IG_RE = /^[a-z0-9._]{1,30}$/;
const WA_RE = /^62\d{8,13}$/;

// T02 → simpan konfirmasi. Validasi T02c: IG wajib, WA opsional tapi formatnya benar,
// follow @potarastudio wajib kalau hadir.
export async function submitRsvp(
  token: string,
  _prev: RsvpState,
  form: FormData,
): Promise<RsvpState> {
  const guest = await guestFromToken(token);
  if (!guest) return { status: "error" };

  const rsvp = form.get("rsvp") === "tidak" ? "tidak" : "hadir";
  const ig = normalizeIg(String(form.get("ig") ?? ""));
  const waRaw = String(form.get("wa") ?? "");
  const wa = normalizeWa(waRaw);
  const follow = form.get("follow") === "on" || form.get("follow") === "true";

  const fields: Extract<RsvpState, { status: "invalid" }>["fields"] = {};
  if (rsvp === "hadir") {
    if (!ig) fields.ig = "Instagram wajib diisi, biar teman gampang nyapa kamu.";
    else if (!IG_RE.test(ig)) fields.ig = "Username IG-nya kayaknya kurang pas";
    if (wa && !WA_RE.test(wa)) fields.wa = "Nomor WA-nya kurang pas";
    if (!follow) fields.follow = "Wajib — follow dulu ya, ini syarat hadir";
  }
  if (Object.keys(fields).length) return { status: "invalid", fields };

  try {
    const store = await getStore();
    await store.setRsvp(guest.id, {
      rsvp,
      name:
        String(form.get("name") ?? "")
          .trim()
          .slice(0, 60) || guest.name,
      ig: ig || guest.ig,
      wa: wa ?? guest.wa,
      followConfirmed: follow,
    });
  } catch (err) {
    if ((err as Error).message.includes("IG sudah dipakai")) {
      return { status: "invalid", fields: { ig: "IG ini udah dipakai tamu lain" } };
    }
    return { status: "error" };
  }
  revalidatePath(`/t/${token}`, "layout");
  return { status: "done", rsvp };
}

// T02b / T11: kartu tetangga (potensi skill & asbun, maks. 3).
export async function saveIntro(
  token: string,
  input: { skills: string[]; asbun: string[] },
): Promise<{ ok: boolean }> {
  const guest = await guestFromToken(token);
  if (!guest) return { ok: false };
  try {
    const store = await getStore();
    const current = await store.getProfile(guest.id);
    await store.saveProfile({
      guestId: guest.id,
      role: current?.role ?? "",
      skills: input.skills.slice(0, 3),
      asbun: input.asbun.slice(0, 3),
      showIg: current?.showIg ?? true,
      visible: current?.visible ?? true,
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
