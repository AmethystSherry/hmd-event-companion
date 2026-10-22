import { importGuests as parseGuests, normalizeIg, type GuestRow } from "../csv";
import { DEFAULT_RUNDOWN, EVENT } from "../event";
import { UNDO_MS, type Aggregates, type DataStore } from "./store";
import type {
  CheckInResult,
  EventSnapshot,
  EventState,
  Feedback,
  Guest,
  Photo,
  ProfileCard,
  Question,
  Session,
  SessionEdit,
  Ticket,
} from "./types";

// Dependensi kripto disuntikkan (server: dari secrets; tes: secret palsu).
export type MockDeps = {
  tokenFor(guestId: string): string;
  ticketCode(ticketId: string, keyNo: number): string;
  seedCsv(): string; // isi data/tamu-hmd-dummy.csv
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
  // Snapshot sebelum "Mulai" terakhir, untuk tombol Batalkan (BP02, ≤ UNDO_MS).
  undo: { sessionId: string; by: string; at: number; rev: number; prev: EventSnapshot } | null;
};

function freshState(now: Date): State {
  return {
    event: {
      mode: "pre",
      activeSession: null,
      nextSession: "s01",
      updatedAt: now.toISOString(),
      rev: 0,
      by: null,
    },
    guests: new Map(),
    tickets: new Map(),
    profiles: new Map(),
    sessions: DEFAULT_RUNDOWN.map((s, i) => ({
      ...s,
      points: [...s.points],
      hosts: [...s.hosts],
      status: i === 0 ? "berikutnya" : "nanti",
      startedAt: null,
      endedAt: null,
    })),
    questions: [],
    photos: [],
    feedback: [],
    purged: null,
    seeded: false,
    undo: null,
  };
}

const guestIdFor = (keyNo: number) => `g${String(keyNo).padStart(3, "0")}`;
const ticketIdFor = (guestId: string) => `tk_${guestId}`;

export function createMockStore(deps: MockDeps, initial?: State): DataStore {
  const now = deps.now ?? (() => new Date());
  const s: State = initial ?? freshState(now());
  let tokenIndex: Map<string, string> | null = null; // token → guestId

  const clone = <T>(v: T): T => structuredClone(v);
  const listeners = new Set<(snap: EventSnapshot) => void>();

  const snapshot = (): EventSnapshot => clone({ event: s.event, sessions: s.sessions });

  // Hitung ulang status sesi & sesi berikutnya dari mode + sesi aktif, lalu siarkan.
  function commit(by: string) {
    const ordered = [...s.sessions].sort((a, b) => a.order - b.order);
    const next = ordered.find((x) => x.status !== "selesai" && x.id !== s.event.activeSession);
    for (const x of s.sessions) {
      if (x.status === "selesai") continue;
      x.status =
        x.id === s.event.activeSession ? "berlangsung" : x.id === next?.id ? "berikutnya" : "nanti";
    }
    s.event.nextSession = next?.id ?? null;
    s.event.updatedAt = now().toISOString();
    s.event.rev += 1;
    s.event.by = by;
    const snap = snapshot();
    for (const fn of listeners) {
      try {
        fn(snap);
      } catch {
        // listener rusak (koneksi SSE putus) tidak boleh mengganggu yang lain
      }
    }
  }

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
      return clone([...s.sessions].sort((a, b) => a.order - b.order));
    },

    async getSnapshot() {
      return snapshot();
    },

    // Mulai sesi N (BP01): mode=sesi, N berlangsung. Sesi lain yang masih jalan diselesaikan dulu.
    async startSession(sessionId, by) {
      const target = s.sessions.find((x) => x.id === sessionId);
      if (!target || target.status === "selesai" || s.event.mode === "closed") return snapshot();
      if (s.event.activeSession === sessionId) return snapshot(); // sudah dimulai HP lain
      const prev = snapshot();
      const t = now().toISOString();
      const running = s.sessions.find((x) => x.id === s.event.activeSession);
      if (running) {
        running.status = "selesai";
        running.endedAt = t;
      }
      target.startedAt = t;
      target.endedAt = null;
      s.event.mode = "sesi";
      s.event.activeSession = sessionId;
      commit(by);
      s.undo = { sessionId, by, at: now().getTime(), rev: s.event.rev, prev };
      return snapshot();
    },

    // Batalkan Mulai (toast 5 dtk): kembali persis ke state sebelumnya, kalau belum ada perubahan lain.
    async undoStart(sessionId, by) {
      const u = s.undo;
      if (!u || u.sessionId !== sessionId || u.rev !== s.event.rev) return snapshot();
      if (now().getTime() - u.at > UNDO_MS) return snapshot();
      s.sessions = clone(u.prev.sessions);
      s.event = { ...clone(u.prev.event), rev: s.event.rev };
      s.undo = null;
      commit(by);
      return snapshot();
    },

    // Selesaikan sesi (BP03): "Selesai & mulai {berikutnya}" atau "Selesai aja" → Jeda.
    async finishSession(sessionId, by, { startNext }) {
      if (s.event.activeSession !== sessionId) return snapshot(); // basi
      const cur = s.sessions.find((x) => x.id === sessionId)!;
      cur.status = "selesai";
      cur.endedAt = now().toISOString();
      s.event.activeSession = null;
      s.event.mode = "jeda";
      s.undo = null;
      commit(by);
      const nextId = s.event.nextSession;
      if (startNext && nextId) return store.startSession(nextId, by);
      return snapshot();
    },

    // Tutup acara (BP04b): semua HP tamu ke buku tamu.
    async closeEvent(by) {
      if (s.event.mode === "closed") return snapshot();
      const running = s.sessions.find((x) => x.id === s.event.activeSession);
      if (running) {
        running.status = "selesai";
        running.endedAt = now().toISOString();
      }
      s.event.mode = "closed";
      s.event.activeSession = null;
      s.undo = null;
      commit(by);
      return snapshot();
    },

    // Edit rundown: judul, ruang, tipe, jam, durasi, PIC, urutan. Sesi selesai tetap boleh dikoreksi.
    async updateRundown(edits: SessionEdit[], by) {
      for (const e of edits) {
        const x = s.sessions.find((y) => y.id === e.id);
        if (!x) continue;
        if (e.title !== undefined) x.title = e.title.trim().slice(0, 40) || x.title;
        if (e.room !== undefined) x.room = e.room.trim().slice(0, 30);
        if (e.type !== undefined) x.type = e.type === "talkshow" ? "talkshow" : "info";
        if (e.startsAt !== undefined && /^\d{2}\.\d{2}$/.test(e.startsAt)) x.startsAt = e.startsAt;
        if (e.durationMin !== undefined)
          x.durationMin = Math.max(5, Math.min(240, Math.round(e.durationMin)));
        if (e.pic !== undefined) x.pic = e.pic.trim().slice(0, 30);
        if (e.speakers !== undefined) x.speakers = e.speakers.trim().slice(0, 80);
        if (e.teaser !== undefined) x.teaser = e.teaser.trim().slice(0, 160);
        if (e.order !== undefined) x.order = e.order;
      }
      [...s.sessions].sort((a, b) => a.order - b.order).forEach((x, i) => (x.order = i + 1));
      commit(by);
      return snapshot();
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
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

    async checkInCount() {
      maybePurge();
      return {
        checkedIn: [...s.tickets.values()].filter((x) => x.status === "dipakai").length,
        total: s.guests.size,
      };
    },

    async eventStats() {
      maybePurge();
      const used = [...s.tickets.values()]
        .filter((x) => x.status === "dipakai" && x.checkedInAt)
        .sort((a, b) => (b.checkedInAt! > a.checkedInAt! ? 1 : -1));
      const questionsBySession: Record<string, number> = {};
      for (const q of s.questions)
        questionsBySession[q.sessionId] = (questionsBySession[q.sessionId] ?? 0) + 1;
      return {
        checkedIn: used.length,
        total: s.guests.size,
        photos: s.photos.filter((x) => !x.deleted).length,
        questions: s.questions.length,
        questionsBySession,
        recentNames: used.slice(0, 3).map((x) => s.guests.get(x.guestId)?.name ?? ""),
      };
    },

    async addQuestion({ guestId, sessionId, text, anonymous }) {
      requireGuest(guestId);
      const clean = text.trim().slice(0, 280);
      if (!clean) throw new Error("Pertanyaan kosong");
      const q: Question = {
        id: `q${s.questions.length + 1}`,
        guestId,
        sessionId,
        text: clean,
        anonymous,
        clusterId: null,
        answered: false,
        createdAt: now().toISOString(),
      };
      s.questions.push(q);
      return clone(q);
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
      listeners.clear();
      tokenIndex = null;
    },
  };
  return store;
}
