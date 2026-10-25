"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge, Button, GuestCard, ListRow, LogoMark, SearchField, Sheet } from "@/components/ui";
import { filterGuests, rundownSubtitle, type AcaraView } from "@/lib/acara";
import { cx } from "@/lib/cx";
import { initials, keyLabel } from "@/lib/format";
import { igProfileUrl } from "@/lib/invite";
import { actualMin, elapsedMs, roomLabel, type SessionView } from "@/lib/rundown";
import styles from "./f4.module.css";

// Sheet layar acara tamu: BT22 Detail sesi · BT21p Profil pembicara · BT04 Rundown · BT05 Tamu di
// sini (N3). Ilustrasi & panel tetap di belakang backdrop.

// "foto" (hasil jepret BT07/BT07b/BT07e) & "galeri" (BT07d) = sheet N4 di components/n4.
export type SheetKind = "detail" | "pembicara" | "rundown" | "tamu" | "foto" | "galeri";

const STATE_BADGE = {
  berlangsung: { tone: "live", label: "Lagi jalan" },
  selesai: { tone: "success", label: "Selesai" },
  berikutnya: { tone: "neutral", label: "Berikutnya" },
  nanti: { tone: "neutral", label: "Nanti" },
} as const;

// BT22 · durasi: jalan "60 mnt · udah jalan 12 mnt"; selesai "Selesai · 62 mnt"; belum "45 mnt".
function durationLabel(s: SessionView, now: number): string {
  if (s.state === "berlangsung")
    return `${s.durationMin} mnt · udah jalan ${Math.floor(elapsedMs(s, now) / 60_000)} mnt`;
  const done = actualMin(s);
  if (s.state === "selesai" && done !== null) return `Selesai · ${done} mnt`;
  return `${s.durationMin} mnt`;
}

export function DetailSheet({
  session: s,
  now,
  onClose,
}: {
  session: SessionView;
  now: number;
  onClose: () => void;
}) {
  const badge = STATE_BADGE[s.state];
  const room = roomLabel(s);
  return (
    <Sheet open onClose={onClose} title={`Detail sesi ${s.title}`} className={styles.sheet}>
      <div className={styles.sheetHead}>
        <div className={styles.status}>
          <Badge tone={badge.tone} pulse={s.state === "berlangsung"}>
            {badge.label}
          </Badge>
          <span className="t-caption c-label-2">
            {s.startsAt}–{s.endsAt}
          </span>
        </div>
        <p aria-hidden className="t-card-title">
          {s.title}
        </p>
        {(s.description ?? s.topic) && (
          <p className="t-body c-label-2">{s.description ?? s.topic}</p>
        )}
      </div>
      <div className={styles.rows}>
        {room && <ListRow title="Ruang" subtitle={room} />}
        {s.speaker && (
          <ListRow title="Pembicara" subtitle={`${s.speaker.name} · @${s.speaker.ig}`} />
        )}
        <ListRow title="PIC" subtitle={s.pic} />
        <ListRow title="Durasi" subtitle={durationLabel(s, now)} />
      </div>
      <Button variant="secondary" onClick={onClose}>
        Tutup
      </Button>
    </Sheet>
  );
}

export function SpeakerSheet({ session, onClose }: { session: SessionView; onClose: () => void }) {
  const sp = session.speaker!;
  return (
    <Sheet open onClose={onClose} title={`Profil ${sp.name}`} className={styles.sheet}>
      <div className={styles.profile}>
        <span aria-hidden className={styles.profileAvatar}>
          {initials(sp.name)}
        </span>
        <p aria-hidden className="t-card-title">
          {sp.name}
        </p>
        <p className="t-label c-label-2">@{sp.ig}</p>
        <Badge tone="live">
          {sp.label} · {session.title}
        </Badge>
        {session.topic && <p className="t-body c-label-2">{session.topic}</p>}
      </div>
      <div className={styles.actions}>
        <Button href={igProfileUrl(sp.ig)} target="_blank" rel="noopener noreferrer">
          Buka Instagram
        </Button>
        <Button variant="secondary" onClick={onClose}>
          Tutup
        </Button>
      </div>
    </Sheet>
  );
}

export function RundownSheet({
  sessions,
  onClose,
  onPick,
}: {
  sessions: SessionView[];
  onClose: () => void;
  onPick: (id: string) => void;
}) {
  return (
    <Sheet open onClose={onClose} title="Rundown acara" className={styles.sheet}>
      <p aria-hidden className={cx("t-card-title", styles.sheetTitle)}>
        Rundown acara
      </p>
      <div className={styles.rows}>
        {sessions.map((s) => (
          <ListRow
            key={s.id}
            onClick={() => onPick(s.id)}
            leading={
              <span aria-hidden className={styles.no} data-state={s.state}>
                {s.no}
              </span>
            }
            title={s.title}
            subtitle={rundownSubtitle(s)}
            trailing={s.startsAt}
          />
        ))}
      </div>
      <Button variant="secondary" onClick={onClose}>
        Tutup
      </Button>
    </Sheet>
  );
}

export function TamuSheet({
  token,
  view,
  onClose,
}: {
  token: string;
  view: AcaraView;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const list = filterGuests(view.guests, q);
  const me = view.me;
  return (
    <Sheet open onClose={onClose} title="Tamu di sini" className={cx(styles.sheet, styles.tamu)}>
      <div className={styles.sheetHead}>
        <p aria-hidden className="t-card-title">
          Tamu di sini
        </p>
        <p className="t-label c-label-2">
          {view.total} tamu · {view.hereCount} udah di sini
        </p>
      </div>
      <SearchField
        label="Cari tamu"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari nama atau @instagram"
        className={styles.search}
      />

      {!q && (
        <>
          <div className={styles.rowHead}>
            <span className="t-label-emph">Kartu kamu</span>
            <Link href={`/t/${token}/kartu`} className={cx("t-label-emph", styles.link)}>
              Ubah
            </Link>
          </div>
          <article className={styles.myCard} aria-label="Kartu kamu">
            <div className={styles.myHead}>
              <span className={styles.myEyebrow}>House Moving Day · Tamu</span>
              <span className={cx("t-label-emph", styles.myNo)}>{keyLabel(me.keyNo)}</span>
            </div>
            <span aria-hidden className={styles.myTear} />
            <div className={styles.myBody}>
              <div className={styles.myTop}>
                <span aria-hidden className={styles.myAvatar}>
                  {initials(me.name)}
                </span>
                <span className={styles.myName}>
                  <span className="t-headline">{me.name}</span>
                  <span className="t-label">
                    @{me.ig}
                    {me.role && ` · ${me.role}`}
                  </span>
                </span>
              </div>
              {me.askAbout.length > 0 && (
                <ul className={styles.chips} aria-label="Tanya aku soal">
                  {me.askAbout.map((a) => (
                    <li key={a} className="t-caption">
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <span aria-hidden className={styles.myLogo}>
              <LogoMark size={84} title="" />
            </span>
            <span aria-hidden className={cx(styles.myNotch, styles.myNotchL)} />
            <span aria-hidden className={cx(styles.myNotch, styles.myNotchR)} />
          </article>
        </>
      )}

      <div className={styles.rowHead}>
        <span className="t-label-emph">
          {q ? `Hasil · ${list.length}` : `Semua tamu · ${view.guests.length}`}
        </span>
        {list.length > 2 && <span className="t-caption c-label-3">geser →</span>}
      </div>
      {list.length ? (
        <div className={styles.carousel}>
          {list.map((g) => (
            <GuestCard
              key={g.id}
              name={g.name}
              ig={g.ig}
              role={g.role}
              askAbout={g.askAbout}
              here={g.here}
            />
          ))}
        </div>
      ) : (
        <p className={cx("t-label c-label-2", styles.empty)}>
          {q ? "Nggak ada tamu dengan nama itu." : "Belum ada tamu lain."}
        </p>
      )}
    </Sheet>
  );
}
