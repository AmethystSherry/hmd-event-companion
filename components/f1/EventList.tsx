"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CalendarBlank, CaretRight, ListBullets, Plus, Users } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  Field,
  HeroState,
  Pill,
  Screen,
  ScreenHeader,
  Sheet,
} from "@/components/ui";
import type { FormResult } from "@/app/panitia/actions";
import f1 from "./f1.module.css";
import styles from "./panitia.module.css";

export type EventCardData = {
  id: string;
  name: string;
  dateLabel: string; // "Minggu, 8 Nov 2026"
  phase: { label: string; tone: "crew" | "live" | "neutral" };
  guests: number;
  sessions: number;
};

// PE01 Event kamu · PE01a belum ada event · PE02 sheet Buat event (nama + tanggal).
export function EventList({
  events,
  logout,
  create,
  initialSheet = false,
  initialDraft = { name: "", date: "" },
}: {
  events: EventCardData[];
  logout?: () => Promise<void>;
  create?: (input: { name: string; date: string }) => Promise<FormResult>;
  initialSheet?: boolean;
  initialDraft?: { name: string; date: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initialSheet);
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState<{ field?: string; error: string } | null>(null);
  const [pending, start] = useTransition();
  const ready = draft.name.trim() && draft.date;

  const submit = () => {
    if (!create || !ready) return;
    start(async () => {
      const res = await create(draft);
      if (!res.ok) return setError(res);
      setOpen(false);
      setDraft({ name: "", date: "" });
      if (res.id) router.push(`/panitia/event/${res.id}`);
    });
  };

  return (
    <Screen
      bottom={
        <Button icon={<Plus />} onClick={() => setOpen(true)}>
          Buat event
        </Button>
      }
    >
      <div className={f1.topBar}>
        <span />
        <form action={logout}>
          <Button size="sm" variant="secondary" type="submit">
            Keluar
          </Button>
        </form>
      </div>
      <ScreenHeader eyebrow="Panitia · Potara Studio" title="Event kamu" />
      {events.length === 0 ? (
        <HeroState icon={<CalendarBlank size={30} />} title="Belum ada event">
          Bikin event pertama dulu, nanti rundown sama daftar tamunya bisa diisi pelan-pelan.
        </HeroState>
      ) : (
        <>
          <p className="t-label c-label-2">{events.length} event</p>
          {events.map((e) => {
            const draftEvent = e.guests === 0 && e.sessions === 0;
            return (
              <Link key={e.id} href={`/panitia/event/${e.id}`} className={styles.cardLink}>
                <Card className={styles.eventCard}>
                  <div className={f1.between}>
                    {draftEvent ? (
                      <Badge tone="neutral">Draft</Badge>
                    ) : (
                      <Badge tone={e.phase.tone}>{e.phase.label}</Badge>
                    )}
                    <CaretRight size={16} className="c-label-3" />
                  </div>
                  <p className="t-card-title">{e.name}</p>
                  <p className={`t-label c-label-2 ${f1.rowTight}`}>
                    <CalendarBlank size={16} />
                    {e.dateLabel}
                  </p>
                  <div className={f1.pills}>
                    <Pill icon={<Users />}>{e.guests ? `${e.guests} tamu` : "Belum ada tamu"}</Pill>
                    <Pill icon={<ListBullets />}>
                      {e.sessions ? `Rundown ${e.sessions} sesi` : "Rundown kosong"}
                    </Pill>
                  </div>
                </Card>
              </Link>
            );
          })}
        </>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="Buat event baru">
        <div className={f1.sheetBody}>
          <div className={f1.sheetHead}>
            <p className="t-card-title">Buat event baru</p>
            <p className="t-label c-label-2">
              Cukup nama sama tanggal dulu. Rundown dan tamu bisa diisi nanti.
            </p>
          </div>
          <Field
            label="Nama event"
            value={draft.name}
            placeholder="House Moving Day"
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            error={error?.field === "name" ? error.error : undefined}
          />
          <Field
            label="Tanggal"
            type="date"
            value={draft.date}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
            error={error?.field === "date" ? error.error : undefined}
          />
          <div className={f1.sheetActions}>
            <Button disabled={!ready || pending} onClick={submit}>
              Buat event
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
