// Import daftar tamu (P04): kolom `nama, ig, wa(opsional)`.
// Dipakai seed dummy dan upload CSV panitia — satu aturan validasi untuk keduanya.

export type GuestRow = { line: number; name: string; ig: string; wa: string | null };
// kind + detail mengikuti kartu "Ringkasan error CSV" di P04c, mis. "IG dobel" / "@x dipakai di baris 4 & 12".
export type RowError = { line: number; kind: string; detail: string; message: string };

const err = (line: number, kind: string, detail: string): RowError => ({
  line,
  kind,
  detail,
  message: `${kind}: ${detail}`,
});
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
      errors: [err(1, "Header salah", "Header harus ada kolom nama dan ig")],
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

    if (!name) return void errors.push(err(line, "Kosong", "Nama belum diisi"));
    if (!ig) return void errors.push(err(line, "Kosong", "IG belum diisi"));
    if (!IG_RE.test(ig)) return void errors.push(err(line, "IG nggak valid", `@${ig}`));
    if (seenIg.has(ig)) {
      return void errors.push(
        err(line, "IG dobel", `@${ig} dipakai di baris ${seenIg.get(ig)} & ${line}`),
      );
    }
    if (wa && !WA_RE.test(wa)) {
      const reason = /\D/.test(wa)
        ? "ada huruf"
        : wa.length < 10
          ? "kurang digit"
          : "kebanyakan digit";
      return void errors.push(err(line, "Format WA salah", `${waRaw.trim()} — ${reason}`));
    }

    seenIg.set(ig, line);
    if (!wa) noWa++;
    rows.push({ line, name, ig, wa });
  });
  return { rows, errors, total, noWa };
}

// P04: "20 baris · 0 error · 3 tanpa WA". P04c (ada error): "23 baris · 3 perlu dicek".
export function importSummary(r: ImportResult): string {
  if (r.errors.length) return `${r.total} baris · ${r.errors.length} perlu dicek`;
  return `${r.total} baris · 0 error · ${r.noWa} tanpa WA`;
}
