// Import daftar tamu (P04): kolom `nama, ig, wa(opsional)`.
// Dipakai seed dummy dan upload CSV panitia — satu aturan validasi untuk keduanya.

export type GuestRow = { line: number; name: string; ig: string; wa: string | null };
export type RowError = { line: number; message: string };
export type ImportResult = {
  rows: GuestRow[]; // hanya baris valid
  errors: RowError[];
  total: number; // baris data (tanpa header, tanpa baris kosong total)
  noWa: number;
};

// Parser CSV kecil: koma/titik koma, tanda kutip ganda, CRLF.
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const sep = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";
  const out: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === sep) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell);
      out.push(row);
      row = [];
      cell = "";
    } else cell += ch;
  }
  if (cell !== "" || row.length) {
    row.push(cell);
    out.push(row);
  }
  return out;
}

export function normalizeIg(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

// 08xx / +62xx / 62xx → 62xx. Null kalau kosong.
export function normalizeWa(raw: string): string | null {
  const digits = raw.replace(/[\s\-().]/g, "");
  if (!digits) return null;
  if (digits.startsWith("+62")) return "62" + digits.slice(3);
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return digits;
}

const IG_RE = /^[a-z0-9._]{1,30}$/;
const WA_RE = /^62\d{8,13}$/;

const HEADER_ALIASES: Record<string, "name" | "ig" | "wa"> = {
  nama: "name",
  name: "name",
  ig: "ig",
  instagram: "ig",
  wa: "wa",
  whatsapp: "wa",
  "no wa": "wa",
};

export function importGuests(text: string): ImportResult {
  const table = parseCsv(text);
  const header = (table[0] ?? []).map((h) => HEADER_ALIASES[h.trim().toLowerCase()]);
  const col = (k: "name" | "ig" | "wa") => header.indexOf(k);
  const errors: RowError[] = [];
  if (col("name") < 0 || col("ig") < 0) {
    return {
      rows: [],
      errors: [{ line: 1, message: "Header harus ada kolom nama dan ig" }],
      total: 0,
      noWa: 0,
    };
  }

  const rows: GuestRow[] = [];
  const seenIg = new Map<string, number>();
  let total = 0;
  let noWa = 0;
  table.slice(1).forEach((cells, i) => {
    const line = i + 2;
    if (cells.every((c) => c.trim() === "")) return; // baris kosong total dilewati
    total++;
    const name = (cells[col("name")] ?? "").trim().replace(/\s+/g, " ");
    const ig = normalizeIg(cells[col("ig")] ?? "");
    const waRaw = col("wa") >= 0 ? (cells[col("wa")] ?? "") : "";
    const wa = normalizeWa(waRaw);

    if (!name) return void errors.push({ line, message: "Nama kosong" });
    if (!ig) return void errors.push({ line, message: "IG kosong" });
    if (!IG_RE.test(ig)) return void errors.push({ line, message: `IG @${ig} nggak valid` });
    if (seenIg.has(ig)) {
      return void errors.push({ line, message: `IG @${ig} dobel (baris ${seenIg.get(ig)})` });
    }
    if (wa && !WA_RE.test(wa)) return void errors.push({ line, message: "Format WA salah" });

    seenIg.set(ig, line);
    if (!wa) noWa++;
    rows.push({ line, name, ig, wa });
  });
  return { rows, errors, total, noWa };
}

// "20 baris · 0 error · 3 tanpa nomor WA" (prd.md F1).
export function importSummary(r: ImportResult): string {
  return `${r.total} baris · ${r.errors.length} error · ${r.noWa} tanpa nomor WA`;
}
