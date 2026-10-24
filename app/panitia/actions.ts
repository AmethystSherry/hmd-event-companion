"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  commonMessage,
  isValidIg,
  isValidWa,
  normalizeIg,
  normalizeWa,
  parseGuestCsv,
} from "@/lib/csv";
import {
  mutateStore,
  StoreError,
  type DataStore,
  type SessionType,
  type StateAction,
} from "@/lib/data";
import type { InviteSnapshot } from "@/lib/data/store";
import { LOCATION } from "@/lib/data/seed";
import { DEFAULT_DM_TEMPLATE } from "@/lib/invite";
import {
  clientKey,
  endCrewSession,
  attemptPin,
  requireCrew,
  startCrewSession,
} from "@/lib/server/access";
import { serverNow } from "@/lib/server/clock";
import { secrets } from "@/lib/server/config";

// Semua aksi panitia F1. Tiap aksi memeriksa sesi panitia (cookie httpOnly) di server.

export type PinState =
  | { kind: "idle" }
  | { kind: "wrong"; remaining: number }
  | { kind: "locked"; ms: number } // sisa waktu kunci
  | { kind: "disabled" };

// P01 · PIN 6 digit, 5× salah → kunci 5 menit (P01b / P01c).
export async function loginWithPin(pin: string): Promise<PinState> {
  const res = await attemptPin(await clientKey(), String(pin), secrets().eventPin);
  if (res.kind === "ok") {
    await startCrewSession();
    refresh();
    return { kind: "idle" };
  }
  if (res.kind === "locked") return { kind: "locked", ms: res.retryAfterMs };
  return res;
}

export async function logout(): Promise<void> {
  await endCrewSession();
  redirect("/panitia");
}

export type FormResult = { ok: true; id?: string } | { ok: false; error: string; field?: string };

// PE02 · Buat event: cukup nama + tanggal.
function cleanEvent(input: { name: string; date: string }) {
  const name = input.name.trim().slice(0, 60);
  if (!name) return { ok: false as const, field: "name", error: "Nama event wajib diisi." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date))
    return { ok: false as const, field: "date", error: "Tanggal wajib diisi." };
  return { ok: true as const, value: { name, date: input.date } };
}

export async function createEvent(input: { name: string; date: string }): Promise<FormResult> {
  await requireCrew();
  const r = cleanEvent(input);
  if (!r.ok) return r;
  const e = await mutateStore((store) =>
    store.createEvent(r.value, { dmTemplate: DEFAULT_DM_TEMPLATE, location: LOCATION }),
  );
  refresh();
  return { ok: true, id: e.id };
}

// PE03e · ubah nama & tanggal event (tamu & rundown tetap).
export async function updateEvent(
  eventId: string,
  input: { name: string; date: string },
): Promise<FormResult> {
  await requireCrew();
  const r = cleanEvent(input);
  if (!r.ok) return r;
  await mutateStore((store) => store.updateEvent(eventId, r.value));
  refresh();
  return { ok: true };
}

// PE03h · hapus event berantai, lalu kembali ke Event kamu (PE01 / PE01a).
export async function deleteEvent(eventId: string): Promise<void> {
  await requireCrew();
  await mutateStore((store) => store.deleteEvent(eventId));
  redirect("/panitia");
}

// ---- Rundown (PE04 / PE04a) ----
export type SessionForm = {
  title: string;
  startsAt: string; // "14:00" atau "14.00"
  durationMin: number;
  type: SessionType;
  pic: string;
};

function cleanSession(input: SessionForm) {
  const title = input.title.trim().slice(0, 60);
  const m = input.startsAt.match(/^(\d{1,2})[.:](\d{2})$/);
  const duration = Math.round(Number(input.durationMin));
  if (!title) return { error: "Nama sesi wajib diisi.", field: "title" };
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59)
    return { error: "Jam mulai belum pas.", field: "startsAt" };
  if (!Number.isFinite(duration) || duration < 5 || duration > 600)
    return { error: "Durasi 5–600 menit.", field: "durationMin" };
  return {
    value: {
      title,
      startsAt: `${m[1].padStart(2, "0")}.${m[2]}`,
      durationMin: duration,
      type: input.type === "talkshow" ? ("talkshow" as const) : ("info" as const),
      pic: input.pic.trim().slice(0, 40) || "Tim Acara",
    },
  };
}

export async function saveSession(
  eventId: string,
  sessionId: string | null,
  input: SessionForm,
): Promise<FormResult> {
  await requireCrew();
  const r = cleanSession(input);
  if (!r.value) return { ok: false, error: r.error!, field: r.field };
  await mutateStore((store) =>
    sessionId ? store.updateSession(sessionId, r.value) : store.addSession(eventId, r.value),
  );
  refresh();
  return { ok: true };
}

export async function deleteSession(sessionId: string): Promise<FormResult> {
  await requireCrew();
  await mutateStore((store) => store.deleteSession(sessionId));
  refresh();
  return { ok: true };
}

// ---- Tamu & undangan ----

// P04a · simpan CSV (sekali). Baris error (P04c) dibuang, diperbaiki manual nanti.
export async function importGuests(
  eventId: string,
  fileName: string,
  csvText: string,
): Promise<FormResult> {
  await requireCrew();
  const parsed = parseGuestCsv(csvText);
  if (!parsed.ok) return { ok: false, error: parsed.message };
  if (!parsed.valid.length) return { ok: false, error: "Belum ada baris yang aman disimpan." };
  try {
    await mutateStore((store) =>
      store.importCsv(eventId, fileName.slice(0, 80), parsed.valid, commonMessage(parsed.valid)),
    );
  } catch (err) {
    if (err instanceof StoreError) return { ok: false, error: err.message };
    throw err;
  }
  refresh();
  return { ok: true };
}

export type GuestForm = { name: string; ig: string; wa: string };

function cleanGuest(input: GuestForm) {
  const name = input.name.trim().replace(/\s+/g, " ").slice(0, 60);
  const ig = normalizeIg(input.ig);
  const wa = normalizeWa(input.wa);
  if (!name) return { error: "Nama wajib diisi.", field: "name" };
  if (!ig) return { error: "Username IG wajib diisi, buat buka DM.", field: "ig" };
  if (!isValidIg(ig)) return { error: "Format username IG belum pas.", field: "ig" };
  if (wa && !isValidWa(wa)) return { error: "Nomor WA-nya kurang pas.", field: "wa" };
  return { value: { name, ig, wa } };
}

async function guestOp(fn: (store: DataStore) => unknown): Promise<FormResult> {
  try {
    await mutateStore(fn);
  } catch (err) {
    if (err instanceof StoreError)
      return { ok: false, error: err.message, field: err.code === "ig-dipakai" ? "ig" : undefined };
    throw err;
  }
  refresh();
  return { ok: true };
}

// P04f · tambah tamu manual → "Belum diundang".
export async function addGuest(eventId: string, input: GuestForm): Promise<FormResult> {
  await requireCrew();
  const r = cleanGuest(input);
  if (!r.value) return { ok: false, error: r.error!, field: r.field };
  return guestOp((store) => store.addGuest(eventId, r.value));
}

// P04e · ubah tamu: status undangan & jawaban tetap.
export async function updateGuest(guestId: string, input: GuestForm): Promise<FormResult> {
  await requireCrew();
  const r = cleanGuest(input);
  if (!r.value) return { ok: false, error: r.error!, field: r.field };
  return guestOp((store) => store.updateGuest(guestId, r.value));
}

export async function deleteGuest(guestId: string): Promise<FormResult> {
  await requireCrew();
  return guestOp((store) => store.deleteGuest(guestId));
}

// P04d · balik dari IG → Diundang. Mengembalikan status sebelumnya untuk "Batalkan".
export async function markInvited(guestId: string): Promise<InviteSnapshot> {
  await requireCrew();
  const prev = await mutateStore((store) => store.markInvited(guestId));
  refresh();
  return prev;
}

export async function undoInvite(guestId: string, prev: InviteSnapshot): Promise<void> {
  await requireCrew();
  await mutateStore((store) => store.restoreInvite(guestId, prev));
  refresh();
}

// P04b · pengingat H-1 terkirim (ditandai saat panitia balik dari WA).
export async function markReminderSent(guestId: string): Promise<void> {
  await requireCrew();
  await mutateStore((store) => store.markReminderSent(guestId));
  refresh();
}

// Hasil aksi Kontrol acara. changed=false → aksinya udah dilakukan HP lain duluan (no-op); `by` +
// `action` = siapa & apa yang terakhir mengubah state (toast BP02d "HP 7K2Q udah mulai …").
export type StateResult =
  | { ok: true; changed: boolean; by: string | null; action: StateAction | null }
  | { ok: false; error: string };

async function stateOp(
  eventId: string,
  fn: (store: DataStore, at: string) => boolean,
): Promise<StateResult> {
  await requireCrew();
  const at = (await serverNow()).toISOString();
  try {
    const r = await mutateStore((store) => {
      const changed = fn(store, at);
      const e = store.getEvent(eventId);
      return { changed, by: e?.stateBy ?? null, action: e?.stateAction ?? null };
    });
    refresh(); // no-op juga: layar HP ini ikut state terbaru dari HP lain
    return { ok: true, ...r };
  } catch (err) {
    if (err instanceof StoreError) return { ok: false, error: err.message };
    throw err;
  }
}

const cleanBy = (by: string | null) => (by ? by.slice(0, 16) : null);

// BP01b · Mulai sesi (sesi lain yang masih jalan ikut selesai) · BP03 · Selesaikan sesi.
// Jam dari server (stopwatch semua HP sama). Dobel tap / dua HP → idempoten di store (K10).
export async function startSession(
  eventId: string,
  sessionId: string,
  by: string | null = null,
): Promise<StateResult> {
  return stateOp(eventId, (store, at) => store.startSession(eventId, sessionId, at, cleanBy(by)));
}

export async function finishSession(
  eventId: string,
  sessionId: string,
  by: string | null = null,
): Promise<StateResult> {
  return stateOp(eventId, (store, at) => store.finishSession(eventId, sessionId, at, cleanBy(by)));
}

// F5 · BP04b "Ya, tutup acara": mode closed → semua HP tamu pindah ke BT12 (rev → SSE).
// Sekali jalan; dobel tap / dua HP → idempoten di store. Sesi terakhir belum selesai → error.
export async function closeEvent(eventId: string, by: string | null = null): Promise<StateResult> {
  return stateOp(eventId, (store, at) => store.closeEvent(eventId, at, cleanBy(by)));
}
