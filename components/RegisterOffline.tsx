"use client";

import { useEffect } from "react";

// T03 offline: daftarkan service worker (/sw.js) yang menyimpan halaman tiket terakhir,
// jadi tiket & QR tetap tampil walau sinyal hilang di depan pintu.
export function RegisterOffline() {
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
