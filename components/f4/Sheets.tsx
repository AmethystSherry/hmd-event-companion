"use client";

import { useState } from "react";
import {
  Copy,
  HandWaving,
  MagnifyingGlass,
  MapPin,
  PencilSimple,
  Ranking,
  WifiHigh,
} from "@/components/icons";
import { Badge, Button, GuestCard, HeroState, ListRow, SearchField, Sheet } from "@/components/ui";
import { filterGuests, rundownSubtitle, type AcaraView } from "@/lib/acara";
import { cx } from "@/lib/cx";
import { copyText } from "@/lib/clipboard";
import type { HouseInfo } from "@/lib/data/types";
import { hasHouseInfo, mapsUrl } from "@/lib/houseInfo";
import { initials } from "@/lib/format";
import { igProfileUrl } from "@/lib/invite";
import { actualMin, elapsedMs, roomLabel, type SessionView } from "@/lib/rundown";
import { RankCard } from "@/components/n5/RankCard";
import type { KenalanView } from "@/lib/kenalan";
import styles from "./f4.module.css";

// Sheet layar acara tamu: BT22 Detail sesi · BT21p Profil pembicara · BT04 Rundown · BT05 Tamu di
// sini (N3). Ilustrasi & panel tetap di belakang backdrop.

// "foto" (hasil jepret BT07/BT07b/BT07e) & "galeri" (BT07d) = sheet N4 di components/n4;
// "tanya" (BT08/BT09/BT08b) = sheet N1 di components/n1; "kartu" (T11/T11e) = sheet N3 di components/n3;
// "kenalan" (BTk4), "kenalan-qr" (BTk2 QR saya / BTk1 Scan QR / BTk3 selfie) & "pemenang" (BTk5)
// = sheet N5 di components/n5.
export type SheetKind =
  | "detail"
  | "pembicara"
  | "rundown"
  | "tamu"
  | "kartu"
  | "foto"
  | "galeri"
  | "tanya"
  | "rumah"
  | "kenalan"
  | "kenalan-qr"
  | "peringkat"
  | "pemenang";

const STATE_BADGE = {
  berlangsung: { tone: "live", label: "Sedang berjalan" },
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
    <Sheet open aboveNav onClose={onClose} title="Rundown acara" className={styles.sheet}>
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
      {/* Tanpa tombol Tutup (28 Okt): tutup lewat tab Rundown di navbar, geser ke bawah, atau back. */}
    </Sheet>
  );
}

export function TamuSheet({
  view,
  me,
  onClose,
  onEdit,
  initialQuery = "",
  kenalan,
  onKenalan,
  onLeaderboard,
}: {
  view: AcaraView;
  me: AcaraView["me"]; // kartu kamu (bisa versi baru setelah T11 sebelum data server masuk)
  onClose: () => void;
  onEdit: () => void; // "Ubah" → T11 (N3, ?sheet=kartu)
  initialQuery?: string; // /dev/states/n3 BT05b
  // N5 · BT05k: kartu peringkat + satu tombol Kenalan di header (null = fitur belum kebuka).
  kenalan?: KenalanView | null;
  onKenalan?: () => void; // → sheet Kenalan (BTk2 QR saya / BTk1 Scan QR)
  onLeaderboard?: () => void; // → sheet Leaderboard (6 Nov)
}) {
  const [q, setQ] = useState(initialQuery);
  const list = filterGuests(view.guests, q);
  const searching = !!q.trim();
  const showKenalan = !!kenalan && (kenalan.open || !!kenalan.winner);
  // Papan ditutup (pemenang diumumin) → tombol Kenalan hilang dari kartu peringkat.
  const kenalanLive = !!kenalan?.open && !!onKenalan;
  // (6 Nov, Figma BT05k 5358:10227) N5 kebuka → judul "Yuk Kenalan" + ajakan 1 baris.
  const othersHere = view.guests.filter((g) => g.here).length;
  const title = showKenalan ? "Yuk Kenalan" : "Tamu di sini";
  return (
    <Sheet open aboveNav onClose={onClose} title={title} className={cx(styles.sheet, styles.tamu)}>
      {/* (28 Okt) Kartu kamu → avatar di pojok kanan atas; tap = ubah kartu (T11). */}
      <div className={styles.tamuHead}>
        <div className={styles.sheetHead}>
          <p aria-hidden className="t-card-title">
            {title}
          </p>
          <p className="t-label c-label-2">
            {kenalanLive && othersHere > 0
              ? `${othersHere} orang udah di sini. Sapa satu, yuk!`
              : `${view.total} tamu · ${view.hereCount} udah di sini`}
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className={styles.meButton}
          aria-label={`Kartu kamu, ${me.name}. Ubah`}
        >
          <span aria-hidden className={styles.meAvatar}>
            {initials(me.name)}
          </span>
          <span aria-hidden className={styles.meEdit}>
            <PencilSimple size={11} weight="bold" />
          </span>
        </button>
      </div>
      {/* N5 · BT05k: disembunyikan saat cari (sama kayak kartu kamu N3). Di kartu peringkat: tombol
          Kenalan (→ sheet Kenalan, Secondary Large, Figma 5358:10360) + tombol ikon Leaderboard (→ sheet
          Leaderboard, tetap ada setelah papan tutup). */}
      {showKenalan && kenalan && !searching && (
        <RankCard
          view={kenalan}
          action={
            kenalanLive || onLeaderboard ? (
              <div className={styles.rankActions}>
                {kenalanLive && (
                  <Button variant="secondary" icon={<HandWaving />} onClick={onKenalan}>
                    Kenalan
                  </Button>
                )}
                {onLeaderboard && (
                  <Button
                    variant="secondary"
                    iconOnly
                    label="Leaderboard"
                    icon={<Ranking />}
                    onClick={onLeaderboard}
                  />
                )}
              </div>
            ) : undefined
          }
        />
      )}
      <SearchField
        label="Cari tamu"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Cari nama atau @instagram"
        className={styles.search}
      />

      {/* (6 Nov) Label "Semua tamu · n" dihapus; jumlah hasil cuma tampil selagi cari. */}
      {searching && list.length > 0 && (
        <div className={styles.rowHead}>
          <span className="t-label-emph">Hasil · {list.length}</span>
        </div>
      )}
      {list.length > 0 ? (
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
      ) : searching ? (
        // BT05b · cari nggak ketemu
        <HeroState
          size="sm"
          icon={<MagnifyingGlass />}
          title={`Nggak ada tamu bernama “${q.trim()}”`}
        >
          Coba nama lain atau @instagram-nya.
        </HeroState>
      ) : (
        <p className="t-label c-label-2">Belum ada tamu lain.</p>
      )}
    </Sheet>
  );
}

// (29 Okt) Info rumah: Wi-Fi (salin password) & alamat kantor (buka di Maps). Data dari panitia (PE03).
export function RumahSheet({
  house,
  onClose,
  onCopied,
}: {
  house: HouseInfo | null;
  onClose: () => void;
  onCopied: (ok: boolean) => void;
}) {
  const copy = async () => {
    if (house?.wifiPassword) onCopied(await copyText(house.wifiPassword));
  };
  return (
    <Sheet open aboveNav onClose={onClose} title="Info rumah" className={styles.sheet}>
      <div className={styles.sheetHead}>
        <p aria-hidden className="t-card-title">
          Info rumah
        </p>
        <p className="t-label c-label-2">Biar nggak perlu nanya panitia.</p>
      </div>
      {hasHouseInfo(house) ? (
        <div className={styles.house}>
          {(house.wifiName || house.wifiPassword) && (
            <div className={styles.houseRow}>
              <span aria-hidden className={styles.houseIcon}>
                <WifiHigh size={20} />
              </span>
              <div className={styles.houseText}>
                <p className="t-caption c-label-2">Wi-Fi</p>
                <p className="t-body-emph">{house.wifiName ?? "—"}</p>
                {house.wifiPassword && (
                  <p className="t-label c-label-2">
                    Password{" "}
                    <span className={cx("t-code", styles.housePass)}>{house.wifiPassword}</span>
                  </p>
                )}
              </div>
              {house.wifiPassword && (
                <Button size="sm" variant="secondary" icon={<Copy />} onClick={copy}>
                  Salin
                </Button>
              )}
            </div>
          )}
          {house.address && (
            <div className={styles.houseRow}>
              <span aria-hidden className={styles.houseIcon}>
                <MapPin size={20} />
              </span>
              <div className={styles.houseText}>
                <p className="t-caption c-label-2">Alamat</p>
                <p className="t-body">{house.address}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                href={mapsUrl(house.address)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Maps
              </Button>
            </div>
          )}
        </div>
      ) : (
        <p className="t-body c-label-2">
          Panitia belum isi info rumah. Tanya panitia di pintu, ya.
        </p>
      )}
    </Sheet>
  );
}
