// Model data F1 (prd.md §8). Satu store menyimpan banyak event (PE01), tapi yang dibangun & diuji
// hanya House Moving Day; event lain cukup data dummy (G14).

export type InviteStatus = "belum" | "diundang";
export type Rsvp = "belum" | "hadir" | "nggak";
export type SessionType = "info" | "talkshow";

export type Event = {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD (WIB)
  startsAt: string; // "13.00" pintu dibuka
  endsAt: string; // "17.00"
  location: string;
  csvImportedAt: string | null; // terisi → unggah CSV dikunci (P04a)
  csvFileName: string | null;
  dmTemplate: string; // template DM undangan (kolom "pesan" CSV, kosong → default)
  createdAt: string;
  // State acara hari-H (prd.md §6). Opsional: .data/store.json lama tetap terbaca (kosong = "pre").
  mode?: EventMode;
  activeSessionId?: string | null;
  nextSessionId?: string | null;
  stateUpdatedAt?: string | null;
  // F3 · BP02d: label HP panitia ("HP 7K2Q") & aksi yang terakhir mengubah state acara.
  stateBy?: string | null;
  stateAction?: StateAction | null;
  // F5: tutup acara (sekali jalan), ringkasan Claude, rekap tanpa nama setelah hapus H+30.
  closedAt?: string | null;
  summary?: FeedbackSummary | null;
  purgedAt?: string | null;
  recapArchive?: FeedbackRecap | null;
};

export type EventMode = "pre" | "jeda" | "sesi" | "closed";
export type SessionStatus = "nanti" | "berlangsung" | "selesai";
// Aksi terakhir di Kontrol acara (BP02d): sesi yang dimulai / diselesaikan, atau acara ditutup.
export type StateAction = { kind: "mulai" | "selesai" | "tutup"; sessionId: string | null };

export type Guest = {
  id: string;
  eventId: string;
  token: string; // link unik /t/{token}, ≥ 16 karakter acak
  name: string;
  ig: string; // tanpa "@", huruf kecil
  wa: string | null; // format 62…; wajib diisi tamu saat konfirmasi hadir
  dmTemplate: string | null; // pesan khusus dari kolom "pesan"
  inviteStatus: InviteStatus;
  invitedAt: string | null;
  rsvp: Rsvp;
  respondedAt: string | null;
  followConfirmed: boolean;
  keyNo: number; // nomor kunci di tiket (#014)
  reminderSentAt: string | null;
  source: "csv" | "manual" | "walkin"; // walkin = ditambah di pintu (P07c)
  createdAt: string;
  card?: GuestCard | null; // N3 · kartu BT05: dari T11 / T02 (baca lewat cardOf, lib/card)
  // T02 · Pekerjaan & Minat (opsional), disinkronkan dengan `card` (N3) buat prefill T02.
  job?: string | null; // ≤ 40
  interests?: string | null; // ≤ 60
  // T02b · titip ucapan (opsional, tamu yang nggak bisa datang). Belum ditampilkan di mana pun.
  farewellMessage?: string | null; // ≤ 140 huruf
  farewellAt?: string | null;
  // F5 v2 · P12 makasih via WA (manual, sekali per tamu; dihapus H+30).
  thanksSentAt?: string | null;
};

// Kartu "Tamu di sini" (BT05): peran + "Tanya soal …" (≤ 3 topik, juga jadi chip Kartu kamu).
export type GuestCard = { role: string | null; askAbout: string[] };

export type Session = {
  id: string;
  eventId: string;
  title: string;
  tagline: string | null; // baris kecil di undangan T01 (opsional)
  startsAt: string; // "HH.MM"
  durationMin: number;
  type: SessionType;
  pic: string;
  status?: SessionStatus; // kosong = "nanti"; "berikutnya" diturunkan dari Event.nextSessionId
  startedAt?: string | null;
  endedAt?: string | null;
  // F4 · info layar acara tamu (opsional; diisi seed, form PE04 belum bisa mengubah).
  room?: string | null; // "Ruang 01"
  roomNote?: string | null; // "lantai 1"
  description?: string | null; // BT22
  speaker?: Speaker | null; // Talkshow: kartu pembicara + BT21p
  topic?: string | null; // Talkshow: baris di bawah judul
  art?: SessionArt | null; // ilustrasi Pota (public/figma/f3-*.webp)
  // F5 v2 · label pendek (chip T14/T15/P13, caption T15, bar P11). Kosong = `title`; baca lewat
  // `sessionShort`. Dikosongkan otomatis kalau panitia mengganti judul sesi.
  shortTitle?: string | null;
};

export type Speaker = { name: string; ig: string; label: string }; // label = "Guest star"
export type SessionArt = "open-space" | "talkshow" | "office-tour" | "closing";

export type Ticket = {
  ticketId: string;
  guestId: string;
  shortCode: string; // HMD-014-7F3K
  status: "aktif" | "dipakai";
  // F2 check-in (opsional supaya .data/store.json lama tetap terbaca).
  checkedInAt?: string | null;
  checkedInBy?: string | null; // label HP panitia ("HP 7K2Q"), satu PIN = tanpa identitas orang
  method?: CheckInMethod | null;
  guestNo?: number | null; // "tamu ke-9"
  opId?: string | null; // id operasi check-in dari HP panitia → kirim ulang tidak dobel
  rsvpBefore?: Rsvp | null; // RSVP sebelum check-in (dipulihkan saat Batalkan)
};

export type CheckInMethod = "scan" | "manual";

// Hasil check-in (P06 / P06b / P06c). Sama untuk respons server & validasi lokal di HP panitia.
export type CheckInResult =
  | { kind: "valid"; guestId: string; guestNo: number; at: string }
  | { kind: "sudah-dipakai"; guestId: string; at: string; method: CheckInMethod }
  | { kind: "tidak-dikenal" }
  | { kind: "gagal"; error: string };

// Angka pintu: pembagi "dari N" = tamu RSVP hadir (walk-in & yang datang walau "Nggak bisa"
// ikut jadi hadir saat check-in).
export type DoorStats = { checkedIn: number; expected: number; total: number };

export type StoreData = {
  version: 1;
  rev: number; // naik tiap ada perubahan → dipakai SSE untuk memicu refresh
  events: Event[];
  guests: Guest[];
  sessions: Session[];
  tickets: Ticket[];
  photos?: Photo[]; // N4 (opsional: store lama tetap terbaca)
  feedback?: Feedback[]; // F5
  questions?: Question[]; // N1
};

// N1 · pertanyaan talkshow (BT08 → P10). clientId = UUID dari HP → kirim ulang (sinyal putus) =
// pertanyaan yang sama. Nempel ke sesi talkshow yang lagi jalan saat dikirim.
export type Question = {
  id: string;
  clientId: string;
  eventId: string;
  guestId: string;
  sessionId: string;
  text: string; // di-trim, 1–280 huruf
  createdAt: string;
  answeredAt?: string | null; // ditandai moderator (P10), bisa dibatalkan
};

// N4 · foto kolase polaroid. File gambarnya di Supabase Storage / .data/photos (bukan di store);
// URL diturunkan dari id. id = clientId dari HP → kirim ulang = foto yang sama, nggak dobel.
export type Photo = {
  id: string;
  eventId: string;
  guestId: string;
  sessionId: string | null; // sesi yang lagi/terakhir jalan saat difoto (filter T15)
  createdAt: string;
  width: number;
  height: number;
  bytes: number;
  deletedAt?: string | null; // dihapus pemiliknya (T15b) / panitia (P13), file ikut dihapus
  deletedBy?: string | null; // P13: label HP panitia ("HP 7K2Q"); kosong = dihapus pemiliknya
};

// Ringkasan kolase untuk BT07: total foto aktif, foto tamu lain, dan id terbaru untuk strip.
export type PhotoSummary = { total: number; others: number; latest: string[]; mine: number };

export type GuestStats = {
  total: number;
  invited: number;
  notInvited: number;
  hadir: number;
  nggak: number;
  belumJawab: number; // diundang tapi belum jawab
  answered: number;
};

// F5 · buku tamu (T14). Satu isian per tamu, nggak bisa diubah. id = clientId (UUID dari HP) →
// kirim ulang (sinyal putus) = isian yang sama.
export type Feedback = {
  id: string;
  eventId: string;
  guestId: string;
  rating: number; // 1–5, wajib
  highlightSessionId: string | null; // "Bagian paling seru"
  improve: string | null; // "Satu hal yang bisa kami perbaiki", ≤ 280 huruf
  inviteAgain: boolean | null; // "Mau diundang lagi?" — belum dipilih = null
  createdAt: string;
};

export type FeedbackInput = Pick<
  Feedback,
  "id" | "rating" | "highlightSessionId" | "improve" | "inviteAgain"
>;

// Rekap P11. Pembagi = tamu yang udah check-in (yang bisa isi buku tamu). Tanpa nama: jawaban
// "perbaiki" diberi nomor urut jawaban ("Tamu #04"), bukan nomor kunci.
export type FeedbackRecap = {
  respondents: number;
  expected: number;
  avgRating: number | null; // 1 desimal
  inviteAgainPct: number | null; // dari yang menjawab
  highlights: { sessionId: string; title: string; count: number }[]; // urut terbanyak
  improvements: { no: number; text: string; at: string }[];
  summary: string[] | null; // 3 poin Claude (cache)
  purgedAt: string | null; // P11d: data per orang udah dihapus, rekap dari arsip
};

// Ringkasan Claude (cache di event). basedOn = jumlah jawaban saat dibuat (juga saat gagal), jadi
// dibuat ulang otomatis kalau ada ≥ 3 jawaban baru. pendingSince = sedang dibuat (cegah dobel).
export type FeedbackSummary = {
  points: string[] | null;
  basedOn: number;
  createdAt: string | null;
  error: string | null;
  errorAt: string | null;
  pendingSince: string | null;
};

// Yang dikirim ke Claude: tanpa nama, IG, atau id tamu.
export type FeedbackForSummary = {
  rating: number;
  highlight: string | null;
  improve: string | null;
  inviteAgain: boolean | null;
};
