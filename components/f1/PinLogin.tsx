"use client";

import { useEffect, useState, useTransition } from "react";
import { LockKey, WarningCircle } from "@/components/icons";
import { Badge, Banner, LogoMark, PinPad, Screen, ScreenHeader } from "@/components/ui";
import { mmss } from "@/lib/format";
import type { PinState } from "@/app/panitia/actions";
import f1 from "./f1.module.css";

// P01 masuk panitia · P01b PIN salah (sisa percobaan) · P01c terkunci 5 menit (hitung mundur).
export function PinLogin({
  login,
  initialState = { kind: "idle" },
  initialPin = "",
}: {
  login?: (pin: string) => Promise<PinState>; // kosong = pratinjau
  initialState?: PinState;
  initialPin?: string;
}) {
  const [pin, setPin] = useState(initialPin);
  const [state, setState] = useState<PinState>(initialState);
  const [pending, start] = useTransition();
  // Sisa waktu kunci (ms) dihitung mundur di klien — tanpa Date.now() saat render.
  const [left, setLeft] = useState(initialState.kind === "locked" ? initialState.ms : 0);

  const locked = state.kind === "locked" && left > 0;
  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setLeft((l) => Math.max(0, l - 1000)), 1000);
    return () => clearInterval(t);
  }, [locked]);

  const onChange = (next: string) => {
    setPin(next);
    if (state.kind === "wrong" || (state.kind === "locked" && !locked)) setState({ kind: "idle" });
    if (next.length === 6 && login) {
      start(async () => {
        const res = await login(next);
        setState(res);
        if (res.kind === "locked") setLeft(res.ms);
        if (res.kind !== "wrong") setPin("");
      });
    }
  };

  let message = null;
  if (state.kind === "wrong") {
    message = (
      <Banner tone="danger" icon={<WarningCircle />} title="PIN salah">
        Sisa {state.remaining} percobaan lagi sebelum dikunci 5 menit.
      </Banner>
    );
  } else if (locked) {
    message = (
      <Banner
        tone="warning"
        icon={<LockKey />}
        title={`Terlalu banyak salah · coba lagi ${mmss(left / 1000)}`}
      >
        Demi keamanan, masuk dikunci sementara. Lupa PIN? Tanya koordinator acara.
      </Banner>
    );
  } else if (state.kind === "disabled") {
    message = (
      <Banner tone="warning" icon={<LockKey />} title="Login panitia belum aktif">
        PIN acara belum diatur di server. Tanya koordinator acara.
      </Banner>
    );
  }

  return (
    <Screen>
      <div className={f1.topBar}>
        <div className={f1.rowTight}>
          <LogoMark />
          <Badge tone="crew">Panitia</Badge>
        </div>
      </div>
      <ScreenHeader title="Masuk ruang panitia" />
      <p className="t-body c-label-2">
        Masukkan 6 digit PIN acara dari koordinator. Tidak perlu akun.
      </p>
      <PinPad
        value={pin}
        onChange={onChange}
        state={state.kind === "wrong" ? "error" : "idle"}
        disabled={locked || pending}
        message={message}
      />
    </Screen>
  );
}
