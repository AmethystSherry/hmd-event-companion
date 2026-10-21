import { importGuests as parseGuests, normalizeIg, type GuestRow } from "../csv";
import { DEFAULT_RUNDOWN, EVENT } from "../event";
import type { Aggregates, DataStore } from "./store";
import type {
  CheckInResult,
  EventState,
  Feedback,
  Guest,
  Photo,
  ProfileCard,
  Question,
  Session,
  Ticket,
} from "./types";

// Dependensi kripto disuntikkan (server: dari secrets; tes: secret palsu).
export type MockDeps = {
  tokenFor(guestId: string): string;
  ticketCode(ticketId: string, keyNo: number): string;
  seedCsv(): string; // isi data/dummy-guests.csv
  now?: () => Date;
};

type State = {
  event: EventState;
  guests: Map<string, Guest>;
  tickets: Map<string, Ticket>; // by ticketId
  profiles: Map<string, ProfileCard>;
  sessions: Session[];
  questions: Question[];
  photos: Photo[];
  feedback: Feedback[];
  purged: Aggregates | null; // terisi setelah hapus otomatis; rekap tanpa identitas
  seeded: boolean;
};

function freshState(now: Date): State {
  return {
    event: { mode: "pre", activeSession: null, nextSession: "s01", updatedAt: now.toISOString() },
    guests: new Map(),
    tickets: new Map(),
    profiles: new Map(),
    sessions: DEFAULT_RUNDOWN.map((s, i) => ({
      ...s,
      points: [...s.points],
      status: i === 0 ? "berikutnya" : "nanti",
      startedAt: null,
      endedAt: null,
    })),
    questions: [],
    photos: [],
    feedback: [],
    purged: null,
    seeded: false,
  };
}

const guestIdFor = (keyNo: number) => `g${String(keyNo).padStart(3, "0")}`;
const ticketIdFor = (guestId: string) => `tk_${guestId}`;

export function createMockStore(deps: MockDeps, initial?: State): DataStore {
  const now = deps.now ?? (() => new Date());
  const s: State = initial ?? freshState(now());
  let tokenIndex: Map<string, string> | null = null; // token → guestId

  const clone = <T>(v: T): T => structuredClone(v);

  function indexTokens() {
    tokenIndex = new Map([...s.guests.keys()].map((id) => [deps.tokenFor(id), id]));
  }

  // Hapus otomatis H+30 dicek tiap akses (tanpa cron).
  function maybePurge() {
    if (!s.purged && now() >= new Date(EVENT.purgeAt)) doPurge();
  }

  function computeAggregates(): Aggregates {
    const guests = [...s.guests.values()];
    const ratings = s.feedback.map((f) => f.rating);
    const favoriteParts: Record<string, number> = {};
    for (const f of s.feedback)
      favoriteParts[f.favoritePart] = (favoriteParts[f.favoritePart] ?? 0) + 1;
    return {
      invited: guests.length,
      confirmed: guests.filter((g) => g.rsvp === "hadir").length,
      checkedIn: [...s.tickets.values()].filter((t) => t.status === "dipakai").length,
      photos: s.photos.filter((p) => !p.deleted).length,
      questions: s.questions.length,
      feedbackCount: s.feedback.length,
      ratingAvg: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      favoriteParts,
    };
  }

  function doPurge() {
    s.purged = computeAggregates();
    s.guests.clear();
    s.tickets.clear();
    s.profiles.clear();
    s.questions = [];
    s.photos = [];
    s.feedback = [];
    tokenIndex = new Map();
  }

  function issueTicket(g: Guest): Ticket {
    const ticketId = ticketIdFor(g.id);
    let t = s.tickets.get(ticketId);
    if (!t) {
      t = {
        ticketId,
        guestId: g.id,
        shortCode: deps.ticketCode(ticketId, g.keyNo),
        status: "aktif",
        checkedInAt: null,
        checkedInBy: null,
        method: null,
        guestNo: null,
      };
      s.tickets.set(ticketId, t);
    }
    return t;
  }

  function nextKeyNo() {
    let max = 0;
    for (const g of s.guests.values()) max = Math.max(max, g.keyNo);
    return max + 1;
  }

  function upsertRows(rows: GuestRow[]) {
    const byIg = new Map([...s.guests.values()].map((g) => [g.ig, g]));
    let added = 0;
    let updated = 0;
    for (const r of rows) {
      const existing = byIg.get(r.ig);
      if (existing) {
        existing.name = r.name;
        existing.wa = r.wa ?? existing.wa;
        updated++;
        continue;
      }
      const keyNo = nextKeyNo();
      const g: Guest = {
        id: guestIdFor(keyNo),
        keyNo,
        name: r.name,
        ig: r.ig,
        wa: r.wa,
        rsvp: "belum",
        rsvpAt: null,
        followConfirmed: false,
        inviteStatus: "belum",
        reminderStatus: "belum",
        walkIn: false,
        createdAt: now().toISOString(),
      };
      s.guests.set(g.id, g);
      byIg.set(g.ig, g);
      added++;
    }
    indexTokens();
    return { added, updated };
  }

  function requireGuest(id: string): Guest {
    const g = s.guests.get(id);
    if (!g) throw new Error("Tamu tidak ditemukan");
    return g;
  }

  const store: DataStore = {
    kind: "mock",

    async ping() {
      const start = performance.now();
      maybePurge();
      return { ok: true, latencyMs: Math.round(performance.now() - start) };
    },

    async getEventState() {
      return clone(s.event);
    },

    async listSessions() {
      return clone(s.sessions);
    },

    async listGuests() {
      maybePurge();
      return clone([...s.guests.values()].sort((a, b) => a.keyNo - b.keyNo));
    },

    async getGuest(id) {
      maybePurge();
      const g = s.guests.get(id);
      return g ? clone(g) : null;
    },

    async getGuestByToken(token) {
      maybePurge();
      if (!tokenIndex) indexTokens();
      const id = tokenIndex!.get(token);
      return id ? clone(s.guests.get(id)!) : null;
    },

    linkToken(guestId) {
      return deps.tokenFor(guestId);
    },

    async importGuests(rows) {
      maybePurge();
      return upsertRows(rows);
    },

    async setRsvp(guestId, input) {
      const g = requireGuest(guestId);
      const ig = normalizeIg(input.ig);
      const clash = [...s.guests.values()].find((o) => o.ig === ig && o.id !== guestId);
      if (clash) throw new Error("IG sudah dipakai tamu lain");
      g.name = input.name.trim() || g.name;
      g.ig = ig;
      g.wa = input.wa;
      g.followConfirmed = input.followConfirmed;
      g.rsvp = input.rsvp;
      g.rsvpAt = now().toISOString();
      if (g.rsvp === "hadir") issueTicket(g);
      return clone(g);
    },

    async markSent(guestId, kind, status) {
      const g = requireGuest(guestId);
      if (kind === "invite") g.inviteStatus = status;
      else g.reminderStatus = status;
      return clone(g);
    },

    async addWalkIn({ name, ig }) {
      const norm = normalizeIg(ig);
      const existing = [...s.guests.values()].find((g) => g.ig === norm);
      if (existing) return clone(existing);
      upsertRows([{ line: 0, name: name.trim(), ig: norm, wa: null }]);
      const g = [...s.guests.values()].find((x) => x.ig === norm)!;
      g.walkIn = true;
      g.rsvp = "hadir";
      g.rsvpAt = now().toISOString();
      g.inviteStatus = "terkirim";
      issueTicket(g);
      return clone(g);
    },

    async getTicketForGuest(guestId) {
      const t = s.tickets.get(ticketIdFor(guestId));
      return t ? clone(t) : null;
    },

    // Idempoten: tiket yang sama dua kali → "used", hitungan tidak bertambah.
    async checkIn(target, by, method): Promise<CheckInResult> {
      maybePurge();
      let t: Ticket | undefined;
      if ("ticketId" in target) t = s.tickets.get(target.ticketId);
      else {
        const g = s.guests.get(target.guestId);
        if (g) t = issueTicket(g); // manual (P07): tamu yang belum konfirmasi tetap bisa masuk
      }
      if (!t) return { kind: "unknown" };
      const g = s.guests.get(t.guestId);
      if (!g) return { kind: "unknown" };
      if (t.status === "dipakai") return { kind: "used", guest: clone(g), ticket: clone(t) };
      const count = [...s.tickets.values()].filter((x) => x.status === "dipakai").length;
      t.status = "dipakai";
      t.checkedInAt = now().toISOString();
      t.checkedInBy = by;
      t.method = method;
      t.guestNo = count + 1;
      if (g.rsvp !== "hadir") {
        g.rsvp = "hadir";
        g.rsvpAt ??= t.checkedInAt;
      }
      return { kind: "valid", guest: clone(g), ticket: clone(t) };
    },

    async getProfile(guestId) {
      const p = s.profiles.get(guestId);
      return p ? clone(p) : null;
    },

    async saveProfile(card) {
      requireGuest(card.guestId);
      const clean: ProfileCard = {
        ...card,
        role: card.role.trim().slice(0, 40),
        skills: card.skills
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 3),
        asbun: card.asbun
          .map((x) => x.trim())
          .filter(Boolean)
          .slice(0, 3),
      };
      s.profiles.set(card.guestId, clean);
      return clone(clean);
    },

    async purgePersonalData(at) {
      if (s.purged || at < new Date(EVENT.purgeAt)) return { purged: false };
      doPurge();
      return { purged: true };
    },

    async aggregates() {
      return clone(s.purged ?? computeAggregates());
    },

    // Seed dummy: idempoten (upsert by IG, tiket deterministik). Status beragam untuk P03:
    // 15 undangan terkirim, 17 hadir, 1 tidak bisa, sisanya belum jawab.
    async seed() {
      if (s.seeded) return;
      const { rows, errors } = parseGuests(deps.seedCsv());
      if (errors.length) throw new Error(`CSV dummy error: ${errors[0].message}`);
      upsertRows(rows);
      for (const g of s.guests.values()) {
        if (g.keyNo <= 15) g.inviteStatus = "terkirim";
        if (g.keyNo <= 17 && g.rsvp === "belum") {
          g.rsvp = "hadir";
          g.followConfirmed = true;
          g.rsvpAt = now().toISOString();
          issueTicket(g);
        } else if (g.keyNo === 18 && g.rsvp === "belum") {
          g.rsvp = "tidak";
          g.rsvpAt = now().toISOString();
        }
      }
      s.seeded = true;
    },

    async reset() {
      Object.assign(s, freshState(now()));
      tokenIndex = null;
    },
  };
  return store;
}
