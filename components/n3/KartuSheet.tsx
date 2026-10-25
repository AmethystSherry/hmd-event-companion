"use client";

import { useState } from "react";
import { WifiSlash } from "@/components/icons";
import { Button, Field, MyCard, Sheet, TopToast } from "@/components/ui";
import type { AcaraGuest } from "@/lib/acara";
import { ROLE_MAX, type KartuPostResponse } from "@/lib/card";
import type { GuestCard } from "@/lib/data/types";
import { InterestChips } from "./InterestChips";
import styles from "./n3.module.css";

// N3 · T11 Kartu kamu (ubah) / T11e (masih kosong): sheet di layar acara (?sheet=kartu). Live
// preview MyCard ikut ketikan. Prefill dari kartu sekarang (cardOf); tutup tanpa simpan = dibuang
// (Temuan T4). Simpan → POST /api/t/[token]/kartu → onSaved (T11s, balik ke BT05 + toast).
// Gagal / offline (Temuan T6): isian tetap, tombol "Simpan lagi" + TopToast; nggak diantre.
// Acara keburu ditutup (409) → onEventClosed (redirect BT12 yang udah ada).

const SAVE_TIMEOUT_MS = 8000;

export type KartuPreview = { failed?: boolean };

export function KartuSheet({
  token,
  me,
  onClose,
  onSaved,
  onEventClosed,
  preview,
}: {
  token: string;
  me: AcaraGuest & { keyNo: number };
  onClose: () => void;
  onSaved: (card: GuestCard) => void;
  onEventClosed: () => void;
  preview?: KartuPreview; // /dev/states/n3: tanpa jaringan
}) {
  const [role, setRole] = useState(me.role ?? "");
  const [askAbout, setAskAbout] = useState(me.askAbout);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(!!preview?.failed);

  async function save() {
    if (busy || preview) return;
    setBusy(true);
    try {
      if (!navigator.onLine) throw new Error("offline");
      const res = await fetch(`/api/t/${token}/kartu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: role.trim() || null, askAbout }),
        signal: AbortSignal.timeout(SAVE_TIMEOUT_MS),
      });
      const body = (await res.json().catch(() => null)) as KartuPostResponse | null;
      if (body?.ok) {
        setFailed(false);
        onSaved(body.card);
        return;
      }
      if (res.status === 409 && body?.error === "acara-selesai") return onEventClosed();
      setFailed(true);
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Sheet open onClose={onClose} title="Kartu kamu" strong className={styles.sheet}>
        <p aria-hidden className="t-card-title">
          Kartu kamu
        </p>
        <MyCard
          name={me.name}
          ig={me.ig}
          keyNo={me.keyNo}
          role={role.trim() || null}
          askAbout={askAbout}
        />
        <Field
          label="Pekerjaan (opsional)"
          placeholder="Mis. Product designer"
          maxLength={ROLE_MAX}
          autoComplete="organization-title"
          enterKeyHint="done"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className={styles.field}
        />
        <InterestChips value={askAbout} onChange={setAskAbout} />
        <Button onClick={save} disabled={busy} aria-busy={busy || undefined}>
          {busy ? "Menyimpan…" : failed ? "Simpan lagi" : "Simpan kartu"}
        </Button>
      </Sheet>
      {failed && (
        <TopToast icon={<WifiSlash size={20} />} title="Kartu kamu belum kesimpan">
          Sinyal lagi putus. Isiannya aman, tinggal tap Simpan lagi.
        </TopToast>
      )}
    </>
  );
}
