"use client";

import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowClockwise, Timer, WifiSlash } from "@/components/icons";
import { Badge, Button, Sheet, TopToast } from "@/components/ui";
import { useServerNow } from "@/components/useServerNow";
import { cx } from "@/lib/cx";
import { hms, initials, timeWib } from "@/lib/format";
import { newPhotoId } from "@/lib/photo";
import { MAX_QUESTION, QUESTION_COUNTER_FROM, type QuestionPostResponse } from "@/lib/questions";
import { elapsedMs, type SessionView } from "@/lib/rundown";
import s from "./n1.module.css";

// N1 · sheet "Tanya pembicara" di atas BT21 (?sheet=tanya): BT08 kosong/ngetik · BT09 kartu
// Terkirim (cuma pertanyaan terakhir) · BT08b gagal kirim (TopToast + "Kirim lagi", teks tetap).
// Nggak ada antrean otomatis: draft + clientId disimpan di sessionStorage per token, "Kirim lagi"
// memakai clientId yang sama selama teksnya sama (server idempoten → nggak dobel).

const draftKey = (token: string) => `hmd-tanya:${token}`;
const SEND_TIMEOUT_MS = 8000;

type Draft = { text: string; clientId?: string; attempt?: string };
type Sent = { text: string; time: string };
type Failure = "offline" | "limit";

export type TanyaPreview = { text?: string; sent?: Sent; failed?: boolean };

// Draft tersimpan dibaca lewat useSyncExternalStore (server: null) → cocok saat hidrasi.
const noSubscribe = () => () => {};
function readRaw(token: string): string | null {
  try {
    return sessionStorage.getItem(draftKey(token));
  } catch {
    return null;
  }
}
function parseDraft(raw: string | null): Draft | null {
  try {
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function writeDraft(token: string, d: Draft) {
  try {
    if (d.text || d.clientId) sessionStorage.setItem(draftKey(token), JSON.stringify(d));
    else sessionStorage.removeItem(draftKey(token));
  } catch {}
}

export function TanyaSheet({
  token,
  session,
  serverNow,
  onClose,
  onEnded,
  preview,
}: {
  token: string;
  session: SessionView; // talkshow yang lagi jalan
  serverNow: string;
  onClose: () => void;
  onEnded: () => void; // 409 bukan-talkshow: sesi keburu selesai
  preview?: TanyaPreview; // /dev/states/n1: tanpa jaringan & storage
}) {
  const now = useServerNow(serverNow, { frozen: !!preview });
  const storedRaw = useSyncExternalStore(
    noSubscribe,
    () => (preview ? null : readRaw(token)),
    () => null,
  );
  const [edited, setDraft] = useState<Draft | null>(null);
  const draft = edited ?? parseDraft(storedRaw) ?? { text: preview?.text ?? "" };
  const [sent, setSent] = useState<Sent | null>(preview?.sent ?? null);
  const [failure, setFailure] = useState<Failure | null>(preview?.failed ? "offline" : null);
  const [busy, setBusy] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  // Kolom melebar ke bawah ikut isi.
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + el.offsetHeight - el.clientHeight}px`; // + border
  }, [draft.text]);

  const update = (d: Draft) => {
    setDraft(d);
    if (!preview) writeDraft(token, d);
  };

  const text = draft.text.trim();
  const empty = !text;
  const tooLong = text.length > MAX_QUESTION;

  async function send() {
    if (empty || tooLong || busy || preview) return;
    // Teks sama dengan percobaan sebelumnya → clientId sama (mungkin udah masuk server).
    const clientId = draft.clientId && draft.attempt === text ? draft.clientId : newPhotoId();
    const attempt: Draft = { text: draft.text, clientId, attempt: text };
    update(attempt);
    setBusy(true);
    try {
      const res = await fetch(`/api/t/${token}/tanya`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, text }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
      });
      const body = (await res.json().catch(() => null)) as QuestionPostResponse | null;
      if (body?.ok) {
        setSent({ text: body.question.text, time: timeWib(body.question.createdAt) });
        setFailure(null);
        update({ text: "" });
        return;
      }
      if (res.status === 409 && body?.error === "bukan-talkshow") {
        update({ text: draft.text }); // teks tetap aman kalau talkshow dimulai lagi
        onEnded();
        return;
      }
      setFailure(res.status === 429 ? "limit" : "offline");
    } catch {
      setFailure("offline");
    } finally {
      setBusy(false);
    }
  }

  const sp = session.speaker;
  const retry = failure !== null && !empty;
  return (
    <>
      <Sheet open onClose={onClose} title="Tanya pembicara" className={s.sheet}>
        {sp && (
          <div className={s.speaker}>
            <span aria-hidden className={s.avatar}>
              {initials(sp.name)}
            </span>
            <span className={s.speakerText}>
              <span className={cx("t-caption", s.eyebrow)}>
                {sp.label} · @{sp.ig}
              </span>
              <span className="t-headline">{sp.name}</span>
              {session.topic && <span className="t-label c-label-2">{session.topic}</span>}
            </span>
          </div>
        )}

        <div className={s.stopwatch}>
          <Timer size={18} aria-hidden />
          <span className="t-headline tabular" role="timer">
            {hms(elapsedMs(session, now))}
          </span>
          <span className="t-label c-label-3">udah jalan</span>
          <span className={cx("t-label c-label-3", s.range)}>
            {session.startsAt}–{session.endsAt}
          </span>
        </div>

        <hr className={s.rule} />

        <div className={s.ask}>
          <p className="t-headline" aria-hidden>
            Tanya pembicara
          </p>

          {sent && (
            <div className={s.sent} aria-live="polite">
              <Badge tone="success">Terkirim {sent.time}</Badge>
              <p className="t-body">{sent.text}</p>
              <p className="t-caption c-label-3">Langsung masuk ke daftar moderator</p>
            </div>
          )}

          <label className={s.field}>
            <span className="sr-only">Pertanyaan buat pembicara</span>
            <textarea
              ref={area}
              rows={1}
              value={draft.text}
              // BT09 "Ada pertanyaan lain?" (Figma); sebelum kirim pertama belum ada di Figma.
              placeholder={sent ? "Ada pertanyaan lain?" : "Tulis pertanyaanmu"}
              maxLength={MAX_QUESTION + 20}
              className={cx("t-body", s.input, draft.text && s.filled)}
              onChange={(e) => update({ ...draft, text: e.target.value })}
            />
            {text.length >= QUESTION_COUNTER_FROM && (
              <span className={cx("t-caption", s.counter, tooLong && s.over)}>
                {text.length}/{MAX_QUESTION}
              </span>
            )}
          </label>

          <Button onClick={send} aria-disabled={empty || tooLong || busy}>
            {busy ? "Mengirim…" : retry ? "Kirim lagi" : "Kirim"}
          </Button>
          <p className={cx("t-label c-label-2", s.caption)}>Bisa tanya lebih dari 1 kali</p>
        </div>
      </Sheet>

      {failure && (
        <TopToast
          icon={<WifiSlash size={20} />}
          title="Pertanyaanmu belum terkirim"
          action={{ label: "Kirim lagi", icon: <ArrowClockwise size={18} />, onClick: send }}
        >
          {failure === "limit"
            ? "Kebanyakan nanya barengan. Tunggu sebentar, terus tap Kirim lagi."
            : "Sinyal lagi putus. Teksnya aman, tinggal tap Kirim lagi."}
        </TopToast>
      )}
    </>
  );
}
