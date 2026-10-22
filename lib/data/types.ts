// Model data (prd.md §6 & §8). Data pribadi minimal: nama, IG, WA opsional.

export type EventMode = "pre" | "jeda" | "sesi" | "closed";

export type SessionStatus = "nanti" | "berikutnya" | "berlangsung" | "selesai";

export interface EventState {
  mode: EventMode;
  activeSession: string | null;
  nextSession: string | null;
  updatedAt: string; // ISO
  rev: number; // naik tiap perubahan (deteksi konflik antar-HP panitia)
  by: string | null; // id HP panitia yang terakhir mengubah
}

// State acara + rundown yang dikirim ke semua HP (SSE / polling).
export interface EventSnapshot {
  event: EventState;
  sessions: Session[];
}

// Edit rundown oleh panitia (urutan, jam, tipe, PIC, …).
export type SessionEdit = Pick<Session, "id"> &
  Partial<
    Pick<
      Session,
      | "title"
      | "room"
      | "type"
      | "startsAt"
      | "durationMin"
      | "pic"
      | "speakers"
      | "teaser"
      | "order"
    >
  >;

export type Rsvp = "belum" | "hadir" | "tidak";
export type InviteStatus = "belum" | "terkirim";

export interface Guest {
  id: string; // "g014"
  keyNo: number; // 14 → "#014"
  name: string;
  ig: string; // tanpa "@", huruf kecil
  wa: string | null; // format 62…, opsional
  rsvp: Rsvp;
  rsvpAt: string | null;
  followConfirmed: boolean;
  inviteStatus: InviteStatus; // ditandai manual oleh panitia (P04)
  reminderStatus: InviteStatus; // pengingat H-1 (P04b)
  walkIn: boolean; // ditambah panitia di pintu (P07c)
  createdAt: string;
}

export type TicketStatus = "aktif" | "dipakai";
export type CheckInMethod = "scan" | "manual";

export interface Ticket {
  ticketId: string; // "tk_g014"
  guestId: string;
  shortCode: string; // "HMD-014-7F3K"
  status: TicketStatus;
  checkedInAt: string | null;
  checkedInBy: string | null; // id perangkat panitia
  method: CheckInMethod | null;
  guestNo: number | null; // urutan masuk ("tamu ke-9")
}

export interface ProfileCard {
  guestId: string;
  role: string; // peran, mis. "Product designer"
  skills: string[]; // maks. 3 (Potensi skill)
  asbun: string[]; // maks. 3 (Potensi asbun)
  showIg: boolean;
  visible: boolean; // kartu dipasang / dilepas
}

export type SessionType = "info" | "talkshow";

export interface Session {
  id: string; // "s01"
  order: number;
  title: string;
  tagline: string; // baris kecil di undangan T01, mis. "Keliling rumah baru"
  teaser: string; // deskripsi kartu "Selanjutnya" di Jeda (BT03/BT10)
  topic: string; // judul kartu sesi di layar Sesi (BT08/BT11)
  room: string;
  type: SessionType;
  startsAt: string; // "13.00" (WIB, hari acara)
  durationMin: number;
  description: string;
  speakers: string; // baris pembawa, mis. "Guest star (menyusul) · Moderator Tim Potara"
  hosts: string[]; // nama untuk inisial avatar, mis. ["Guest star", "Tim Potara"]
  pic: string;
  status: SessionStatus;
  startedAt: string | null;
  endedAt: string | null;
  points: string[]; // titik tur / daftar info (BT11)
}

export interface Question {
  id: string;
  guestId: string;
  sessionId: string;
  text: string;
  anonymous: boolean;
  clusterId: string | null;
  answered: boolean;
  createdAt: string;
}

export interface Photo {
  id: string;
  guestId: string;
  sessionId: string | null;
  url: string;
  width: number;
  height: number;
  createdAt: string;
  deleted: boolean;
}

export interface Feedback {
  guestId: string;
  rating: number; // 1–5
  favoritePart: string;
  improvement: string | null;
  inviteAgain: boolean;
  createdAt: string;
}

export interface Script {
  sessionId: string;
  text: string;
  generatedAt: string;
  reviewed: boolean;
}

// Hasil check-in (P06): Valid / Sudah dipakai / Tidak dikenal.
export type CheckInResult =
  | { kind: "valid"; guest: Guest; ticket: Ticket }
  | { kind: "used"; guest: Guest; ticket: Ticket }
  | { kind: "unknown" };
