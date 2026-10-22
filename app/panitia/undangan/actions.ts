"use server";

import { revalidatePath } from "next/cache";
import { importGuests, importSummary, type RowError } from "@/lib/csv";
import { getStore } from "@/lib/data";
import { isCrew } from "@/lib/server/access";

export type ImportView = {
  fileName: string;
  summary: string;
  total: number;
  okCount: number;
  errors: RowError[];
};

const MAX_BYTES = 200_000; // ±ribuan baris; cukup untuk 20–50 tamu

// P04 / P04c: import CSV. Baris valid langsung masuk (upsert by IG); baris error dilaporkan.
export async function importCsvAction(form: FormData): Promise<ImportView | { error: string }> {
  if (!(await isCrew())) return { error: "Sesi panitia habis. Masuk lagi ya." };
  const file = form.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih file CSV dulu." };
  if (file.size > MAX_BYTES) return { error: "File-nya kebesaran. Maksimal 200 KB." };

  const text = await file.text();
  const result = importGuests(text);
  if (result.rows.length) {
    const store = await getStore();
    await store.importGuests(result.rows);
  }
  revalidatePath("/panitia", "layout");
  return {
    fileName: file.name,
    summary: importSummary(result),
    total: result.total,
    okCount: result.rows.length,
    errors: result.errors,
  };
}

// Tandai terkirim (manual, prd.md F1) saat panitia menekan Kirim WA / Salin link.
export async function markSentAction(
  guestIds: string[],
  kind: "invite" | "reminder",
): Promise<{ ok: boolean }> {
  if (!(await isCrew())) return { ok: false };
  const store = await getStore();
  for (const id of guestIds) await store.markSent(id, kind, "terkirim");
  revalidatePath("/panitia", "layout");
  return { ok: true };
}
