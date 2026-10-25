import { isValidIg, normalizeIg } from "./csv";
import type { Session, SessionType } from "./data/types";

// Form sheet Ubah/Tambah sesi (PE04a Talkshow · PE04b Info): tipe, validasi bersama (form & server).

export type SessionForm = {
  title: string;
  startsAt: string; // "14:00" atau "14.00"
  durationMin: number;
  type: SessionType;
  pic: string;
  room: string;
  topic: string; // talkshow
  speaker: string; // talkshow
  speakerIg: string; // talkshow, boleh pakai "@"
  description: string;
};

export const DESCRIPTION_MAX = 140;
const SPEAKER_LABEL = "Guest star";

export const EMPTY_SESSION_FORM: SessionForm = {
  title: "",
  startsAt: "",
  durationMin: 45,
  type: "info",
  pic: "",
  room: "",
  topic: "",
  speaker: "",
  speakerIg: "",
  description: "",
};

export function sessionToForm(s: Session): SessionForm {
  return {
    title: s.title,
    startsAt: s.startsAt,
    durationMin: s.durationMin,
    type: s.type,
    pic: s.pic,
    room: s.room ?? "",
    topic: s.topic ?? "",
    speaker: s.speaker?.name ?? "",
    speakerIg: s.speaker?.ig ? `@${s.speaker.ig}` : "",
    description: s.description ?? "",
  };
}

export type SessionValues = Pick<
  Session,
  | "title"
  | "startsAt"
  | "durationMin"
  | "type"
  | "pic"
  | "room"
  | "description"
  | "topic"
  | "speaker"
>;

export type CleanSession =
  { ok: true; value: SessionValues } | { ok: false; error: string; field: keyof SessionForm };

const text = (v: string, max: number) => v.trim().replace(/\s+/g, " ").slice(0, max) || null;

// Simpan sebagai Info → topik & pembicara dikosongkan (nilainya cuma disembunyikan di form selama
// tipe diganti-ganti, baru dibuang saat disimpan).
export function cleanSession(input: SessionForm, prev?: Session | null): CleanSession {
  const title = input.title.trim().slice(0, 60);
  const m = input.startsAt.match(/^(\d{1,2})[.:](\d{2})$/);
  const duration = Math.round(Number(input.durationMin));
  if (!title) return { ok: false, error: "Nama sesi wajib diisi.", field: "title" };
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59)
    return { ok: false, error: "Jam mulai belum pas.", field: "startsAt" };
  if (!Number.isFinite(duration) || duration < 5 || duration > 600)
    return { ok: false, error: "Durasi 5–600 menit.", field: "durationMin" };
  if (input.description.trim().length > DESCRIPTION_MAX)
    return { ok: false, error: `Deskripsi maks ${DESCRIPTION_MAX} huruf.`, field: "description" };
  const talkshow = input.type === "talkshow";
  const ig = talkshow ? normalizeIg(input.speakerIg) : "";
  if (ig && !isValidIg(ig))
    return {
      ok: false,
      error: "Username IG cuma huruf, angka, titik, atau garis bawah.",
      field: "speakerIg",
    };
  const speakerName = talkshow ? text(input.speaker, 40) : null;
  return {
    ok: true,
    value: {
      title,
      startsAt: `${m[1].padStart(2, "0")}.${m[2]}`,
      durationMin: duration,
      type: talkshow ? "talkshow" : "info",
      pic: input.pic.trim().slice(0, 40) || "Tim Acara",
      room: text(input.room, 20),
      description: text(input.description, DESCRIPTION_MAX),
      topic: talkshow ? text(input.topic, 80) : null,
      speaker: speakerName
        ? { name: speakerName, ig, label: prev?.speaker?.label ?? SPEAKER_LABEL }
        : null,
    },
  };
}

// Sesi yang dikirim ke HP tamu (T01, layar acara): tanpa PIC (nama panitia) & status internal.
export type GuestSession = Omit<Session, "pic">;
export function sessionForGuest(s: Session): GuestSession {
  return Object.fromEntries(Object.entries(s).filter(([k]) => k !== "pic")) as GuestSession;
}
