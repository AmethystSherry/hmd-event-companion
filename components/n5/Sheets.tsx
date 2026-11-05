"use client";

import { Scan, Trophy } from "@/components/icons";
import { Button, Polaroid, Sheet } from "@/components/ui";
import n4 from "@/components/n4/sheets.module.css";
import { cx } from "@/lib/cx";
import { kenalanSelfieUrl, type KenalanIntro, type KenalanView } from "@/lib/kenalan";
import { photoTilt } from "@/lib/photo";
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

// BTk4 · Kenalan berhasil (Figma 5305:10071): selfie berdua di polaroid miring + magnet + ✓,
// "Kamu & {teman} udah kenalan!", stat Kenalan kamu / Peringkat / Teratas, "Balik ke acara" +
// "Scan QR lain" (T3: ganti "Scan Barcode Lain").
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
          caption={`${intro.myFirstName} × ${intro.friendFirstName}`}
          tilt={photoTilt(intro.id)}
          magnet
          status="sent"
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
          { value: String(view.count), label: "Kenalan kamu" },
          { value: rankLabel(view.rank), label: "Peringkat" },
          { value: String(view.top?.count ?? 0), label: "Teratas" },
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

// BTk5 · Pengumuman pemenang (Figma 5305:10200), muncul sekali per HP. K11: HP pemenang dapat
// versi sendiri (TODO desain).
export function PemenangSheet({ view, onClose }: { view: KenalanView; onClose: () => void }) {
  const w = view.winner;
  if (!w) return null;
  return (
    <Sheet open strong onClose={onClose} title="Pemenang kenalan" className={n4.sheet}>
      <span aria-hidden className={s.trophy}>
        <Trophy size={48} />
      </span>
      <div className={n4.text}>
        <p className="t-card-title">
          {w.isMe ? "Kamu paling banyak kenalan!" : `${w.firstName} paling banyak kenalan!`}
        </p>
        <p className="t-body c-label-2">
          {w.isMe
            ? "Selamat, kamu dapat hadiah dari panitia. Samperin panitia, ya."
            : `Selamat, ${w.name} dapat hadiah dari panitia. Makasih udah saling kenalan hari ini.`}
        </p>
      </div>
      <Stats
        items={
          w.isMe
            ? [
                { value: String(w.count), label: "Kenalan kamu" },
                { value: "#1", label: "Peringkat kamu" },
              ]
            : [
                { value: String(w.count), label: `Kenalan ${w.firstName}` },
                { value: String(view.count), label: "Kenalan kamu" },
                { value: rankLabel(view.rank), label: "Peringkat kamu" },
              ]
        }
      />
      <div className={cx(n4.actions)}>
        <Button onClick={onClose}>Balik ke acara</Button>
      </div>
    </Sheet>
  );
}
