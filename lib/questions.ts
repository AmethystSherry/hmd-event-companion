import type { Guest, Question } from "./data/types";
import { firstName, timeWib } from "./format";
import { isPhotoId } from "./photo";
import type { SessionView } from "./rundown";

// N1 · pertanyaan talkshow: aturan tanpa secret (server, tes, HP tamu & panitia). Tanpa Claude —
// P10 = daftar mentah, terbaru di atas, nggak dikelompokkan (Figma N1).

export const MAX_QUESTION = 280; // huruf
export const QUESTION_COUNTER_FROM = 240; // counter "{n}/280" muncul mulai sini (T3)
// Dev (/dev/states/n1): API tanya menyimpan tapi menjawab 503 → uji BT08b + kirim ulang.
export const TANYA_FAIL_COOKIE = "hmd_tanya_fail";

// Respons POST /api/t/[token]/tanya.
export type QuestionPostResponse =
  | { ok: true; question: { id: string; text: string; createdAt: string } }
  | { ok: false; error: string };

// Body JSON dari HP → { clientId, text } (text di-trim, 1–280). null = rusak / kosong / kepanjangan.
export function parseQuestionBody(body: unknown): { clientId: string; text: string } | null {
  if (!body || typeof body !== "object") return null;
  const { clientId, text } = body as Record<string, unknown>;
  if (typeof clientId !== "string" || !isPhotoId(clientId)) return null;
  if (typeof text !== "string") return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > MAX_QUESTION) return null;
  return { clientId, text: trimmed };
}

// Sesi talkshow buat P10 / tile BP02: yang lagi jalan, atau (lagi jeda) talkshow terakhir yang
// udah dimulai, atau talkshow berikutnya. null = rundown tanpa talkshow.
export function talkshowFor(sessions: SessionView[]): SessionView | null {
  const talks = sessions.filter((s) => s.type === "talkshow");
  const live = talks.find((s) => s.state === "berlangsung");
  if (live) return live;
  const started = talks
    .filter((s) => s.startedAt)
    .sort((a, b) => b.startedAt!.localeCompare(a.startedAt!));
  return started[0] ?? talks.find((s) => s.state !== "selesai") ?? talks[0] ?? null;
}

export type QuestionRow = {
  id: string;
  text: string;
  name: string; // nama depan; dobel → "Rara S."
  time: string; // "14.21" WIB
  createdAt: string;
  answeredAt: string | null;
};

export type QuestionsView = {
  total: number;
  answeredCount: number;
  open: QuestionRow[]; // belum dijawab, terbaru dulu
  answered: QuestionRow[]; // terakhir dijawab di atas
};

// Nama tampil P10: nama depan; kalau nama depan dipakai > 1 tamu event ini, tambah huruf awal
// nama belakang (T10).
export function displayNames(guests: Pick<Guest, "id" | "name">[]): Map<string, string> {
  const count = new Map<string, number>();
  for (const g of guests) {
    const f = firstName(g.name).toLowerCase();
    count.set(f, (count.get(f) ?? 0) + 1);
  }
  return new Map(
    guests.map((g) => {
      const words = g.name.trim().split(/\s+/);
      const first = words[0] ?? g.name;
      const dup = (count.get(first.toLowerCase()) ?? 0) > 1 && words.length > 1;
      return [g.id, dup ? `${first} ${words[words.length - 1]![0]!.toUpperCase()}.` : first];
    }),
  );
}

export function questionsView(
  questions: Question[],
  guests: Pick<Guest, "id" | "name">[],
  sessionId: string | null,
): QuestionsView {
  const names = displayNames(guests);
  const rows = questions
    .filter((q) => q.sessionId === sessionId)
    .map<QuestionRow>((q) => ({
      id: q.id,
      text: q.text,
      name: names.get(q.guestId) ?? "Tamu",
      time: timeWib(q.createdAt),
      createdAt: q.createdAt,
      answeredAt: q.answeredAt ?? null,
    }));
  return split(rows);
}

// P10 optimistic: pindahkan satu baris antar-kartu tanpa nunggu server.
export function toggleAnswered(view: QuestionsView, id: string, at: string | null): QuestionsView {
  return split(
    [...view.open, ...view.answered].map((r) => (r.id === id ? { ...r, answeredAt: at } : r)),
  );
}

function split(rows: QuestionRow[]): QuestionsView {
  const open = rows
    .filter((r) => !r.answeredAt)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const answered = rows
    .filter((r) => r.answeredAt)
    .sort((a, b) => b.answeredAt!.localeCompare(a.answeredAt!));
  return { total: rows.length, answeredCount: answered.length, open, answered };
}

// Riwayat pertanyaan tamu sendiri (sheet Tanya): terbaru dulu, + status dijawab dari P10.
export type MyQuestion = { id: string; text: string; time: string; answered: boolean };

export function myQuestions(questions: Question[], guestId: string): MyQuestion[] {
  return questions
    .filter((q) => q.guestId === guestId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((q) => ({ id: q.id, text: q.text, time: timeWib(q.createdAt), answered: !!q.answeredAt }));
}
