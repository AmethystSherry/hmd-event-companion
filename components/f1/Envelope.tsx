"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { Key } from "@/components/icons";
import { Button, Screen, ScreenHeader } from "@/components/ui";
import { cx } from "@/lib/cx";
import { firstName } from "@/lib/format";
import { MascotStage } from "./Mascot";
import styles from "./invite.module.css";

type Phase = "closed" | "opening" | "rising" | "done";

const OPEN_MS = 400; // flap kebuka
const RISE_MS = 500; // undangan naik keluar amplop
const FADE_MS = 200; // reduced motion

const storageKey = (token: string) => `hmd_env_open_${token}`;
const noop = () => () => {};

function seen(token: string): boolean {
  try {
    return !!localStorage.getItem(storageKey(token));
  } catch {
    return false;
  }
}

// T01a → T01: amplop cuma muncul di kunjungan pertama per token (localStorage). Tap segel atau
// "Buka undangan": flap kebuka → undangan (children, T01) naik keluar amplop. `preview` = selalu
// tampil & tidak menyimpan apa-apa (/dev/states/f1).
export function InviteGate({
  token,
  guestName,
  keyNo,
  preview,
  children,
}: {
  token: string;
  guestName: string;
  keyNo: string;
  preview?: boolean;
  children: ReactNode;
}) {
  const alreadyOpened = useSyncExternalStore(
    noop,
    () => !preview && seen(token),
    () => false,
  );
  const [phase, setPhase] = useState<Phase>("closed");
  const showEnvelope = !alreadyOpened && phase !== "done";

  const open = useCallback(() => {
    if (phase !== "closed") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finish = () => {
      setPhase("done");
      if (!preview) {
        try {
          localStorage.setItem(storageKey(token), "1");
        } catch {}
      }
    };
    if (reduced) {
      setPhase("rising");
      setTimeout(finish, FADE_MS);
      return;
    }
    setPhase("opening");
    setTimeout(() => setPhase("rising"), OPEN_MS);
    setTimeout(finish, OPEN_MS + RISE_MS);
  }, [phase, preview, token]);

  // Halaman di bawah amplop nggak ikut ke-scroll selama amplop masih tertutup.
  useEffect(() => {
    if (!showEnvelope) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [showEnvelope]);

  return (
    <>
      <div
        className={cx(phase === "rising" && styles.riseIn)}
        inert={showEnvelope && phase !== "rising" ? true : undefined}
      >
        {children}
      </div>
      {showEnvelope && (
        <div className={cx(styles.overlay, phase === "rising" && styles.overlayOut)}>
          <EnvelopeScreen guestName={guestName} keyNo={keyNo} phase={phase} onOpen={open} />
        </div>
      )}
    </>
  );
}

// T01a · Undangan · amplop tertutup (Figma 4920:28510).
export function EnvelopeScreen({
  guestName,
  keyNo,
  phase = "closed",
  onOpen,
}: {
  guestName: string;
  keyNo: string;
  phase?: Phase;
  onOpen?: () => void;
}) {
  return (
    <Screen
      tint
      bottomHeight={80}
      bottom={
        <>
          <Button icon={<Key />} onClick={onOpen}>
            Buka undangan
          </Button>
          <p className={`t-caption c-label-2 ${styles.caption}`}>atau tap segelnya</p>
        </>
      }
    >
      <ScreenHeader
        eyebrow="Undangan pribadi · House Moving Day"
        title={`Ada surat buat kamu, ${firstName(guestName)}.`}
      />
      <div className={styles.envStage}>
        <MascotStage pose="ngintip" sticker="Psst, ada undangan!" />
        <div className={cx(styles.envelope, phase !== "closed" && styles.opened)}>
          <span aria-hidden className={styles.envBody} />
          <svg aria-hidden className={styles.fold} viewBox="0 0 358 100" preserveAspectRatio="none">
            <path d="M0 100 L179 0 L358 100" />
          </svg>
          <svg aria-hidden className={styles.flap} viewBox="0 0 358 150" preserveAspectRatio="none">
            <path d="M1 1 H357 L179 149 Z" />
          </svg>
          <span aria-hidden className={cx(styles.pulse, styles.pulseOuter)} />
          <span aria-hidden className={cx(styles.pulse, styles.pulseInner)} />
          <button type="button" className={styles.seal} aria-label="Buka undangan" onClick={onOpen}>
            <Key size={34} />
          </button>
          <p className={`t-headline ${styles.to}`}>Untuk {guestName}</p>
          <p className={`t-caption c-label-2 ${styles.from}`}>
            No. {keyNo.replace("#", "")} · dari Potara Studio
          </p>
        </div>
      </div>
    </Screen>
  );
}
