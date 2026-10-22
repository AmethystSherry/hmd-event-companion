"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
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
import { submitRsvp, type RsvpState } from "../actions";
import styles from "../guest.module.css";

type Values = { name: string; ig: string; wa: string; follow: boolean };

// T02 · Konfirmasi hadir. Tombol "Saya hadir" tampil nonaktif (T02c) sampai IG & follow terisi;
// kalau tetap ditekan, pesan error per field muncul. Gagal kirim → T02d, isian tidak hilang.
export function RsvpForm({ token, initial }: { token: string; initial: Values }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [touched, setTouched] = useState(false);
  const [state, action, pending] = useActionState<RsvpState, FormData>(
    submitRsvp.bind(null, token),
    { status: "idle" },
  );

  useEffect(() => {
    if (state.status !== "done") return;
    router.replace(state.rsvp === "hadir" ? `/t/${token}/kenalan` : `/t/${token}`);
    router.refresh();
  }, [state, router, token]);

  const igEmpty = values.ig.replace(/^@+/, "").trim() === "";
  const complete = !igEmpty && values.follow;
  const showErrors = touched || state.status === "invalid";
  const serverFields = state.status === "invalid" ? state.fields : {};
  const igError =
    (showErrors && igEmpty && "Instagram wajib diisi, biar teman gampang nyapa kamu.") ||
    serverFields.ig;
  const followError =
    showErrors && !values.follow ? "Wajib — follow dulu ya, ini syarat hadir" : undefined;
  const failed = state.status === "error";

  const set = (patch: Partial<Values>) => setValues((v) => ({ ...v, ...patch }));

  return (
    <form
      action={action}
      onSubmit={(e) => {
        const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        if (submitter?.value === "hadir" && !complete) {
          e.preventDefault();
          setTouched(true);
        }
      }}
    >
      <input type="hidden" name="follow" value={values.follow ? "true" : "false"} />
      <Screen
        withBack
        bottomHeight={118}
        bottom={
          <>
            <Button
              type="submit"
              name="rsvp"
              value="hadir"
              icon={failed ? <ArrowClockwise /> : <Check />}
              aria-disabled={!complete || pending}
              disabled={pending}
            >
              {failed ? "Coba lagi" : "Saya hadir"}
            </Button>
            <Button type="submit" name="rsvp" value="tidak" variant="secondary" disabled={pending}>
              Maaf, nggak bisa datang
            </Button>
          </>
        }
      >
        <ScreenHeader
          leading={<IconButton href={`/t/${token}`} label="Kembali" icon={<CaretLeft />} />}
          eyebrow="Satu langkah lagi, kuncimu jadi"
          title="Konfirmasi hadir"
        />
        {failed && (
          <Banner tone="danger" icon={<WifiSlash />} title="Gagal kirim, sinyalnya lemah">
            Tenang, isianmu nggak hilang. Coba lagi ya.
          </Banner>
        )}
        <Card className={styles.form}>
          <Field
            label="Nama"
            name="name"
            autoComplete="name"
            value={values.name}
            onChange={(e) => set({ name: e.target.value })}
          />
          <Field
            label="Instagram"
            name="ig"
            placeholder="@username"
            autoComplete="off"
            autoCapitalize="none"
            value={values.ig}
            onChange={(e) => set({ ig: e.target.value })}
            error={igError || undefined}
          />
          <Field
            label="WhatsApp (opsional)"
            name="wa"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xx xxxx xxxx"
            value={values.wa}
            onChange={(e) => set({ wa: e.target.value })}
            error={serverFields.wa}
            hint="Biar kami bisa kirim pengingat H-1."
          />
        </Card>
        <Card className={styles.toggleCard}>
          <span className={styles.stack}>
            <span className="t-body-emph">Saya sudah follow @potarastudio</span>
            <span className={followError ? `t-label ${styles.dangerText}` : "t-label c-label-2"}>
              {followError ?? "Syarat hadir"}
            </span>
          </span>
          <Toggle
            label="Saya sudah follow @potarastudio"
            checked={values.follow}
            onChange={(follow) => set({ follow })}
          />
        </Card>
        {!failed && (
          <p className={`t-label ${styles.privacy}`}>
            <LockSimple size={16} />
            Datamu cuma dipakai untuk acara ini dan dihapus 30 hari setelahnya.
          </p>
        )}
      </Screen>
    </form>
  );
}
