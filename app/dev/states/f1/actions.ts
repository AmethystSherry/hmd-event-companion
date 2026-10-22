"use server";

import { refresh } from "next/cache";
import { resetStore } from "@/lib/data";

// Dev saja: kembalikan store lokal ke seed (HMD tanpa tamu) supaya alur F1 bisa diulang.
export async function resetDemo(): Promise<void> {
  if (process.env.NODE_ENV === "production") throw new Error("Hanya untuk dev");
  await resetStore();
  refresh();
}
