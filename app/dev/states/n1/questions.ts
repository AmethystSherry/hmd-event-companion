import type { Guest, Question } from "@/lib/data/types";

// Pertanyaan dummy talkshow (Figma P10 "23 masuk · 2 udah dijawab"), dipakai pratinjau
// /dev/states/n1 dan alat uji "Isi 23 pertanyaan dummy".
export const DEMO_TEXTS = [
  "Kalau tiap hari pakai AI buat kerja, sebenernya seboros apa sih air yang kepake? Ada cara ngakalinnya dari rumah?",
  "Tools AI apa yang paling sering dipakai tim Potara?",
  "Mending pakai AI di HP atau laptop biar lebih hemat?",
  "AI bisa bantu ngatur pemakaian air di rumah nggak?",
  "Prompt yang pendek lebih hemat energi nggak sih?",
  "Gimana cara ngajarin orang tua pakai AI dengan aman?",
  "Ada rekomendasi AI buat bikin desain interior rumah?",
  "Kerja remote pakai AI bikin tagihan listrik naik nggak?",
  "Data kita aman nggak kalau pakai AI gratisan?",
  "Kapan sebaiknya nggak pakai AI sama sekali?",
  "AI lokal (offline) worth it buat pemula?",
  "Gimana Potara milih tools AI buat klien?",
  "Bedanya model besar dan kecil buat kerjaan sehari-hari apa?",
  "Pernah ngalamin AI salah fatal pas kerja? Gimana ngatasinnya?",
  "AI bakal ngegantiin desainer nggak?",
  "Tips bikin rumah lebih hemat energi pakai smart home?",
  "Berapa lama biasanya tim adaptasi sama tools baru?",
  "Ada komunitas AI di Jakarta yang direkomendasiin?",
  "Pakai AI buat nulis caption IG etis nggak sih?",
  "Gimana cara ngecek jawaban AI bener atau ngaco?",
  "Rumah baru ini desainnya dibantu AI juga?",
  "Alfin sendiri pakai AI buat apa aja sehari-hari?",
  "Ada rekomendasi tools AI yang ringan buat pemula?",
];

// 23 pertanyaan tiap menit mulai `start` (ISO), dari tamu yang ada bergiliran; 2 terlama udah
// dijawab. id/clientId tetap per urutan supaya pratinjau stabil.
export function demoQuestions(
  eventId: string,
  sessionId: string,
  guests: Pick<Guest, "id">[],
  start: string,
): Question[] {
  const base = Date.parse(start);
  const n = DEMO_TEXTS.length;
  return DEMO_TEXTS.map((text, i) => {
    // urutan teks = terbaru dulu (seperti Figma), jadi teks ke-0 dikirim paling akhir
    const createdAt = new Date(base + (n - 1 - i) * 60_000).toISOString();
    const hex = (i + 1).toString(16).padStart(12, "0");
    return {
      id: `demo-q-${i + 1}`,
      clientId: `00000000-0000-4000-9000-${hex}`,
      eventId,
      guestId: guests[i % guests.length]!.id,
      sessionId,
      text,
      createdAt,
      answeredAt: i >= n - 2 ? new Date(base + (n + 2 - (n - 1 - i)) * 60_000).toISOString() : null,
    };
  });
}
