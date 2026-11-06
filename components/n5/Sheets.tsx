"use client";

import { HandWaving, Scan } from "@/components/icons";
import { Button, HeroState, Polaroid, Sheet } from "@/components/ui";
import n4 from "@/components/n4/sheets.module.css";
import { cx } from "@/lib/cx";
import { kenalanSelfieUrl, type KenalanIntro, type KenalanView } from "@/lib/kenalan";
import { photoTilt } from "@/lib/photo";
import { KenalanStamp } from "./KenalanStamp";
import { Leaderboard } from "./Leaderboard";
import s from "./n5.module.css";

// N5 · sheet di layar acara tamu (pola NempelSheet N4, `?sheet=kenalan&id=` / `?sheet=pemenang`).

function Stats({ items }: { items: { value: string; label: string }[] }) {
  return (
    <ul className={s.stats}>
      {items.map((it) => (
        <li key={it.label}>
          <span className={s.statValue}>{it.value}</span>
          <span className={s.statLabel}>{it.label}</span>
        </li>
      ))}
    </ul>
  );
}

const rankLabel = (rank: number | null) => (rank ? `#${rank}` : "–");

// BTk4 · Kenalan berhasil (Figma 5305:10071, update 6 Nov): selfie berdua di polaroid miring + magnet
// + stempel KENALAN (ganti badge ✓ N4), caption "{aku} 🤝 {teman}", "Kamu & {teman} udah kenalan!",
// stat Peringkat / Point kamu / Teratas (point, 6 Nov), "Balik ke acara" + "Scan QR lain" (T3: Figma masih
// "Scan Barcode Lain"). BTk3 kamera tetap "{aku} × {teman}" (Figma).
export function KenalanSheet({
  token,
  intro,
  view,
  onClose,
  onScanAgain,
  preview,
}: {
  token: string;
  intro: KenalanIntro;
  view: KenalanView;
  onClose: () => void;
  onScanAgain: () => void;
  preview?: boolean; // /dev/states/n5: tanpa gambar (placeholder gelap)
}) {
  return (
    <Sheet open strong onClose={onClose} title="Kenalan berhasil" className={n4.sheet}>
      <div className={n4.stage}>
        <Polaroid
          key={intro.id}
          size="sheet"
          src={preview ? undefined : kenalanSelfieUrl(token, intro.id)}
          alt={`Selfie kamu & ${intro.friendFirstName}`}
          name={intro.myFirstName}
          caption={`${intro.myFirstName} 🤝 ${intro.friendFirstName}`}
          tilt={photoTilt(intro.id)}
          magnet
          stamp={<KenalanStamp />}
          className={n4.drop}
        />
      </div>
      <div className={n4.text}>
        <p className="t-card-title">Kamu & {intro.friendFirstName} udah kenalan!</p>
        <p className="t-body c-label-2">
          Kenalan ke-{intro.no} hari ini. Selfie ini cuma jadi bukti kenalan, nggak masuk kolase
          foto.
        </p>
      </div>
      <Stats
        items={[
          { value: rankLabel(view.rank), label: "Peringkat" },
          { value: String(view.points), label: "Point kamu" },
          { value: String(view.top?.points ?? 0), label: "Teratas" },
        ]}
      />
      <div className={n4.actions}>
        <Button variant="secondary" onClick={onClose}>
          Balik ke acara
        </Button>
        {view.open && (
          <Button icon={<Scan />} onClick={onScanAgain}>
            Scan QR lain
          </Button>
        )}
      </div>
    </Sheet>
  );
}

// BTk5 · Pengumuman pemenang (Figma 5305:10200, update 6 Nov), muncul sekali per HP: ilustrasi piala
// (5330:9842 → /figma/n5-trophy.webp, lingkaran ikut gambar) + stat 2 kolom Peringkat kamu · Point
// kamu. K11: HP pemenang = copy sendiri, stat sama. (6 Nov) Juara = point terbanyak.
export function PemenangSheet({ view, onClose }: { view: KenalanView; onClose: () => void }) {
  const w = view.winner;
  if (!w) return null;
  return (
    <Sheet open strong onClose={onClose} title="Pemenang kenalan" className={n4.sheet}>
      {/* eslint-disable-next-line @next/next/no-img-element -- ilustrasi statis kecil, ukuran tetap */}
      <img src="/figma/n5-trophy.webp" alt="" width={150} height={150} className={s.trophy} />
      <div className={n4.text}>
        <p className="t-card-title">
          {w.isMe ? "Kamu juara kenalan!" : `${w.firstName} juara kenalan!`}
        </p>
        <p className="t-body c-label-2">
          {w.isMe
            ? "Selamat, kamu dapat hadiah dari panitia. Samperin panitia, ya."
            : `Selamat, ${w.name} dapat hadiah dari panitia. Makasih udah saling kenalan hari ini.`}
        </p>
      </div>
      <Stats
        items={[
          { value: w.isMe ? "#1" : rankLabel(view.rank), label: "Peringkat kamu" },
          { value: String(w.isMe ? w.points : view.points), label: "Point kamu" },
        ]}
      />
      <div className={cx(n4.actions)}>
        <Button onClick={onClose}>Balik ke acara</Button>
      </div>
    </Sheet>
  );
}

// (6 Nov) Leaderboard tamu (Figma "BT05k · Tamu di sini · leaderboard"), dibuka dari tombol ikon di
// kartu peringkat BT05k: sheet mengambang di atas navbar, judul + tombol primary "Kenalan" di kanan atas
// (papan masih buka; → sheet Kenalan), ajakan 1 baris, `Leaderboard` (podium + daftar mulai #4) sama dengan
// P14 panitia tapi tanpa kartu. Papan kosong → HeroState.
export function LeaderboardSheet({
  view,
  onClose,
  onKenalan,
}: {
  view: KenalanView;
  onClose: () => void;
  onKenalan?: () => void;
}) {
  return (
    <Sheet open aboveNav onClose={onClose} title="Leaderboard" className={s.leaderSheet}>
      <div className={s.leaderHead}>
        <div className={s.leaderTitle}>
          <p aria-hidden className="t-card-title">
            Leaderboard
          </p>
          {view.open && onKenalan && (
            <Button size="sm" icon={<HandWaving />} onClick={onKenalan}>
              Kenalan
            </Button>
          )}
        </div>
        <p className="t-label c-label-2">
          {view.winner
            ? `${view.winner.firstName} juara kenalan. Makasih udah ikutan!`
            : "Point terbanyak dapat hadiah. Kejar podiumnya!"}
        </p>
      </div>
      {view.rows.length > 0 ? (
        <Leaderboard rows={view.rows} />
      ) : (
        <HeroState size="sm" icon={<HandWaving />} title="Belum ada yang kenalan">
          Jadi yang pertama naik podium, yuk!
        </HeroState>
      )}
    </Sheet>
  );
}
