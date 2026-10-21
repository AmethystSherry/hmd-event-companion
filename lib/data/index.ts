import { createMockStore } from "./mock";
import type { DataStore } from "./store";

let store: DataStore | undefined;

export function getStore(): DataStore {
  store ??= createMockStore();
  return store;
}

export type { DataStore } from "./store";
export type * from "./types";
