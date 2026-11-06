"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { HandWaving, Info, QrCode } from "@/components/icons";
import { Segmented, Sheet, TopToast } from "@/components/ui";
import { cx } from "@/lib/cx";
import { initials, keyLabel } from "@/lib/format";
import type { KenalanView } from "@/lib/kenalan";
import { KenalanScanner } from "./KenalanScanner";
import {
  KenalanSelfie,
  type KenalanFriend,
  type KenalanMe,
  type KenalanSelfiePreview,
} from "./KenalanSelfie";
import s from "./n5.module.css";

// N5 · sheet Kenalan di layar acara (`?sheet=kenalan-qr`, dibuka dari tombol Kenalan BT05k / "Scan
// QR lain" BTk4). (6 Nov) Dulu halaman /t/[token]/kenalan; sekarang bottom sheet mengambang di atas
// navbar, tab QR saya dulu (default) baru Scan QR. BTk2 QR saya (QR kenalan dari server) ⇄ BTk1
// Scan QR (`KenalanScanner`), lalu BTk3 Selfie bukti kenalan (`KenalanSelfie`, layar penuh di atas
// sheet) → `onSent(id)` (AcaraScreen buka BTk4). HP pemilik QR pindah sendiri ke BTk4 lewat
// AcaraScreen (LiveRefresh → latest baru).

export type KenalanTab = "qr" | "scan";
type Step = { kind: "scan" } | { kind: "selfie"; friend: KenalanFriend; code: string };

export type KenalanPreview = KenalanSelfiePreview & {
  friend?: KenalanFriend;
  scanError?: boolean; // K8 kamera scan ditolak
  toast?: string;
};

const TOAST_MS = 3500;

export function KenalanQrSheet({
  token,
  me,
  view,
  qr,
  date,
  initialTab = "qr",
  onClose,
  onSent,
  onSelfieChange,
  preview,
}: {
  token: string;
  me: KenalanMe;
  view: KenalanView;
  qr: ReactNode; // QR kenalan (SVG dari server, TicketQr)
  date: string; // "8.11.26"
  initialTab?: KenalanTab;
  onClose: () => void;
  onSent: (introId: string) => void; // selfie terkirim → BTk4
  onSelfieChange?: (on: boolean) => void; // BTk3 jalan → AcaraScreen tahan BTk4/BTk5 otomatis
  preview?: KenalanPreview; // /dev/states/n5: tanpa kamera & jaringan
}) {
  const [tab, setTab] = useState<KenalanTab>(initialTab);
  const [step, setStep] = useState<Step>(
    preview?.step && preview.friend
      ? { kind: "selfie", friend: preview.friend, code: "" }
      : { kind: "scan" },
  );
  const [toast, setToast] = useState<{ key: number; text: string } | null>(
    preview?.toast ? { key: 0, text: preview.toast } : null,
  );

  const show = useCallback((text: string) => setToast({ key: Date.now(), text }), []);
  const onFriend = useCallback(
    (friend: KenalanFriend, code: string) => setStep({ kind: "selfie", friend, code }),
    [],
  );
  useEffect(() => {
    if (!toast || preview) return;
    const t = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(t);
  }, [toast, preview]);

  const selfie = step.kind === "selfie";
  useEffect(() => {
    onSelfieChange?.(selfie);
    return () => onSelfieChange?.(false);
  }, [selfie, onSelfieChange]);

  if (step.kind === "selfie") {
    return (
      <div className={s.selfieLayer}>
        <KenalanSelfie
          token={token}
          me={me}
          friend={step.friend}
          code={step.code}
          date={date}
          onCancel={() => setStep({ kind: "scan" })}
          onRejected={(text) => {
            setStep({ kind: "scan" });
            show(text);
          }}
          onSent={onSent}
          preview={preview}
        />
      </div>
    );
  }

  return (
    <>
      <Sheet open aboveNav onClose={onClose} title="Kenalan" className={s.qrSheet}>
        <p aria-hidden className={cx("t-card-title", s.title)}>
          Kenalan
        </p>
        <Segmented
          look="tabs"
          label="Kenalan"
          value={tab}
          onChange={setTab}
          options={[
            { value: "qr", label: "QR saya" },
            { value: "scan", label: "Scan QR" },
          ]}
        />

        {/* Dua tab ditumpuk di satu sel grid (yang nggak aktif disembunyikan, `inert`): tinggi sheet =
            panel tertinggi, jadi nggak loncat waktu ganti tab. */}
        <div className={s.tabBody}>
          <div className={s.tabPanel} data-active={tab === "qr" || undefined} inert={tab !== "qr"}>
            <section className={s.qrCard} aria-label="QR kenalan kamu">
              <div className={s.who}>
                <span aria-hidden className={s.whoAvatar}>
                  {initials(me.name)}
                </span>
                <span className={s.whoText}>
                  <span className={s.whoName}>{me.name}</span>
                  <span className={s.whoMeta}>
                    @{me.ig}
                    {me.role ? ` · ${me.role}` : ""}
                  </span>
                </span>
              </div>
              <div className={s.plate}>{qr}</div>
              <div className={s.chips}>
                <span>{view.points} point</span>
                {view.rank && <span>Peringkat #{view.rank}</span>}
                <span>{keyLabel(me.keyNo)}</span>
              </div>
            </section>
            <div className={s.info}>
              <span aria-hidden className={s.infoIcon}>
                <QrCode size={22} />
              </span>
              <span className={s.infoText}>
                <span className="t-label-emph">Tunjukin QR ini ke temanmu</span>
                <span className="t-caption c-label-2">
                  Biar dia yang scan. Habis discan, kalian langsung selfie berdua.
                </span>
              </span>
            </div>
          </div>
          <div
            className={s.tabPanel}
            data-active={tab === "scan" || undefined}
            inert={tab !== "scan"}
          >
            <KenalanScanner
              token={token}
              active={tab === "scan"}
              onFriend={onFriend}
              onMessage={show}
              className={s.scanBox}
              preview={preview}
            />
            <div className={s.info}>
              <span aria-hidden className={s.infoIcon}>
                <HandWaving size={22} />
              </span>
              <span className={s.infoText}>
                <span className="t-label-emph">Scan QR teman yang mau dikenalin</span>
                <span className="t-caption c-label-2">
                  Minta temanmu buka tab QR saya. Habis discan, kalian langsung selfie berdua.
                </span>
              </span>
            </div>
          </div>
        </div>
      </Sheet>
      {toast && <TopToast key={toast.key} icon={<Info size={20} />} title={toast.text} />}
    </>
  );
}
