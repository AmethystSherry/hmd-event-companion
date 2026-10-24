"use client";

import { useEffect, useState } from "react";

// Jam server yang ikut berjalan: selisih jam HP ↔ server diambil sekali saat render, lalu diputar
// tiap `tickMs` (stopwatch BP02 tiap detik, countdown BT03 tiap 15 dtk). `frozen` = pratinjau.
// `skewMs` = selisih yang udah diketahui (F4 offline: data dari snapshot, jam server-nya lama).
export function useServerNow(
  serverNow: string,
  opts: { frozen?: boolean; tickMs?: number; skewMs?: number | null } = {},
) {
  const { frozen, tickMs = 1000, skewMs } = opts;
  const base = new Date(serverNow).getTime();
  const [state, setState] = useState({ base, now: base });
  if (state.base !== base) setState({ base, now: base }); // data baru dari server
  useEffect(() => {
    if (frozen) return;
    const skew = skewMs ?? base - Date.now();
    const tick = () => setState({ base, now: Date.now() + skew });
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, tickMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [base, frozen, tickMs, skewMs]);
  return state.now;
}
