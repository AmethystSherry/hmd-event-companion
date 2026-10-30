"use server";

import { mutateStore, StoreError } from "@/lib/data";
import { normalizeIg, normalizeWa } from "@/lib/csv";
import {
  INTERESTS_MAX,
  JOB_MAX,
  validateConfirm,
  type ConfirmInput,
  type ConfirmResult,
} from "@/lib/confirm";
import { guestFromToken } from "@/lib/server/access";
import { FAREWELL_MAX } from "@/lib/confirm";

// T02 → simpan jawaban. Hadir: validasi lengkap T02c (IG, follow; WA opsional). Nggak bisa: cukup nama.
// Jawaban langsung masuk ke P04 panitia (store memberi tahu SSE).
export async function submitConfirm(token: string, input: ConfirmInput): Promise<ConfirmResult> {
  const guest = await guestFromToken(token);
  if (!guest) throw new Error("Link tidak valid");

  const name = String(input.name ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60);
  if (input.rsvp === "hadir") {
    const fields = validateConfirm({ ...input, name });
    if (Object.keys(fields).length) return { ok: false, fields };
  } else if (!name) {
    return { ok: false, fields: { name: "Nama wajib diisi." } };
  }

  const ig = normalizeIg(String(input.ig ?? "")) || guest.ig;
  const wa = normalizeWa(String(input.wa ?? ""));
  try {
    await mutateStore((store) =>
      store.setRsvp(guest.id, {
        rsvp: input.rsvp === "hadir" ? "hadir" : "nggak",
        name,
        ig,
        // Hadir: kolom WA dikosongkan = tamu nggak mau di-WA (pengingat lewat DM IG).
        wa: input.rsvp === "hadir" ? wa : (wa ?? guest.wa),
        followConfirmed: !!input.follow,
        ...(input.rsvp === "hadir" && {
          job: optional(input.job, JOB_MAX),
          interests: optional(input.interests, INTERESTS_MAX),
        }),
      }),
    );
  } catch (err) {
    if (err instanceof StoreError && err.code === "ig-dipakai") {
      return { ok: false, fields: { ig: "IG ini udah dipakai tamu lain." } };
    }
    throw err;
  }
  return { ok: true };
}

const optional = (v: unknown, max: number) =>
  String(v ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, max) || null;

// T02b · titip ucapan (opsional). Cuma tamu yang jawab "Nggak bisa"; sekali kirim.
export async function sendFarewell(
  token: string,
  message: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const guest = await guestFromToken(token);
  if (!guest || guest.rsvp !== "nggak") return { ok: false, error: "Link tidak valid" };
  const text = String(message ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, FAREWELL_MAX);
  if (!text) return { ok: false, error: "Ucapannya masih kosong." };
  await mutateStore((store) => store.setFarewell(guest.id, text));
  return { ok: true };
}
