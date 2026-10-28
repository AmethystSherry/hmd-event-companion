"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { CaretLeft, Check, ListBullets, Plus, Trash } from "@/components/icons";
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
  SwipeRow,
  Toast,
} from "@/components/ui";
import type { FormResult } from "@/app/panitia/actions";
import type { Session, SessionType } from "@/lib/data/types";
import {
  DESCRIPTION_MAX,
  EMPTY_SESSION_FORM,
  sessionToForm,
  type SessionForm,
} from "@/lib/sessionForm";
import f1 from "./f1.module.css";
import styles from "./panitia.module.css";

// PE04k belum ada sesi · PE04 atur sesi (urut jam mulai) · PE04a sheet ubah sesi Talkshow ·
// PE04b sheet ubah sesi Info · PE04s swipe kiri hapus. Hapus (🗑 di judul sheet / swipe): baris
// langsung hilang + Toast Batalkan 5 dtk; dihapus di server saat toast habis / layar ditinggal.
export function Rundown({
  eventId,
  eventName,
  sessions,
  save,
  remove,
  initialEditing = null,
  initialSwiped,
}: {
  eventId: string;
  eventName: string;
  sessions: Session[];
  save?: (eventId: string, sessionId: string | null, input: SessionForm) => Promise<FormResult>;
  remove?: (sessionId: string) => Promise<FormResult>;
  initialEditing?: string | "new" | null; // id sesi, "new", atau tertutup
  initialSwiped?: string; // pratinjau PE04s
}) {
  const [hidden, setHidden] = useState<string[]>([]);
  const shown = sessions.filter((s) => !hidden.includes(s.id));
  const [editing, setEditing] = useState(initialEditing);
  const editingSession = shown.find((s) => s.id === editing) ?? null;
  const [form, setForm] = useState<SessionForm>(() =>
    editingSession ? sessionToForm(editingSession) : EMPTY_SESSION_FORM,
  );
  const [error, setError] = useState<{ field?: string; error: string } | null>(null);
  const [toast, setToast] = useState<{ id: string; title: string; key: string } | null>(null);
  const [pending, start] = useTransition();

  const open = (s: Session | null) => {
    setForm(s ? sessionToForm(s) : EMPTY_SESSION_FORM);
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

  // ---- Hapus + Batalkan ----
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
  const removeSession = (s: Session) => {
    commitDelete();
    pendingDelete.current = s.id;
    setHidden((h) => [...h, s.id]);
    close();
    setToast({ id: s.id, title: s.title, key: s.id });
  };

  const index = editingSession ? shown.indexOf(editingSession) + 1 : 0;
  const ready = form.title.trim() && form.startsAt && form.durationMin > 0;
  const set = <K extends keyof SessionForm>(k: K, v: SessionForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));
  const fieldError = (k: keyof SessionForm) => (error?.field === k ? error.error : undefined);

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
        eyebrow={`${eventName} · ${shown.length ? `${shown.length} sesi` : "belum ada sesi"}`}
        title="Rundown"
      />
      {shown.length === 0 ? (
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
          <Card inset className={styles.swipeList}>
            {shown.map((s, i) => (
              <SwipeRow
                key={s.id}
                className={styles.swipe}
                deleteLabel={`Hapus sesi ${s.title}`}
                initialOpen={initialSwiped === s.id}
                onDelete={() => removeSession(s)}
              >
                <NumberedRow
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
              </SwipeRow>
            ))}
          </Card>
          <p className="t-label c-label-2">
            Tap sesi buat ubah atau hapus. Urutan ngikutin jam mulai.
          </p>
        </>
      )}

      {toast && (
        <div className={f1.toastDock}>
          <Toast
            key={toast.key}
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
            Sesi {toast.title} dihapus
          </Toast>
        </div>
      )}

      <Sheet
        open={editing !== null}
        onClose={close}
        title={editingSession ? "Ubah sesi" : "Tambah sesi"}
      >
        <div className={f1.sheetBody}>
          <div className={f1.between}>
            <div className={f1.sheetHead}>
              <p className="t-card-title">{editingSession ? "Ubah sesi" : "Tambah sesi"}</p>
              <p className="t-label c-label-2">
                {editingSession
                  ? `Sesi ${String(index).padStart(2, "0")} · perubahan langsung kelihatan di layar tamu.`
                  : "Urutannya otomatis ngikutin jam mulai."}
              </p>
            </div>
            {editingSession && (
              <Button
                size="sm"
                variant="destructive"
                iconOnly
                label="Hapus sesi"
                icon={<Trash />}
                onClick={() => removeSession(editingSession)}
              />
            )}
          </div>
          <div className={f1.stack}>
            <p className="t-label c-label-2">Tipe sesi</p>
            <Segmented<SessionType>
              label="Tipe sesi"
              value={form.type}
              onChange={(type) => set("type", type)}
              options={[
                { value: "info", label: "Info" },
                { value: "talkshow", label: "Talkshow" },
              ]}
            />
            {form.type === "info" && (
              <p className={`t-caption c-label-2 ${styles.typeHint}`}>
                Info: tamu cuma lihat detail sesi, nggak ada kolom Tanya.
              </p>
            )}
          </div>
          <Field
            label="Nama sesi"
            value={form.title}
            placeholder="Talkshow"
            onChange={(e) => set("title", e.target.value)}
            error={fieldError("title")}
          />
          <div className={f1.twoCol}>
            <Field
              label="Jam mulai"
              type="time"
              value={form.startsAt.replace(".", ":")}
              onChange={(e) => set("startsAt", e.target.value)}
              error={fieldError("startsAt")}
            />
            <Field
              label="Durasi (menit)"
              type="number"
              inputMode="numeric"
              min={5}
              max={600}
              value={form.durationMin || ""}
              onChange={(e) => set("durationMin", Number(e.target.value))}
              error={fieldError("durationMin")}
            />
          </div>
          <Field
            label="Ruang"
            value={form.room}
            placeholder="Ruang 02"
            maxLength={20}
            onChange={(e) => set("room", e.target.value)}
          />
          {form.type === "talkshow" && (
            <>
              <Field
                label="Topik · muncul di layar tamu"
                value={form.topic}
                placeholder="Cara pakai AI tanpa ngabisin air di rumah"
                maxLength={80}
                onChange={(e) => set("topic", e.target.value)}
              />
              <Field
                label="Pembicara"
                value={form.speaker}
                placeholder="Nama pembicara"
                maxLength={40}
                onChange={(e) => set("speaker", e.target.value)}
              />
              <Field
                label="Instagram pembicara"
                value={form.speakerIg}
                placeholder="@username"
                autoCapitalize="none"
                autoCorrect="off"
                maxLength={31}
                onChange={(e) => set("speakerIg", e.target.value)}
                error={fieldError("speakerIg")}
              />
            </>
          )}
          <Field
            multiline
            rows={3}
            label="Deskripsi singkat"
            value={form.description}
            maxLength={DESCRIPTION_MAX}
            placeholder="Cerita singkat sesi ini buat tamu"
            onChange={(e) => set("description", e.target.value)}
            error={fieldError("description")}
          />
          <Field
            label="PIC"
            value={form.pic}
            placeholder="Tim Acara"
            onChange={(e) => set("pic", e.target.value)}
          />
          {error && !error.field && <p className={`t-label ${f1.danger}`}>{error.error}</p>}
          <div className={`${f1.sheetActions} ${f1.stickyActions}`}>
            <Button
              disabled={!ready || pending}
              onClick={() => save && run(() => save(eventId, editingSession?.id ?? null, form))}
            >
              {editingSession ? "Simpan sesi" : "Tambah sesi"}
            </Button>
            <Button variant="secondary" onClick={close}>
              Batal
            </Button>
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
