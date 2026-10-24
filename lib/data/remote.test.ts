import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { StoreData } from "./types";

vi.mock("next/server", () => ({ connection: async () => {} }));

// PostgREST palsu: satu tabel hmd_store, cukup untuk GET/POST/PATCH yang dipakai lib/data/supabase.
type Row = { id: string; rev: number; data: StoreData };
let row: Row | null;
let beforePatch: (() => void) | null;

function fakeFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = new URL(String(input));
  const method = init?.method ?? "GET";
  const json = (body: unknown) => Promise.resolve(new Response(JSON.stringify(body)));
  if (!url.pathname.endsWith("/hmd_store")) return json([]);
  if (method === "GET") {
    if (!row) return json([]);
    return json([url.searchParams.get("select") === "rev" ? { rev: row.rev } : { data: row.data }]);
  }
  if (method === "POST") {
    const body = JSON.parse(String(init?.body)) as Row;
    row ??= structuredClone(body);
    return Promise.resolve(new Response(null, { status: 201 }));
  }
  if (method === "PATCH") {
    beforePatch?.();
    beforePatch = null;
    const want = Number(url.searchParams.get("rev")?.replace("eq.", ""));
    if (!row || row.rev !== want) return json([]);
    const body = JSON.parse(String(init?.body)) as { rev: number; data: StoreData };
    row = { id: row.id, rev: body.rev, data: structuredClone(body.data) };
    return json([{ rev: row.rev }]);
  }
  return Promise.resolve(new Response(null, { status: 405 }));
}

beforeEach(() => {
  row = null;
  beforePatch = null;
  vi.stubEnv("SUPABASE_URL", "https://contoh.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "kunci-uji");
  vi.stubGlobal("fetch", vi.fn(fakeFetch));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const { getRev, getStore, isRemoteStore, mutateStore } = await import("./index");
const DEFAULTS = { dmTemplate: "Halo!", location: "Potara Studio" };

describe("store Supabase (deploy Vercel)", () => {
  it("aktif kalau env Supabase diisi; baris kosong diisi seed", async () => {
    expect(isRemoteStore()).toBe(true);
    const store = await getStore();
    expect(store.listEvents().length).toBeGreaterThan(0);
    expect(row?.id).toBe("main");
  });

  it("mutateStore menyimpan perubahan dan menaikkan rev", async () => {
    await getStore();
    const before = await getRev();
    const e = await mutateStore((s) =>
      s.createEvent({ name: "Uji", date: "2026-12-01" }, DEFAULTS),
    );
    expect(await getRev()).toBe(before + 1);
    expect((await getStore()).getEvent(e.id)?.name).toBe("Uji");
  });

  it("tanpa perubahan (idempoten) → nggak menulis", async () => {
    await getStore();
    const rev = await getRev();
    await mutateStore((s) => s.listEvents());
    expect(await getRev()).toBe(rev);
    expect(vi.mocked(fetch).mock.calls.some(([, i]) => i?.method === "PATCH")).toBe(false);
  });

  it("HP lain menyimpan duluan → diulang di data terbaru, dua perubahan sama-sama masuk", async () => {
    await getStore();
    // Saat PATCH pertama, "HP lain" sudah menambah event → rev berubah → PATCH ini gagal.
    beforePatch = () => {
      const other = structuredClone(row!.data);
      other.events.push({ ...other.events[0], id: "dari-hp-lain", name: "HP lain" });
      other.rev += 1;
      row = { ...row!, rev: other.rev, data: other };
    };
    let runs = 0;
    await mutateStore((s) => {
      runs += 1;
      return s.createEvent({ name: "HP ini", date: "2026-12-02" }, DEFAULTS);
    });
    expect(runs).toBe(2);
    const names = (await getStore()).listEvents().map((e) => e.name);
    expect(names).toContain("HP lain");
    expect(names).toContain("HP ini");
  });

  it("salinan dari getStore read-only: mengubah langsung melempar error", async () => {
    const store = await getStore();
    expect(() => store.createEvent({ name: "X", date: "2026-12-03" }, DEFAULTS)).toThrow(
      /mutateStore/,
    );
  });
});
