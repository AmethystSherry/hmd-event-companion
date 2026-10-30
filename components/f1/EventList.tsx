"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { CalendarBlank, CaretRight, ListBullets, Plus, Trash, Users } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  Field,
  HeroState,
  LogoMark,
  Pill,
  Screen,
  Sheet,
  SwipeRow,
  Toast,
} from "@/components/ui";
import type { FormResult } from "@/app/panitia/actions";
import { eventCountLabel } from "@/lib/view";
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

// PE01 Daftar event · PE01a belum ada event · PE02 sheet Buat event (nama + tanggal).
// Header v5.1 (26 Okt): LogoMark + Badge "Panitia" | Keluar, lalu "Daftar event" + "{n} event".
// (30 Okt) Hapus event: geser kartu ke kiri → panel Hapus (SwipeRow, pola P04s) → kartu langsung
// hilang + Toast "{nama} dihapus" Batalkan 5 dtk; hapus di server baru jalan saat toast habis, hapus
// berikutnya, atau halaman ditinggal (pagehide). Hapus = berantai (tamu, rundown, foto, buku tamu).
export function EventList({
  events,
  logout,
  create,
  remove,
  initialSwiped,
  initialSheet = false,
  initialDraft = { name: "", date: "" },
}: {
  events: EventCardData[];
  logout?: () => Promise<void>;
  create?: (input: { name: string; date: string }) => Promise<FormResult>;
  remove?: (eventId: string) => Promise<void>;
  initialSwiped?: string; // pratinjau PE01s: kartu dengan panel Hapus terbuka
  initialSheet?: boolean;
  initialDraft?: { name: string; date: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initialSheet);
  const [draft, setDraft] = useState(initialDraft);
  const [error, setError] = useState<{ field?: string; error: string } | null>(null);
  const [pending, start] = useTransition();
  const ready = draft.name.trim() && draft.date;

  // ---- Hapus + Batalkan ----
  const [hidden, setHidden] = useState<string[]>([]);
  const [toast, setToast] = useState<{ id: string; name: string } | null>(null);
  const pendingDelete = useRef<string | null>(null);
  const removeRef = useRef(remove);
  useEffect(() => {
    removeRef.current = remove;
  });
  const commitDelete = (id: string | null = pendingDelete.current) => {
    if (!id || pendingDelete.current !== id) return;
    pendingDelete.current = null;
    void removeRef.current?.(id);
  };
  useEffect(() => {
    const flush = () => commitDelete();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, []);
  const removeCard = (e: EventCardData) => {
    commitDelete();
    pendingDelete.current = e.id;
    setHidden((h) => [...h, e.id]);
    setToast({ id: e.id, name: e.name });
  };
  const shown = events.filter((e) => !hidden.includes(e.id));

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
        <span className={f1.rowTight}>
          <LogoMark size={32} />
          <Badge tone="crew">Panitia</Badge>
        </span>
        <form action={logout}>
          <Button size="sm" variant="secondary" type="submit">
            Keluar
          </Button>
        </form>
      </div>
      <header className={styles.listHead}>
        <h1 className="t-title">Daftar event</h1>
        <p className="t-label c-label-2">{eventCountLabel(shown.length)}</p>
      </header>
      {shown.length === 0 ? (
        <HeroState icon={<CalendarBlank size={30} />} title="Belum ada event">
          Bikin event pertama dulu, nanti rundown sama daftar tamunya bisa diisi pelan-pelan.
        </HeroState>
      ) : (
        <>
          {shown.map((e) => {
            const draftEvent = e.guests === 0 && e.sessions === 0;
            return (
              <SwipeRow
                key={e.id}
                className={styles.eventSwipe}
                deleteLabel={`Hapus ${e.name}`}
                initialOpen={initialSwiped === e.id}
                onDelete={remove ? () => removeCard(e) : undefined}
              >
                <Link href={`/panitia/event/${e.id}`} className={styles.cardLink}>
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
                      <Pill icon={<Users />}>
                        {e.guests ? `${e.guests} tamu` : "Belum ada tamu"}
                      </Pill>
                      <Pill icon={<ListBullets />}>
                        {e.sessions ? `Rundown ${e.sessions} sesi` : "Rundown kosong"}
                      </Pill>
                    </div>
                  </Card>
                </Link>
              </SwipeRow>
            );
          })}
        </>
      )}

      {toast && (
        <div className={f1.toastDock}>
          <Toast
            key={toast.id}
            icon={<Trash />}
            undo={{
              onUndo: () => {
                pendingDelete.current = null;
                setHidden((h) => h.filter((id) => id !== toast.id));
                setToast(null);
              },
              onExpire: () => {
                commitDelete(toast.id);
                setToast(null);
              },
            }}
          >
            {toast.name} dihapus
          </Toast>
        </div>
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
