"use client";

import { useState, useTransition } from "react";
import { CaretLeft, Check, ListBullets, Plus } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardLabel,
  Field,
  HeroState,
  IconButton,
  NumberedRow,
  Screen,
  ScreenHeader,
  Segmented,
  Sheet,
} from "@/components/ui";
import type { FormResult, SessionForm } from "@/app/panitia/actions";
import type { Session, SessionType } from "@/lib/data/types";
import f1 from "./f1.module.css";
import styles from "./panitia.module.css";

const EMPTY: SessionForm = { title: "", startsAt: "", durationMin: 45, type: "info", pic: "" };

// PE04k belum ada sesi · PE04 atur sesi (urut jam mulai) · PE04a sheet ubah / hapus sesi.
export function Rundown({
  eventId,
  eventName,
  sessions,
  save,
  remove,
  initialEditing = null,
}: {
  eventId: string;
  eventName: string;
  sessions: Session[];
  save?: (eventId: string, sessionId: string | null, input: SessionForm) => Promise<FormResult>;
  remove?: (sessionId: string) => Promise<FormResult>;
  initialEditing?: string | "new" | null; // id sesi, "new", atau tertutup
}) {
  const [editing, setEditing] = useState(initialEditing);
  const editingSession = sessions.find((s) => s.id === editing) ?? null;
  const [form, setForm] = useState<SessionForm>(() =>
    editingSession ? toForm(editingSession) : EMPTY,
  );
  const [error, setError] = useState<{ field?: string; error: string } | null>(null);
  const [pending, start] = useTransition();

  const open = (s: Session | null) => {
    setForm(s ? toForm(s) : EMPTY);
    setError(null);
    setEditing(s ? s.id : "new");
  };
  const close = () => setEditing(null);
  const run = (fn: () => Promise<FormResult>) =>
    start(async () => {
      const res = await fn();
      if (res.ok) close();
      else setError(res);
    });

  const index = editingSession ? sessions.indexOf(editingSession) + 1 : 0;
  const ready = form.title.trim() && form.startsAt && form.durationMin > 0;

  return (
    <Screen
      withBack
      bottom={
        <Button icon={<Plus />} onClick={() => open(null)}>
          Tambah sesi
        </Button>
      }
    >
      <ScreenHeader
        leading={
          <IconButton
            href={`/panitia/event/${eventId}`}
            label="Kembali ke Home event"
            icon={<CaretLeft />}
          />
        }
        eyebrow={`${eventName} · ${sessions.length ? `${sessions.length} sesi` : "belum ada sesi"}`}
        title="Rundown"
      />
      {sessions.length === 0 ? (
        <>
          <Card>
            <HeroState icon={<ListBullets size={30} />} title="Belum ada sesi">
              Tambah bagian acara satu per satu: nama sesi, jam mulai, durasi, tipe (Info /
              Talkshow), dan PIC.
            </HeroState>
          </Card>
          <Card>
            <CardLabel>Biar layar tamu jalan</CardLabel>
            <div className={styles.checkList}>
              <p className="t-label">
                <Check size={14} />
                Urutan sesi otomatis ngikutin jam mulai
              </p>
              <p className="t-label">
                <Check size={14} />
                Sesi Talkshow bikin kolom pertanyaan muncul di HP tamu
              </p>
              <p className="t-label">
                <Check size={14} />
                PIC nampil di Kontrol acara pas hari-H
              </p>
            </div>
          </Card>
        </>
      ) : (
        <>
          <Card inset>
            {sessions.map((s, i) => (
              <NumberedRow
                key={s.id}
                number={String(i + 1).padStart(2, "0")}
                title={s.title}
                subtitle={
                  <>
                    {s.startsAt} · {s.durationMin} mnt
                    <TypeBadge type={s.type} />
                  </>
                }
                meta={`PIC ${s.pic}`}
                chevron
                onClick={() => open(s)}
              />
            ))}
          </Card>
          <p className="t-label c-label-2">
            Tap sesi buat ubah atau hapus. Urutan ngikutin jam mulai.
          </p>
        </>
      )}

      <Sheet
        open={editing !== null}
        onClose={close}
        title={editingSession ? "Ubah sesi" : "Tambah sesi"}
      >
        <div className={f1.sheetBody}>
          <div className={f1.sheetHead}>
            <p className="t-card-title">{editingSession ? "Ubah sesi" : "Tambah sesi"}</p>
            <p className="t-label c-label-2">
              {editingSession
                ? `Sesi ${String(index).padStart(2, "0")} · perubahan langsung kelihatan di layar tamu.`
                : "Urutannya otomatis ngikutin jam mulai."}
            </p>
          </div>
          <Field
            label="Nama sesi"
            value={form.title}
            placeholder="Talkshow"
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            error={error?.field === "title" ? error.error : undefined}
          />
          <div className={f1.twoCol}>
            <Field
              label="Jam mulai"
              type="time"
              value={form.startsAt.replace(".", ":")}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              error={error?.field === "startsAt" ? error.error : undefined}
            />
            <Field
              label="Durasi (menit)"
              type="number"
              inputMode="numeric"
              min={5}
              max={600}
              value={form.durationMin || ""}
              onChange={(e) => setForm((f) => ({ ...f, durationMin: Number(e.target.value) }))}
              error={error?.field === "durationMin" ? error.error : undefined}
            />
          </div>
          <div className={f1.stack}>
            <p className="t-label c-label-2">Tipe sesi</p>
            <Segmented<SessionType>
              label="Tipe sesi"
              value={form.type}
              onChange={(type) => setForm((f) => ({ ...f, type }))}
              options={[
                { value: "info", label: "Info" },
                { value: "talkshow", label: "Talkshow" },
              ]}
            />
          </div>
          <Field
            label="PIC"
            value={form.pic}
            placeholder="Tim Acara"
            onChange={(e) => setForm((f) => ({ ...f, pic: e.target.value }))}
          />
          {error && !error.field && <p className={`t-label ${f1.danger}`}>{error.error}</p>}
          <div className={f1.sheetActions}>
            <Button
              disabled={!ready || pending}
              onClick={() => save && run(() => save(eventId, editingSession?.id ?? null, form))}
            >
              {editingSession ? "Simpan sesi" : "Tambah sesi"}
            </Button>
            {editingSession ? (
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() => remove && run(() => remove(editingSession.id))}
              >
                Hapus sesi
              </Button>
            ) : (
              <Button variant="secondary" onClick={close}>
                Batal
              </Button>
            )}
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}

function TypeBadge({ type }: { type: SessionType }) {
  return type === "talkshow" ? (
    <Badge tone="live">Talkshow</Badge>
  ) : (
    <Badge tone="neutral">Info</Badge>
  );
}

function toForm(s: Session): SessionForm {
  return {
    title: s.title,
    startsAt: s.startsAt,
    durationMin: s.durationMin,
    type: s.type,
    pic: s.pic,
  };
}
