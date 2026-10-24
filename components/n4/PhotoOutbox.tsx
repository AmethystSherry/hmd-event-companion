"use client";

import { usePhotoOutbox } from "./usePhotoOutbox";

// Antrean foto tetap jalan di belakang setelah tamu "Kembali ke acara" dari BT07b. Tanpa UI.
export function PhotoOutbox({ token }: { token: string }) {
  usePhotoOutbox(token);
  return null;
}
