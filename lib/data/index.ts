import { readFileSync } from "node:fs";
import { join } from "node:path";
import { connection } from "next/server";
import { secrets } from "../server/config";
import { guestToken, shortCode } from "../server/crypto";
import { createMockStore } from "./mock";
import type { DataStore } from "./store";

// Disimpan di globalThis supaya bertahan saat hot reload `next dev`.
const g = globalThis as typeof globalThis & { __hmdStore?: Promise<DataStore> };

async function build(): Promise<DataStore> {
  const sec = secrets();
  const store = createMockStore({
    tokenFor: (id) => guestToken(sec.guestTokenSecret, id),
    ticketCode: (ticketId, keyNo) => shortCode(sec.ticketSecret, ticketId, keyNo),
    seedCsv: () => readFileSync(join(process.cwd(), "data", "dummy-guests.csv"), "utf8"),
  });
  await store.seed(); // data dummy sampai Test Day (prd.md §8)
  return store;
}

// Data acara selalu data waktu-request (berubah realtime, ada jam purge), jadi `connection()`
// mengeluarkannya dari prerender cacheComponents.
export async function getStore(): Promise<DataStore> {
  await connection();
  g.__hmdStore ??= build().catch((err) => {
    g.__hmdStore = undefined; // coba lagi di request berikutnya (mis. setelah .env.local diisi)
    throw err;
  });
  return g.__hmdStore;
}

export type { Aggregates, DataStore, RsvpInput } from "./store";
export type * from "./types";
