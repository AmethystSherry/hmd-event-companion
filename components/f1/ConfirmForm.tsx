"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowClockwise, CaretLeft, Check, LockSimple, WifiSlash } from "@/components/icons";
import {
  Banner,
  Button,
  Card,
  Field,
  IconButton,
  Screen,
  ScreenHeader,
  Toggle,
} from "@/components/ui";
import {
  validateConfirm,
  type ConfirmErrors,
  type ConfirmInput,
  type ConfirmResult,
} from "@/lib/confirm";
import { POTARA_IG } from "@/lib/invite";
import f1 from "./f1.module.css";

// T02 Konfirmasi hadir · T02c form belum lengkap · T02d gagal kirim (isian tetap).
export function ConfirmForm({
  backHref,
  doneHref,
  initial,
  initialStatus = "idle",
  submit,
}: {
  backHref: string;
  doneHref: string;
  initial: { name: string; ig: string; wa: string; follow: boolean };
  initialStatus?: "idle" | "incomplete" | "error";
  submit?: (input: ConfirmInput) => Promise<ConfirmResult>; // kosong = pratinjau
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [touched, setTouched] = useState<Record<string, boolean>>(
    initialStatus === "incomplete" ? { name: true, ig: true, wa: true, follow: true } : {},
  );
  const [serverErrors, setServerErrors] = useState<ConfirmErrors>({});
  const [failed, setFailed] = useState(initialStatus === "error");
  const [pending, start] = useTransition();

  const errors: ConfirmErrors = { ...validateConfirm(v), ...serverErrors };
  const complete = Object.keys(validateConfirm(v)).length === 0;
  const shown = (k: keyof ConfirmErrors) => (touched[k] ? errors[k] : undefined);

  const set = <K extends keyof typeof v>(k: K, value: (typeof v)[K]) => {
    setV((cur) => ({ ...cur, [k]: value }));
    setServerErrors((cur) => ({ ...cur, [k]: undefined }));
  };
  const touch = (k: string) => setTouched((cur) => ({ ...cur, [k]: true }));

  const send = (rsvp: ConfirmInput["rsvp"]) => {
    if (!submit) return;
    start(async () => {
      try {
        const res = await submit({ rsvp, ...v });
        if (res.ok) {
          router.push(doneHref);
          router.refresh();
          return;
        }
        setServerErrors(res.fields);
        setTouched({ name: true, ig: true, wa: true, follow: true });
        setFailed(false);
      } catch {
        setFailed(true); // T02d: sinyal jelek — isian tidak dikosongkan
      }
    });
  };

  return (
    <Screen
      withBack
      bottomHeight={118}
      bottom={
        <>
          <Button
            icon={failed ? <ArrowClockwise /> : <Check />}
            disabled={!complete || pending}
            onClick={() => send("hadir")}
          >
            {failed ? "Coba lagi" : "Saya hadir"}
          </Button>
          <Button
            variant="secondary"
            disabled={pending || !v.name.trim()}
            onClick={() => send("nggak")}
          >
            Maaf, nggak bisa datang
          </Button>
        </>
      }
    >
      <ScreenHeader
        leading={<IconButton href={backHref} label="Kembali" icon={<CaretLeft />} />}
        eyebrow="Satu langkah lagi, kuncimu jadi"
        title="Konfirmasi hadir"
      />
      {failed && (
        <Banner tone="danger" icon={<WifiSlash />} title="Gagal kirim, sinyalnya lemah">
          Tenang, isianmu nggak hilang. Coba lagi ya.
        </Banner>
      )}
      <Card>
        <Field
          label="Nama"
          value={v.name}
          autoComplete="name"
          onChange={(e) => set("name", e.target.value)}
          onBlur={() => touch("name")}
          error={shown("name")}
        />
        <Field
          label="Instagram"
          value={v.ig}
          placeholder="@username"
          autoCapitalize="none"
          autoCorrect="off"
          onChange={(e) => set("ig", e.target.value)}
          onBlur={() => touch("ig")}
          error={shown("ig")}
        />
        <Field
          label="Nomor WhatsApp"
          value={v.wa}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="08xx xxxx xxxx"
          hint="Wajib. Buat kirim pengingat H-1 lewat WA."
          onChange={(e) => set("wa", e.target.value)}
          onBlur={() => touch("wa")}
          error={shown("wa")}
        />
      </Card>
      <Card>
        <div className={f1.between}>
          <div className={f1.stack}>
            <p className="t-body-emph">Saya sudah follow @{POTARA_IG}</p>
            {shown("follow") ? (
              <p className={`t-label ${f1.danger}`}>{errors.follow}</p>
            ) : (
              <p className="t-label c-label-2">Syarat hadir</p>
            )}
          </div>
          <Toggle
            label={`Saya sudah follow @${POTARA_IG}`}
            checked={v.follow}
            onChange={(next) => {
              set("follow", next);
              touch("follow");
            }}
          />
        </div>
      </Card>
      <p className={`t-label ${f1.privacy}`}>
        <LockSimple size={14} />
        Datamu cuma dipakai untuk acara ini dan dihapus 30 hari setelahnya.
      </p>
    </Screen>
  );
}
