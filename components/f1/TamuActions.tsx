"use client";

import { useState, useTransition } from "react";
import { CalendarBlank, PaperPlaneTilt, WifiSlash } from "@/components/icons";
import { Banner, Button, Card, CardLabel, Chip, Sheet } from "@/components/ui";
import { FAREWELL_MAX } from "@/lib/confirm";
import type { Event } from "@/lib/data/types";
import { dateShort } from "@/lib/format";
import f1 from "./f1.module.css";

// Bagian interaktif layar tamu F1 (T02b titip ucapan, T03k simpan ke kalender).

const QUICK = ["Selamat pindahan!", "Semoga betah", "Next time aku datang"];

export type FarewellResult = { ok: true } | { ok: false; error: string };

// T02b · Titip ucapan (opsional). Chip cepat mengisi field; kirim → tersimpan di tamu, field jadi
// read-only. Gagal kirim → Banner, isian tetap.
export function FarewellCard({
  initial,
  sent: sentInitially,
  send,
}: {
  initial: string;
  sent: boolean;
  send?: (message: string) => Promise<FarewellResult>; // kosong = pratinjau
}) {
  const [text, setText] = useState(initial);
  const [sent, setSent] = useState(sentInitially);
  const [failed, setFailed] = useState(false);
  const [pending, start] = useTransition();
  const ready = text.trim().length > 0 && !sent && !pending;

  const submit = () => {
    if (!ready || !send) return;
    start(async () => {
      try {
        const res = await send(text.trim());
        setFailed(!res.ok);
        if (res.ok) setSent(true);
      } catch {
        setFailed(true);
      }
    });
  };

  return (
    <Card>
      <CardLabel>Titip ucapan · opsional</CardLabel>
      <p className="t-body-emph">Kasih semangat buat pindahan kami</p>
      {!sent && (
        <div className={f1.wrapChips}>
          {QUICK.map((q) => (
            <Chip
              key={q}
              look="outline"
              check={false}
              selected={text.startsWith(q)}
              onClick={() => setText(q)}
            >
              {q}
            </Chip>
          ))}
        </div>
      )}
      <form
        className={f1.messageBox}
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <textarea
          aria-label="Ucapan buat Potara"
          className={`t-label ${f1.messageInput}`}
          value={text}
          rows={2}
          maxLength={FAREWELL_MAX}
          readOnly={sent}
          placeholder="Tulis ucapanmu"
          onChange={(e) => setText(e.target.value)}
        />
        {!sent && (
          <button
            type="submit"
            aria-label="Kirim ucapan"
            aria-disabled={!ready}
            className={f1.sendBtn}
          >
            <PaperPlaneTilt size={16} />
          </button>
        )}
      </form>
      {sent && <p className="t-label c-label-2">Ucapanmu udah terkirim. Makasih!</p>}
      {failed && (
        <Banner tone="danger" icon={<WifiSlash />} title="Ucapan belum terkirim">
          Cek sinyalmu, lalu tap kirim lagi. Isiannya nggak hilang.
        </Banner>
      )}
    </Card>
  );
}

// T03 "Simpan ke kalender" → T03k sheet: Google Calendar (link) atau kalender HP (.ics).
export function CalendarButton({
  event,
  googleHref,
  icsHref,
  initialOpen = false,
}: {
  event: Event;
  googleHref: string;
  icsHref: string;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <>
      <Button variant="secondary" icon={<CalendarBlank />} onClick={() => setOpen(true)}>
        Simpan ke kalender
      </Button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Simpan ke kalender">
        <div className={f1.sheetBody}>
          <div className={f1.sheetHead}>
            <p className="t-card-title">Simpan ke kalender</p>
            <p className="t-label c-label-2">
              {event.name} · {dateShort(event.date)} · {event.startsAt}–{event.endsAt} ·{" "}
              {event.location}. Pengingat 1 jam sebelum ikut kesimpan.
            </p>
          </div>
          <div className={f1.sheetActions}>
            <Button
              href={googleHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
            >
              Google Calendar
            </Button>
            <Button variant="secondary" href={icsHref} onClick={() => setOpen(false)}>
              Kalender HP (Apple, Samsung, dll)
            </Button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
