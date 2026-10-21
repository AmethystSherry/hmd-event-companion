import type { ReactNode } from "react";
import { Check, Key } from "@/components/icons";
import { cx } from "@/lib/cx";
import { Badge } from "./Badge";
import styles from "./Ticket.module.css";

// Clean/Ticket (4594:1046) · Sobek (4594:1093) · Potongan (4594:1111).
// Anatomi design.md "Tiket": kepala → perforasi → info → garis sobek → potongan QR (stub).
export type TicketState = "aktif" | "terkonfirmasi" | "valid" | "sobek";

export type TicketData = {
  name: string;
  keyNo: string; // "#014"
  when: string; // "Min, 8 Nov · 13.00"
  where: string; // "Kantor baru Potara"
  code: string; // "HMD-014-7F3K"
  followNote?: string;
};

const BADGE: Record<TicketState, ReactNode> = {
  aktif: <Badge tone="neutral">Belum masuk</Badge>,
  terkonfirmasi: <Badge tone="success">Terkonfirmasi</Badge>,
  valid: <Badge tone="success">Valid</Badge>,
  sobek: <Badge tone="success">Sudah masuk</Badge>,
};

export function Ticket({
  data,
  state,
  qr,
  stamp,
  className,
}: {
  data: TicketData;
  state: TicketState;
  qr?: ReactNode; // QR 140 (Phase 4); tidak dirender saat sobek
  stamp?: { time: string; guestNo: number; total: number };
  className?: string;
}) {
  const torn = state === "sobek";
  return (
    <article
      aria-label={`Tiket ${data.name}, nomor kunci ${data.keyNo}`}
      className={cx(styles.ticket, torn && styles.torn, className)}
    >
      <header className={styles.head}>
        <span className={styles.keyIcon}>
          <Key size={20} />
        </span>
        <h2 className="t-card-title">Kunci rumah baru</h2>
        <p className="t-label c-label-2">House Moving Day · Potara Studio</p>
        {BADGE[state]}
      </header>

      <Perforation />

      <dl className={styles.info}>
        <div className={styles.pair}>
          <div>
            <dt className="t-label c-label-2">Nama</dt>
            <dd className="t-body-emph">{data.name}</dd>
          </div>
          <div className={styles.end}>
            <dt className="t-label c-label-2">Nomor kunci</dt>
            <dd className="t-body-emph tabular">{data.keyNo}</dd>
          </div>
        </div>
        <div className={styles.pair}>
          <div>
            <dt className="t-label c-label-2">Waktu</dt>
            <dd className="t-body-emph">{data.when}</dd>
          </div>
          <div className={styles.end}>
            <dt className="t-label c-label-2">Lokasi</dt>
            <dd className="t-body-emph">{data.where}</dd>
          </div>
        </div>
        <div className={styles.follow}>
          <Check size={18} />
          <span className="t-label">{data.followNote ?? "Sudah follow @potarastudio"}</span>
        </div>
      </dl>

      {torn ? (
        <>
          <div className={styles.tornSpacer} />
          <TearEdge position="bottom" />
          {stamp && (
            <div
              className={styles.stamp}
              aria-label={`Masuk ${stamp.time}, tamu ke-${stamp.guestNo}`}
            >
              <span className="t-label-emph">MASUK {stamp.time}</span>
              <span className="t-caption">
                Tamu ke-{stamp.guestNo} dari {stamp.total}
              </span>
            </div>
          )}
        </>
      ) : (
        <>
          <Perforation />
          <TicketStubBody code={data.code} qr={qr} />
          <Scallops />
        </>
      )}
    </article>
  );
}

// Potongan QR terlepas (untuk animasi sobek, Phase 4).
export function TicketStub({
  code,
  qr,
  className,
}: {
  code: string;
  qr?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx(styles.stub, className)} aria-hidden>
      <TearEdge position="top" />
      <div className={styles.stubTopSpacer} />
      <TicketStubBody code={code} qr={qr} />
      <Scallops />
    </div>
  );
}

function TicketStubBody({ code, qr }: { code: string; qr?: ReactNode }) {
  return (
    <div className={styles.potongan}>
      <div className={styles.qrBox}>{qr ?? <div className={styles.qrPlaceholder} />}</div>
      <p className={cx("t-code", styles.code)}>{code}</p>
      <p className="t-label c-label-2">Tunjukkan ke panitia di pintu</p>
    </div>
  );
}

function Perforation() {
  return (
    <div aria-hidden className={styles.perforation}>
      <span className={styles.notchLeft} />
      <span className={styles.dashes} />
      <span className={styles.notchRight} />
    </div>
  );
}

// 7 gerigi setengah lingkaran 28 di tepi bawah (warna bg).
function Scallops() {
  return (
    <div aria-hidden className={styles.scallops}>
      {Array.from({ length: 7 }, (_, i) => (
        <span key={i} />
      ))}
    </div>
  );
}

// Tepi sobek bergerigi (path dari Figma "Tepi sobek"), diisi warna bg.
function TearEdge({ position }: { position: "top" | "bottom" }) {
  const d =
    position === "bottom"
      ? "M0 0V12L9 4L18 10L27 2L36 11L45 5L54 8L63 3L72 12L81 6L90 12L99 4L108 10L117 2L126 11L135 5L144 8L153 3L162 12L171 6L180 12L189 4L198 10L207 2L216 11L225 5L234 8L243 3L252 12L261 6L270 12L279 4L288 10L297 2L306 11L315 5L324 8L333 3L342 12L351 6L358 12V0H0Z"
      : "M0 12V0L9 8L18 2L27 10L36 1L45 7L54 4L63 9L72 0L81 6L90 0L99 8L108 2L117 10L126 1L135 7L144 4L153 9L162 0L171 6L180 0L189 8L198 2L207 10L216 1L225 7L234 4L243 9L252 0L261 6L270 0L279 8L288 2L297 10L306 1L315 7L324 4L333 9L342 0L351 6L358 0V12H0Z";
  return (
    <svg
      aria-hidden
      className={cx(styles.tear, position === "bottom" ? styles.tearBottom : styles.tearTop)}
      viewBox="0 0 358 12"
      preserveAspectRatio="none"
    >
      <path d={d} />
    </svg>
  );
}
