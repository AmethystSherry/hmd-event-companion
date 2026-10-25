"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useOptimistic, useState } from "react";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  CaretLeft,
  ChatCircle,
  Check,
  Info,
} from "@/components/icons";
import { Badge, Button, Card, HeroState, IconButton, Screen, Toast } from "@/components/ui";
import type { FormResult } from "@/app/panitia/actions";
import { cx } from "@/lib/cx";
import { toggleAnswered, type QuestionRow, type QuestionsView } from "@/lib/questions";
import s from "./n1.module.css";

// N1 · P10 Pertanyaan (moderator) / P10c kosong. Daftar mentah talkshow, terbaru di atas, tanpa
// dikelompokkan. ✓ / ↺ optimistic (useOptimistic: gagal → balik sendiri + toast); data baru dari
// HP tamu & moderator lain lewat LiveRefresh di page. ↻ = router.refresh() manual (T6).
export function PertanyaanScreen({
  eventId,
  view,
  startsAt,
  phaseLabel,
  mark,
}: {
  eventId: string;
  view: QuestionsView;
  startsAt: string | null; // jam mulai talkshow (subjudul P10c)
  phaseLabel: string; // "Hari-H · Live"
  mark?: (eventId: string, questionId: string, answered: boolean) => Promise<FormResult>;
}) {
  const router = useRouter();
  const [shown, apply] = useOptimistic(view, (v, op: { id: string; at: string | null }) =>
    toggleAnswered(v, op.id, op.at),
  );
  const [error, setError] = useState<{ key: number; text: string } | null>(null);
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 4000);
    return () => clearTimeout(t);
  }, [error]);

  const toggle = (id: string, answered: boolean) => {
    if (!mark) return;
    startTransition(async () => {
      apply({ id, at: answered ? new Date().toISOString() : null });
      const r = await mark(eventId, id, answered).catch(() => null);
      if (!r?.ok) {
        setError({
          key: Date.now(),
          text: r && !r.ok ? r.error : "Gagal nyimpen, cek sinyal terus coba lagi",
        });
      }
    });
  };

  const subtitle = shown.total
    ? `Talkshow · ${shown.total} masuk · ${shown.answeredCount} udah dijawab`
    : `Talkshow · 0 masuk${startsAt ? ` · mulai ${startsAt}` : ""}`;

  return (
    <Screen withBack>
      <div className={s.toolbar}>
        <IconButton
          href={`/panitia/event/${eventId}/kontrol`}
          label="Kembali ke Kontrol acara"
          icon={<CaretLeft />}
        />
        <Badge tone="crew" pulse>
          {phaseLabel}
        </Badge>
      </div>
      <header className={s.head}>
        <div className={s.headText}>
          <p className="t-label c-label-2">{subtitle}</p>
          <h1 className="t-title">Pertanyaan</h1>
        </div>
        <IconButton
          label="Muat ulang"
          icon={<ArrowClockwise size={20} />}
          onClick={() => startTransition(() => router.refresh())}
        />
      </header>

      {shown.total === 0 ? (
        <div className={s.empty}>
          <HeroState icon={<ChatCircle />} title="Belum ada yang nanya">
            Pertanyaan tamu muncul di sini begitu dikirim. Ingetin MC buat ngajak tamu nanya lewat
            HP.
          </HeroState>
        </div>
      ) : (
        <>
          {shown.open.length > 0 && (
            <Card className={s.list}>
              <p className="t-label c-label-2">
                Belum dijawab · {shown.open.length} · terbaru dulu
              </p>
              {shown.open.map((q) => (
                <Row key={q.id} q={q} onToggle={() => toggle(q.id, true)} />
              ))}
            </Card>
          )}
          {shown.answered.length > 0 && (
            <Card className={s.list}>
              <p className="t-label c-label-2">Udah dijawab · {shown.answered.length}</p>
              {shown.answered.map((q) => (
                <Row key={q.id} q={q} done onToggle={() => toggle(q.id, false)} />
              ))}
            </Card>
          )}
        </>
      )}

      {error && (
        <div className={s.toastDock}>
          <Toast key={error.key} icon={<Info />}>
            {error.text}
          </Toast>
        </div>
      )}
    </Screen>
  );
}

function Row({ q, done, onToggle }: { q: QuestionRow; done?: boolean; onToggle: () => void }) {
  return (
    <div className={s.row}>
      <div className={cx(s.rowText, done && s.done)}>
        <p className="t-body">{q.text}</p>
        <p className="t-caption c-label-2">
          {q.name} · {q.time}
          {done && " · dijawab"}
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        iconOnly
        label={done ? "Batalkan dijawab" : "Tandai dijawab"}
        icon={done ? <ArrowCounterClockwise /> : <Check />}
        onClick={onToggle}
      />
    </div>
  );
}
