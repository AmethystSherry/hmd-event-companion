import type { GuestRow } from "../csv";
import type {
  CheckInMethod,
  CheckInResult,
  EventState,
  Guest,
  InviteStatus,
  ProfileCard,
  Session,
  Ticket,
} from "./types";

export type RsvpInput = {
  rsvp: "hadir" | "tidak";
  name: string;
  ig: string;
  wa: string | null;
  followConfirmed: boolean;
};

export type Aggregates = {
  invited: number;
  confirmed: number;
  checkedIn: number;
  photos: number;
  questions: number;
  feedbackCount: number;
  ratingAvg: number | null;
  favoriteParts: Record<string, number>;
};

// Satu pintu ke data. Sekarang selalu mock (in-memory di server);
// adapter database asli dipasang di akhir proyek tanpa mengubah pemanggil.
export interface DataStore {
  readonly kind: "mock";
  ping(): Promise<{ ok: boolean; latencyMs: number }>;

  // Acara
  getEventState(): Promise<EventState>;
  listSessions(): Promise<Session[]>;

  // Tamu (F1)
  listGuests(): Promise<Guest[]>;
  getGuest(id: string): Promise<Guest | null>;
  getGuestByToken(token: string): Promise<Guest | null>;
  linkToken(guestId: string): string;
  importGuests(rows: GuestRow[]): Promise<{ added: number; updated: number }>;
  setRsvp(guestId: string, input: RsvpInput): Promise<Guest>;
  markSent(guestId: string, kind: "invite" | "reminder", status: InviteStatus): Promise<Guest>;
  addWalkIn(input: { name: string; ig: string }): Promise<Guest>;

  // Tiket & check-in (F2)
  getTicketForGuest(guestId: string): Promise<Ticket | null>;
  checkIn(
    target: { ticketId: string } | { guestId: string },
    by: string,
    method: CheckInMethod,
  ): Promise<CheckInResult>;

  // Penghitung pintu: "9/20 masuk" (total = semua tamu terundang).
  checkInCount(): Promise<{ checkedIn: number; total: number }>;

  // Kartu tetangga (N3)
  getProfile(guestId: string): Promise<ProfileCard | null>;
  saveProfile(card: ProfileCard): Promise<ProfileCard>;

  // Privasi (prd.md §8)
  purgePersonalData(now: Date): Promise<{ purged: boolean }>;
  aggregates(): Promise<Aggregates>;

  // Dev/test
  seed(): Promise<void>;
  reset(): Promise<void>;
}
