"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { preload } from "react-dom";
import { HandWaving } from "@/components/icons";
import { Button, Pill, Screen } from "@/components/ui";
import { cx } from "@/lib/cx";
import { firstName } from "@/lib/format";
import styles from "./invite.module.css";

type Phase = "closed" | "opening" | "rising" | "done";

const PRESS_MS = 150; // segel mengecil + pudar
const RISE_MS = 400; // amplop memudar, undangan naik 24px
const FADE_MS = 200; // reduced motion

const ART = "/figma/t01a-invitation-closed.webp";
const ART_SET = `${ART} 2x, /figma/t01a-invitation-closed@3x.webp 3x`;

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
// "Buka undangan": segel mengecil → amplop memudar, undangan (children, T01) naik. `preview` =
// selalu tampil & tidak menyimpan apa-apa (/dev/states/f1).
export function InviteGate({
  token,
  guestName,
  preview,
  children,
}: {
  token: string;
  guestName: string;
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
    setTimeout(() => setPhase("rising"), PRESS_MS);
    setTimeout(finish, PRESS_MS + RISE_MS);
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
          <EnvelopeScreen guestName={guestName} phase={phase} onOpen={open} />
        </div>
      )}
    </>
  );
}

// T01a · Undangan · amplop tertutup (Figma 4968:27876). Segel lilin di ilustrasi = tombol.
export function EnvelopeScreen({
  guestName,
  phase = "closed",
  onOpen,
}: {
  guestName: string;
  phase?: Phase;
  onOpen?: () => void;
}) {
  preload(ART, { as: "image", imageSrcSet: ART_SET });
  return (
    <Screen bottom={<Button onClick={onOpen}>Buka undangan</Button>} className={styles.bleed}>
      <div className={styles.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustrasi statis dari Figma */}
        <img src={ART} srcSet={ART_SET} alt="" aria-hidden className={styles.art} />
        <span aria-hidden className={styles.artFade} />
        <button
          type="button"
          className={cx(styles.seal, phase !== "closed" && styles.sealPressed)}
          aria-label="Buka undangan"
          onClick={onOpen}
        >
          <span aria-hidden className={cx(styles.ring, styles.ringOuter)} />
          <span aria-hidden className={cx(styles.ring, styles.ringInner)} />
        </button>
        <Pill icon={<HandWaving />} className={styles.tapHint}>
          Tap segelnya
        </Pill>
      </div>
      <div className={styles.envText}>
        <p className="t-label c-label-2">Undangan pribadi · House Moving Day</p>
        <h1 className="t-card-title">Ada surat buat kamu, {firstName(guestName)}.</h1>
        <p className="t-body c-label-2">
          Potara pindah rumah, dan kamu salah satu tamu pertamanya.
        </p>
      </div>
    </Screen>
  );
}
