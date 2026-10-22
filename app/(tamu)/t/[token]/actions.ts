"use server";

import { getStore, StoreError } from "@/lib/data";
import { normalizeIg, normalizeWa } from "@/lib/csv";
import { validateConfirm, type ConfirmInput, type ConfirmResult } from "@/lib/confirm";
import { guestFromToken } from "@/lib/server/access";

// T02 → simpan jawaban. Hadir: validasi lengkap T02c (IG, WA wajib, follow). Nggak bisa: cukup nama.
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
    (await getStore()).setRsvp(guest.id, {
      rsvp: input.rsvp === "hadir" ? "hadir" : "nggak",
      name,
      ig,
      wa: wa ?? guest.wa,
      followConfirmed: !!input.follow,
    });
  } catch (err) {
    if (err instanceof StoreError && err.code === "ig-dipakai") {
      return { ok: false, fields: { ig: "IG ini udah dipakai tamu lain." } };
    }
    throw err;
  }
  return { ok: true };
}
