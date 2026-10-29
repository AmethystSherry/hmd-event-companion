import type { FeedbackInput, FeedbackRecap, FeedbackSummary } from "./data/types";
import { isPhotoId } from "./photo";

// F5 · buku tamu & rekap: aturan tanpa secret (dipakai server, tes, dan nanti HP tamu).

export const MAX_IMPROVE = 280; // huruf, "Satu hal yang bisa kami perbaiki"
export const MAX_WISH = 140; // huruf, "Pesan buat rumah baru" (29 Okt)
export const SUMMARY_MIN = 3; // ringkasan Claude baru dibuat kalau sudah ada ≥ 3 jawaban
export const SUMMARY_REFRESH = 3; // dibuat ulang otomatis tiap ≥ 3 jawaban baru
export const SUMMARY_PENDING_MS = 30_000; // flag "sedang dibuat" kedaluwarsa (Claude timeout 15 dtk)

// Hapus otomatis H+30 (prd §8): 30 hari setelah tanggal event, 00.00 WIB (HMD: 8 Des 2026).
export function purgeAt(eventDate: string): Date {
  const [y, m, d] = eventDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + 30) - 7 * 3_600_000);
}

// Respons POST /api/t/[token]/buku-tamu.
export type FeedbackPostResponse =
  { ok: true; status: "ok" | "sudah-isi" } | { ok: false; error: string };

// Body JSON dari HP → FeedbackInput (bentuk saja; aturan isi dicek store). null = rusak.
export function parseFeedbackBody(body: unknown): FeedbackInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const { clientId, rating, highlightSessionId, improve, inviteAgain, wish } = b;
  if (typeof clientId !== "string" || !isPhotoId(clientId)) return null;
  if (typeof rating !== "number") return null;
  if (highlightSessionId != null && typeof highlightSessionId !== "string") return null;
  if (improve != null && typeof improve !== "string") return null;
  if (inviteAgain != null && typeof inviteAgain !== "boolean") return null;
  if (wish != null && typeof wish !== "string") return null;
  return {
    id: clientId,
    rating,
    highlightSessionId: highlightSessionId ?? null,
    improve: improve ?? null,
    inviteAgain: inviteAgain ?? null,
    wish: wish ?? null,
  };
}

// Ringkasan perlu dibuat? Minimal 3 jawaban, nggak lagi dibuat HP lain, dan (belum pernah / ada
// ≥ 3 jawaban baru / panitia tap "Coba lagi").
export function summaryDue(
  state: FeedbackSummary | null | undefined,
  respondents: number,
  nowMs: number,
  force = false,
): boolean {
  if (respondents < SUMMARY_MIN) return false;
  if (state?.pendingSince && nowMs - Date.parse(state.pendingSince) < SUMMARY_PENDING_MS) {
    return false;
  }
  if (!state || force) return true;
  return respondents - state.basedOn >= SUMMARY_REFRESH;
}

// Kartu ringkasan P11: siap · lagi dibuat (request = HP ini yang minta) · gagal (P11b) ·
// nunggu 3 jawaban · nggak ada (data udah dihapus tanpa ringkasan).
export type SummaryView =
  | { kind: "ready"; points: string[]; request?: boolean }
  | { kind: "pending"; request: boolean }
  | { kind: "failed" }
  | { kind: "waiting" }
  | { kind: "none" };

export function summaryView(
  state: FeedbackSummary | null | undefined,
  recap: Pick<FeedbackRecap, "respondents" | "purgedAt" | "summary">,
  nowMs: number,
): SummaryView {
  if (recap.purgedAt)
    return recap.summary ? { kind: "ready", points: recap.summary } : { kind: "none" };
  if (recap.respondents < SUMMARY_MIN) return { kind: "waiting" };
  const request = summaryDue(state, recap.respondents, nowMs);
  if (state?.points && !request) return { kind: "ready", points: state.points, request };
  if (state?.error && !request && !state.pendingSince) return { kind: "failed" };
  // Basi tapi masih ada poin lama: tampilkan poin lama sambil dibuat ulang.
  if (state?.points) return { kind: "ready", points: state.points, request };
  return { kind: "pending", request };
}
