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
};

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
};

export type Session = {
  id: string;
  eventId: string;
  title: string;
  tagline: string | null; // baris kecil di undangan T01 (opsional)
  startsAt: string; // "HH.MM"
  durationMin: number;
  type: SessionType;
  pic: string;
};

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
};

export type GuestStats = {
  total: number;
  invited: number;
  notInvited: number;
  hadir: number;
  nggak: number;
  belumJawab: number; // diundang tapi belum jawab
  answered: number;
};
