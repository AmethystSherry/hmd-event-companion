"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Backspace, LockKey, WarningCircle } from "@/components/icons";
import { Badge, Banner, LogoMark } from "@/components/ui";
import { cx } from "@/lib/cx";
import { mmss } from "@/lib/format";
import styles from "./pin.module.css";

// P01 · Masuk panitia (PIN) + P01b PIN salah + P01c terkunci 5 menit.
// Kirim otomatis saat 6 digit terisi (desain tanpa tombol "Masuk").
type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "wrong"; remaining: number }
  | { kind: "locked"; until: number }
  | { kind: "error"; message: string };

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"] as const;

export function PinLogin({ next }: { next: string }) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [now, setNow] = useState(() => Date.now());

  const locked = status.kind === "locked" && status.until > now;
  const wrong = status.kind === "wrong";

  // Countdown P01c.
  useEffect(() => {
    if (status.kind !== "locked") return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (n >= status.until) {
        setStatus({ kind: "idle" });
        setPin("");
      }
    }, 1000);
    return () => clearInterval(t);
  }, [status]);

  async function submit(value: string) {
    setStatus({ kind: "checking" });
    try {
      const res = await fetch("/api/panitia/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pin: value }),
      });
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        remaining?: number;
        retryAfterSec?: number;
      };
      if (body.ok) {
        router.replace(next);
        router.refresh();
        return;
      }
      if (body.error === "wrong") setStatus({ kind: "wrong", remaining: body.remaining ?? 0 });
      else if (body.error === "locked") {
        setNow(Date.now());
        setStatus({ kind: "locked", until: Date.now() + (body.retryAfterSec ?? 300) * 1000 });
      } else if (body.error === "disabled") {
        setStatus({ kind: "error", message: "PIN acara belum diatur. Hubungi koordinator acara." });
      } else setStatus({ kind: "error", message: "Ada yang salah. Coba lagi ya." });
    } catch {
      setStatus({ kind: "error", message: "Sinyalnya lemah. Coba lagi ya." });
    }
  }

  function press(key: (typeof KEYS)[number]) {
    if (locked || status.kind === "checking") return;
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      if (wrong) setStatus({ kind: "idle" });
      return;
    }
    if (!key) return;
    // Setelah PIN salah, digit baru memulai ulang dari kosong.
    const base = wrong ? "" : pin;
    if (wrong) setStatus({ kind: "idle" });
    const nextPin = (base + key).slice(0, 6);
    setPin(nextPin);
    if (nextPin.length === 6) void submit(nextPin);
  }

  // Keyboard fisik (laptop panitia).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key as (typeof KEYS)[number]);
      else if (e.key === "Backspace") press("del");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const filled = wrong ? 6 : pin.length;

  return (
    <main className={styles.screen}>
      <div className={styles.brand}>
        <LogoMark />
        <Badge tone="crew">Panitia</Badge>
      </div>
      <div className={styles.heading}>
        <h1 className="t-title">Masuk ruang panitia</h1>
        <p className="t-body c-label-2">
          Masukkan 6 digit PIN acara dari koordinator. Tidak perlu akun.
        </p>
      </div>

      <div
        className={cx(styles.dots, locked && styles.dimmed)}
        role="status"
        aria-label={`${filled} dari 6 digit terisi`}
      >
        {Array.from({ length: 6 }, (_, i) => (
          <span
            key={i}
            className={cx(
              styles.dot,
              wrong && styles.dotError,
              !wrong && i === pin.length && styles.dotActive,
            )}
          >
            {i < filled && <span className={styles.fill} />}
          </span>
        ))}
      </div>

      {wrong && (
        <Banner tone="danger" icon={<WarningCircle />} title="PIN salah">
          Sisa {status.remaining} percobaan lagi sebelum dikunci 5 menit.
        </Banner>
      )}
      {locked && (
        <Banner
          tone="warning"
          icon={<LockKey />}
          title={`Terlalu banyak salah · coba lagi ${mmss((status.until - now) / 1000)}`}
        >
          Demi keamanan, masuk dikunci sementara. Lupa PIN? Tanya koordinator acara.
        </Banner>
      )}
      {status.kind === "error" && (
        <Banner tone="danger" icon={<WarningCircle />} title="Belum bisa masuk">
          {status.message}
        </Banner>
      )}

      <div className={cx(styles.keypad, locked && styles.disabled)} aria-disabled={locked}>
        {KEYS.map((k, i) =>
          k === "" ? (
            <span key={i} className={styles.keyBlank} />
          ) : (
            <button
              key={i}
              type="button"
              className={cx(styles.key, k === "del" && styles.keyPlain)}
              onClick={() => press(k)}
              disabled={locked}
              aria-label={k === "del" ? "Hapus digit" : k}
            >
              {k === "del" ? <Backspace size={26} /> : <span className="t-number-m">{k}</span>}
            </button>
          ),
        )}
      </div>
    </main>
  );
}
