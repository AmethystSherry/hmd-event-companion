"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Muat ulang data server tepat di waktu tertentu (mis. 00.00 WIB hari-H: T03 → T05) tanpa
// menunggu tamu menutup-buka halaman. `serverNow` menyamakan jam HP dengan jam server.
export function RefreshAt({ at, serverNow }: { at: string; serverNow: string }) {
  const router = useRouter();
  useEffect(() => {
    const skew = new Date(serverNow).getTime() - Date.now();
    const wait = new Date(at).getTime() - (Date.now() + skew);
    if (wait <= 0 || wait > 2 ** 31 - 1) return;
    const t = setTimeout(() => router.refresh(), wait + 1000);
    return () => clearTimeout(t);
  }, [at, serverNow, router]);
  return null;
}
