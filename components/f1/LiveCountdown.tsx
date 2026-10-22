"use client";

import { useEffect, useState } from "react";
import { Countdown } from "@/components/ui";
import { countdownLabel } from "@/lib/format";

// Countdown T03/T03h yang ikut berjalan (tiap 30 dtk). `frozenNow` dipakai /dev/states/f1.
export function LiveCountdown({
  target,
  label,
  caption,
  initialNow,
  frozen,
}: {
  target: string; // ISO
  label: string;
  caption: string;
  initialNow: string; // ISO dari server supaya HTML awal sama dengan klien
  frozen?: boolean;
}) {
  const [now, setNow] = useState(() => new Date(initialNow));
  useEffect(() => {
    if (frozen) return;
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, [frozen]);
  return (
    <Countdown label={label} value={countdownLabel(new Date(target), now)} caption={caption} />
  );
}
