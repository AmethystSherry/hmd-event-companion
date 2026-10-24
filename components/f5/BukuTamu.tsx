"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowClockwise, CaretLeft, PaperPlaneTilt, WifiSlash } from "@/components/icons";
import {
  Banner,
  Button,
  Card,
  CardLabel,
  Chip,
  Field,
  IconButton,
  Screen,
  ScreenHeader,
  Segmented,
  StarRating,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import { MAX_IMPROVE, type FeedbackPostResponse } from "@/lib/feedback";
import { newPhotoId } from "@/lib/photo";
import s from "./f5.module.css";

// T14 · Buku tamu (±1 menit) + T14b gagal kirim + T14c rating belum diisi. T14d (udah pernah
// isi) = /kolase?isi=1. Isian disimpan di localStorage per token tiap berubah; clientId ikut
// disimpan supaya kirim ulang (sinyal putus, tombol "Coba lagi", event online) nggak dobel.

export type BukuTamuDraft = {
  clientId: string;
  rating: number;
  highlight: string | null;
  improve: string;
  invite: "mau" | "nanti" | null; // belum dipilih = null (keputusan F5)
};

const SEND_TIMEOUT_MS = 5000;
const draftKey = (token: string) => `hmd-buku-tamu:${token}`;

function loadDraft(token: string): BukuTamuDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(token));
    return raw ? (JSON.parse(raw) as BukuTamuDraft) : null;
  } catch {
    return null;
  }
}

function saveDraft(token: string, draft: BukuTamuDraft | null) {
  try {
    if (draft) localStorage.setItem(draftKey(token), JSON.stringify(draft));
    else localStorage.removeItem(draftKey(token));
  } catch {
    // mode privat / penyimpanan penuh: isian tetap ada selama halaman terbuka
  }
}

const EMPTY: BukuTamuDraft = {
  clientId: "",
  rating: 0,
  highlight: null,
  improve: "",
  invite: null,
};

export function BukuTamuScreen({
  token,
  sessions,
  backHref,
  kolaseHref,
  preview,
}: {
  token: string | null; // null = pratinjau /dev/states (tanpa kirim)
  sessions: { id: string; title: string }[];
  backHref: string;
  kolaseHref: string;
  preview?: { draft?: Partial<BukuTamuDraft>; failed?: boolean; hint?: boolean };
}) {
  const router = useRouter();
  const hintId = useId();
  const stars = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<BukuTamuDraft>({ ...EMPTY, ...preview?.draft });
  const [status, setStatus] = useState<"idle" | "sending" | "error">(
    preview?.failed ? "error" : "idle",
  );
  const [hint, setHint] = useState(!!preview?.hint);
  const loaded = useRef(false);

  // Draft lama (mis. gagal kirim lalu halaman ditutup) dimuat setelah hidrasi.
  useEffect(() => {
    if (!token || preview) return;
    const saved = loadDraft(token);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage cuma ada di HP
    setDraft(saved?.clientId ? saved : { ...EMPTY, ...saved, clientId: newPhotoId() });
    loaded.current = true;
  }, [token, preview]);

  const update = (patch: Partial<BukuTamuDraft>) => {
    setDraft((d) => {
      const next = { ...d, ...patch };
      if (token && loaded.current) saveDraft(token, next);
      return next;
    });
    if (patch.rating) setHint(false);
  };

  const send = useCallback(async () => {
    if (!token || preview) return;
    setStatus("sending");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), SEND_TIMEOUT_MS);
    try {
      const res = await fetch(`/api/t/${token}/buku-tamu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: draft.clientId,
          rating: draft.rating,
          highlightSessionId: draft.highlight,
          improve: draft.improve.trim() || null,
          inviteAgain: draft.invite === null ? null : draft.invite === "mau",
        }),
        signal: ctrl.signal,
      });
      const body = (await res.json()) as FeedbackPostResponse;
      if (body.ok) {
        saveDraft(token, null);
        router.replace(body.status === "sudah-isi" ? `${kolaseHref}?isi=1` : kolaseHref);
        return;
      }
    } catch {
      // offline / timeout → T14b
    } finally {
      clearTimeout(timer);
    }
    setStatus("error");
  }, [token, preview, draft, router, kolaseHref]);

  // T14b: coba lagi otomatis begitu sinyal balik.
  useEffect(() => {
    if (status !== "error") return;
    const retry = () => void send();
    window.addEventListener("online", retry);
    return () => window.removeEventListener("online", retry);
  }, [status, send]);

  function onSubmit() {
    if (status === "sending") return;
    if (!draft.rating) {
      setHint(true);
      stars.current?.querySelector<HTMLElement>("[role=radio]")?.focus();
      return;
    }
    void send();
  }

  const failed = status === "error";
  return (
    <Screen
      withBack
      bottom={
        <Button
          icon={failed ? <ArrowClockwise /> : <PaperPlaneTilt />}
          aria-disabled={!draft.rating || status === "sending" || undefined}
          aria-busy={status === "sending" || undefined}
          onClick={onSubmit}
        >
          {failed ? "Coba lagi" : "Kirim ke buku tamu"}
        </Button>
      }
    >
      <ScreenHeader
        leading={<IconButton href={backHref} label="Kembali" icon={<CaretLeft />} />}
        eyebrow="±1 menit"
        title="Gimana rasanya mampir?"
      />
      {failed && (
        <Banner tone="danger" icon={<WifiSlash />} title="Gagal kirim, sinyalnya lemah">
          Jawabanmu tetap tersimpan. Coba lagi ya.
        </Banner>
      )}
      <Card>
        <CardLabel>Nilai acaranya</CardLabel>
        <StarRating
          ref={stars}
          label="Nilai acaranya"
          value={draft.rating}
          onChange={(rating) => update({ rating })}
          invalid={hint}
          describedBy={hint ? hintId : undefined}
        />
        {hint && (
          <p id={hintId} className={cx("t-label", s.hint)} role="alert">
            Kasih bintang dulu ya, rating wajib diisi
          </p>
        )}
      </Card>
      <Card>
        <CardLabel>Bagian paling seru</CardLabel>
        <div className={s.chips}>
          {sessions.map((x) => (
            <Chip
              key={x.id}
              selected={draft.highlight === x.id}
              onClick={() => update({ highlight: draft.highlight === x.id ? null : x.id })}
            >
              {x.title}
            </Chip>
          ))}
        </div>
      </Card>
      <Card>
        <Field
          multiline
          label="Satu hal yang bisa kami perbaiki"
          placeholder="Tulis di sini (opsional)"
          rows={3}
          maxLength={MAX_IMPROVE}
          value={draft.improve}
          onChange={(e) => update({ improve: e.target.value })}
        />
      </Card>
      <Card>
        <CardLabel>Mau diundang lagi?</CardLabel>
        <Segmented
          label="Mau diundang lagi?"
          options={[
            { value: "mau", label: "Mau dong" },
            { value: "nanti", label: "Nanti dulu" },
          ]}
          value={draft.invite}
          onChange={(invite) => update({ invite })}
        />
      </Card>
    </Screen>
  );
}
