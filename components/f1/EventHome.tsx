"use client";

import { useState, useTransition } from "react";
import {
  CalendarBlank,
  CaretLeft,
  Info,
  ListBullets,
  Plus,
  UploadSimple,
  Users,
} from "@/components/icons";
import {
  Badge,
  Banner,
  Button,
  Card,
  Field,
  IconButton,
  Screen,
  ScreenHeader,
  Sheet,
} from "@/components/ui";
import type { FormResult } from "@/app/panitia/actions";
import { cx } from "@/lib/cx";
import type { Event, GuestStats, Session } from "@/lib/data/types";
import { dateLong, eventPhase, fromMinutes, toMinutes } from "@/lib/format";
import f1 from "./f1.module.css";
import styles from "./panitia.module.css";

type SheetState = "edit" | "delete" | null;

// PE03 Home event (kosong) · PE03b udah terisi · PE03e sheet Ubah detail event ·
// PE03h sheet konfirmasi Hapus event. "Buka Kontrol acara" baru aktif kalau detail, tamu, dan
// rundown terisi; hari-H halaman ini otomatis jadi Kontrol acara (F3).
export function EventHome({
  event,
  stats,
  sessions,
  now,
  update,
  remove,
  initialSheet = null,
}: {
  event: Event;
  stats: GuestStats;
  sessions: Session[];
  now: string;
  update?: (eventId: string, input: { name: string; date: string }) => Promise<FormResult>;
  remove?: (eventId: string) => Promise<void>;
  initialSheet?: SheetState;
}) {
  const [sheet, setSheet] = useState<SheetState>(initialSheet);
  const [draft, setDraft] = useState({ name: event.name, date: event.date });
  const [error, setError] = useState<{ field?: string; error: string } | null>(null);
  const [pending, start] = useTransition();

  const base = `/panitia/event/${event.id}`;
  const hasGuests = stats.total > 0;
  const hasSessions = sessions.length > 0;
  const ready = 1 + Number(hasGuests) + Number(hasSessions);
  const allReady = ready === 3;
  const last = sessions.at(-1);
  const range = last
    ? `${sessions[0].startsAt}–${fromMinutes(toMinutes(last.startsAt) + last.durationMin)}`
    : "";
  const phase = eventPhase(event.date, new Date(now));

  const openEdit = () => {
    setDraft({ name: event.name, date: event.date });
    setError(null);
    setSheet("edit");
  };
  const save = () => {
    if (!update) return;
    start(async () => {
      const res = await update(event.id, draft);
      if (res.ok) setSheet(null);
      else setError(res);
    });
  };
  const confirmDelete = () => {
    if (!remove) return;
    start(() => remove(event.id));
  };

  return (
    <Screen
      withBack
      bottomHeight={100}
      bottom={
        <>
          <p className={`t-label c-label-2 ${f1.caption}`}>
            {allReady
              ? "Semua siap. Pas hari-H halaman ini otomatis jadi Kontrol acara."
              : "Lengkapi detail, tamu & undangan, dan rundown dulu biar bisa buka Kontrol acara."}
          </p>
          {allReady ? (
            <Button href={`${base}/kontrol`}>Buka Kontrol acara</Button>
          ) : (
            <Button disabled aria-disabled="true">
              Buka Kontrol acara
            </Button>
          )}
        </>
      }
    >
      <ScreenHeader
        leading={
          <div className={f1.topBar}>
            <IconButton href="/panitia" label="Kembali ke Daftar event" icon={<CaretLeft />} />
            <Badge tone={phase.tone}>{phase.label}</Badge>
          </div>
        }
        eyebrow={`${dateLong(event.date)} · ${event.startsAt}`}
        title={event.name}
      />
      {!allReady && (
        <Banner tone="warning" icon={<Info />} title={`${ready} dari 3 siap.`}>
          Isi tamu &amp; rundown biar bisa mulai undang.
        </Banner>
      )}

      <Card>
        <div className={styles.homeHead}>
          <span className={cx(f1.iconBox, f1.iconBoxInk)}>
            <CalendarBlank size={20} />
          </span>
          <div className={styles.grow}>
            <p className="t-body-emph">Detail event</p>
            <p className={`t-label ${f1.green}`}>
              {allReady ? dateLong(event.date) : "Nama & tanggal udah diisi"}
            </p>
          </div>
          <Button size="sm" variant="secondary" onClick={openEdit}>
            Edit
          </Button>
        </div>
      </Card>

      <Card>
        <div className={styles.homeHead}>
          <span className={cx(f1.iconBox, hasGuests && f1.iconBoxInk)}>
            <Users size={20} />
          </span>
          <div className={styles.grow}>
            <p className="t-body-emph">Tamu &amp; undangan</p>
            {hasGuests ? (
              <p className={`t-label ${f1.green}`}>
                {stats.total} tamu · {stats.invited} diundang
              </p>
            ) : (
              <p className="t-label c-label-2">Belum ada tamu</p>
            )}
          </div>
          {hasGuests ? (
            <Button size="sm" variant="secondary" href={`${base}/tamu`}>
              Buka
            </Button>
          ) : (
            <Button size="sm" href={`${base}/tamu`} icon={<UploadSimple />}>
              Unggah CSV
            </Button>
          )}
        </div>
        {hasGuests ? (
          <div className={styles.badges}>
            <Badge tone="success">{stats.hadir} hadir</Badge>
            <Badge tone="danger">{stats.nggak} nggak bisa</Badge>
            <Badge tone="crew">{stats.belumJawab} belum jawab</Badge>
            <Badge tone="neutral">{stats.notInvited} belum diundang</Badge>
          </div>
        ) : (
          <p className="t-label c-label-2">
            Unggah CSV sekali di awal. Habis itu undang lewat DM IG, tambah atau edit tamu manual.
          </p>
        )}
      </Card>

      <Card>
        <div className={styles.homeHead}>
          <span className={cx(f1.iconBox, hasSessions && f1.iconBoxInk)}>
            <ListBullets size={20} />
          </span>
          <div className={styles.grow}>
            <p className="t-body-emph">Rundown</p>
            {hasSessions ? (
              <p className={`t-label ${f1.green}`}>
                {sessions.length} sesi · {range}
              </p>
            ) : (
              <p className="t-label c-label-2">Belum ada sesi</p>
            )}
          </div>
          {hasSessions ? (
            <Button size="sm" variant="secondary" href={`${base}/rundown`}>
              Edit
            </Button>
          ) : (
            <Button size="sm" href={`${base}/rundown`} icon={<Plus />}>
              Tambah
            </Button>
          )}
        </div>
        {hasSessions ? (
          <div className={styles.miniRundown}>
            {sessions.map((s) => (
              <p key={s.id} className="t-label">
                <span className="c-label-2 tabular">{s.startsAt}</span>
                <span>{s.title}</span>
              </p>
            ))}
          </div>
        ) : (
          <p className="t-label c-label-2">Tambah bagian acara, jam, tipe sesi, dan PIC.</p>
        )}
      </Card>

      <Sheet open={sheet === "edit"} onClose={() => setSheet(null)} title="Ubah detail event">
        <div className={f1.sheetBody}>
          <div className={f1.sheetHead}>
            <p className="t-card-title">Ubah detail event</p>
            <p className="t-label c-label-2">
              Ganti nama atau tanggal. Tamu dan rundown nggak berubah.
            </p>
          </div>
          <Field
            label="Nama event"
            value={draft.name}
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
            <Button disabled={!draft.name.trim() || !draft.date || pending} onClick={save}>
              Simpan perubahan
            </Button>
            <Button variant="secondary" onClick={() => setSheet(null)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => setSheet("delete")}>
              Hapus event
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet
        open={sheet === "delete"}
        onClose={() => setSheet(null)}
        title={`Hapus ${event.name}?`}
      >
        <div className={f1.sheetBody}>
          <div className={f1.sheetHead}>
            <p className="t-card-title">Hapus {event.name}?</p>
            <p className="t-label c-label-2">
              Daftar tamu, status undangan, dan rundown ikut kehapus. Ini nggak bisa dibalikin.
            </p>
          </div>
          <div className={f1.sheetActions}>
            <Button variant="destructive" disabled={pending} onClick={confirmDelete}>
              Ya, hapus event
            </Button>
            <Button variant="secondary" disabled={pending} onClick={() => setSheet(null)}>
              Batal
            </Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
