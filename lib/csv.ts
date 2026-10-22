// CSV tamu (P04k → P04a/P04c). Kolom: nama* · ig* · pesan · wa (prd.md §7 F1).
// Excel versi Indonesia sering menyimpan pakai ";" — pemisah dideteksi dari baris judul.

export type CsvRow = {
  line: number; // nomor baris data (1 = tamu pertama, judul kolom tidak dihitung)
  name: string;
  ig: string; // sudah dinormalisasi; "" kalau kosong/salah
  igRaw: string;
  wa: string | null; // 62…; null kalau kosong
  waRaw: string;
  message: string | null;
};

export type CsvIssueKind = "nama" | "ig-kosong" | "ig-format" | "ig-dobel" | "wa-format";

export type CsvIssue = { line: number; kind: CsvIssueKind; title: string; detail: string };

export type CsvResult =
  | { ok: false; reason: "kosong" | "kolom"; message: string }
  | {
      ok: true;
      rows: CsvRow[]; // semua baris
      valid: CsvRow[]; // baris tanpa masalah — yang disimpan
      issues: CsvIssue[]; // P04c: satu masalah per baris (yang paling penting)
      columns: {
        nama: number;
        ig: number;
        pesan: number;
        waEmpty: number;
        hasPesan: boolean;
        hasWa: boolean;
      };
    };

const IG_RE = /^[a-z0-9._]{1,30}$/;
const WA_RE = /^628\d{7,11}$/;

// "@Rara.W", "instagram.com/rara.w/" → "rara.w". Tidak memvalidasi.
export function normalizeIg(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/[/?#].*$/, "")
    .replace(/^@+/, "")
    .toLowerCase();
}

export function isValidIg(ig: string): boolean {
  return IG_RE.test(ig);
}

// 0812-3456-7890 · +62 812… · 812… → 6281234567890. Kosong → null. Tidak memvalidasi.
export function normalizeWa(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("8")) return `62${digits}`;
  return digits;
}

export function isValidWa(wa: string): boolean {
  return WA_RE.test(wa);
}

// 6281234567890 → "0812 3456 7890" (seperti yang biasa diketik tamu).
export function formatWa(wa: string): string {
  const local = wa.startsWith("62") ? `0${wa.slice(2)}` : wa;
  return local.replace(/^(\d{4})(\d{4})(\d+)$/, "$1 $2 $3");
}

function splitLine(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === sep) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Pecah baris dengan menghormati tanda kutip (pesan boleh berisi koma / baris baru).
function splitRecords(text: string): string[] {
  const records: string[] = [];
  let cur = "";
  let quoted = false;
  for (const c of text) {
    if (c === '"') quoted = !quoted;
    if ((c === "\n" || c === "\r") && !quoted) {
      if (cur.trim()) records.push(cur);
      cur = "";
      continue;
    }
    cur += c;
  }
  if (cur.trim()) records.push(cur);
  return records;
}

export function parseGuestCsv(input: string): CsvResult {
  const text = input.replace(/^﻿/, "");
  const records = splitRecords(text);
  if (records.length < 2) {
    return {
      ok: false,
      reason: "kosong",
      message: "File-nya kosong atau cuma berisi judul kolom.",
    };
  }
  const head = records[0];
  const sep = (head.match(/;/g)?.length ?? 0) > (head.match(/,/g)?.length ?? 0) ? ";" : ",";
  const cols = splitLine(head, sep).map((c) => c.toLowerCase());
  const at = (name: string) => cols.indexOf(name);
  if (at("nama") < 0 || at("ig") < 0) {
    return {
      ok: false,
      reason: "kolom",
      message: "Kolom nama dan ig wajib ada di baris pertama.",
    };
  }

  const rows: CsvRow[] = records.slice(1).map((rec, i) => {
    const cells = splitLine(rec, sep);
    const cell = (name: string) => (at(name) >= 0 ? (cells[at(name)] ?? "") : "");
    const igRaw = cell("ig");
    const waRaw = cell("wa");
    return {
      line: i + 1,
      name: cell("nama").replace(/\s+/g, " ").slice(0, 60),
      igRaw,
      ig: normalizeIg(igRaw),
      waRaw,
      wa: normalizeWa(waRaw),
      message: cell("pesan") || null,
    };
  });

  const issues: CsvIssue[] = [];
  const firstIg = new Map<string, number>();
  for (const r of rows) {
    let issue: CsvIssue | null = null;
    if (!r.name)
      issue = { line: r.line, kind: "nama", title: "Kosong", detail: "Nama belum diisi" };
    else if (!r.ig)
      issue = { line: r.line, kind: "ig-kosong", title: "Cek IG", detail: "Username IG kosong" };
    else if (!isValidIg(r.ig))
      issue = {
        line: r.line,
        kind: "ig-format",
        title: "Cek IG",
        detail: `${r.igRaw} — format username nggak pas`,
      };
    else if (firstIg.has(r.ig))
      issue = {
        line: r.line,
        kind: "ig-dobel",
        title: "IG dobel",
        detail: `@${r.ig} dipakai di baris ${firstIg.get(r.ig)} & ${r.line}`,
      };
    else if (r.wa && !isValidWa(r.wa))
      issue = {
        line: r.line,
        kind: "wa-format",
        title: "Format WA salah",
        detail: `${r.waRaw} — ${r.wa.length < 11 ? "kurang digit" : "cek lagi nomornya"}`,
      };
    if (r.ig && isValidIg(r.ig) && !firstIg.has(r.ig)) firstIg.set(r.ig, r.line);
    if (issue) issues.push(issue);
  }
  const bad = new Set(issues.map((i) => i.line));
  return {
    ok: true,
    rows,
    valid: rows.filter((r) => !bad.has(r.line)),
    issues,
    columns: {
      nama: rows.filter((r) => r.name).length,
      ig: rows.filter((r) => r.ig).length,
      pesan: rows.filter((r) => r.message).length,
      waEmpty: rows.filter((r) => !r.wa).length,
      hasPesan: at("pesan") >= 0,
      hasWa: at("wa") >= 0,
    },
  };
}

// Ringkasan P04a / P04c: "20 baris · 0 error · semua punya IG" · "23 baris · 3 perlu dicek".
export function csvSummary(r: Extract<CsvResult, { ok: true }>): string {
  if (r.issues.length) return `${r.rows.length} baris · ${r.issues.length} perlu dicek`;
  return `${r.rows.length} baris · 0 error · semua punya IG`;
}

// Pesan paling umum dari kolom "pesan" jadi template DM event; kosong semua → null (pakai default).
export function commonMessage(rows: CsvRow[]): string | null {
  const count = new Map<string, number>();
  for (const r of rows) if (r.message) count.set(r.message, (count.get(r.message) ?? 0) + 1);
  let best: string | null = null;
  let n = 0;
  for (const [m, c] of count) if (c > n) [best, n] = [m, c];
  return best;
}

export const SAMPLE_CSV_HEADER = "nama,ig,pesan,wa";
