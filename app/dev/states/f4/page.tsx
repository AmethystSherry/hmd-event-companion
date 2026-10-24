import Link from "next/link";
import { Suspense } from "react";
import { ArrowCounterClockwise, CaretRight, Clock, Play, Stop, Users } from "@/components/icons";
import { Badge, Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { getStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { dateLong, timeWib, wibDate } from "@/lib/format";
import { serverNow } from "@/lib/server/clock";
import { setFakeNow } from "../f2/actions";
import styles from "../f1/states.module.css";
import { devFinishActive, devSeedCards, devStartNext } from "./actions";
import { SCREENS } from "./screens";

export const metadata = { title: "F3+F4 states · dev" };

const TONE = { Utama: "neutral", Kasus: "crew", Aksi: "live", Gagal: "danger" } as const;

// /dev/states/f4: daftar layar F3 + F4 (pratinjau data contoh) + alat uji Jeda ⇄ Sesi.
export default function F4States() {
  return (
    <Screen>
      <ScreenHeader
        eyebrow="Dev · Figma C18 (4899:12734) · band 4668:4730"
        title="F3 + F4 · Selama acara"
      />
      {(["Tamu", "Panitia"] as const).map((lane) => (
        <Card key={lane} inset>
          <div className={styles.head}>
            <CardLabel>{lane}</CardLabel>
          </div>
          {SCREENS.filter((s) => s.lane === lane).map((s) => (
            <Link key={s.code} href={`/dev/states/f4/${s.code}`} className={styles.row}>
              <span className={`t-label-emph tabular ${styles.code}`}>{s.code}</span>
              <span className="t-body">{s.name}</span>
              <Badge tone={TONE[s.kind]}>{s.kind}</Badge>
              <CaretRight size={14} className="c-label-3" />
            </Link>
          ))}
        </Card>
      ))}
      {process.env.NODE_ENV !== "production" ? (
        <Suspense>
          <DevTools />
        </Suspense>
      ) : (
        <p className="t-body c-label-2">Alat uji cuma ada di dev.</p>
      )}
    </Screen>
  );
}

const BEFORE_TALKSHOW = "2026-11-08T13:48:00+07:00";
const LATE = "2026-11-08T14:03:00+07:00";

async function DevTools() {
  const store = await getStore();
  const now = await serverNow();
  const event = store.getEvent(HMD_ID)!;
  const sessions = store.listSessions(HMD_ID);
  const active = sessions.find((s) => s.status === "berlangsung");
  const inside = store
    .listGuests(HMD_ID)
    .filter((g) => store.ticketFor(g.id)?.status === "dipakai")
    .slice(0, 2);
  return (
    <>
      <Card>
        <CardLabel>Jam server (cookie, browser ini saja)</CardLabel>
        <p className="t-body-emph">
          {dateLong(wibDate(now))} · {timeWib(now.toISOString())} WIB
        </p>
        <div className={styles.links}>
          <form action={setFakeNow.bind(null, BEFORE_TALKSHOW)}>
            <Button size="sm" type="submit" icon={<Clock />}>
              Hari-H 13.48 (countdown)
            </Button>
          </form>
          <form action={setFakeNow.bind(null, LATE)}>
            <Button size="sm" type="submit" icon={<Clock />}>
              Hari-H 14.03 (lewat jadwal)
            </Button>
          </form>
          <form action={setFakeNow.bind(null, null)}>
            <Button size="sm" variant="secondary" type="submit" icon={<ArrowCounterClockwise />}>
              Pakai jam asli
            </Button>
          </form>
        </div>
      </Card>

      <Card>
        <CardLabel>Jeda ⇄ Sesi (store lokal .data/)</CardLabel>
        <p className="t-body-emph">
          mode {event.mode ?? "pre"}
          {active ? ` · ${active.title} jalan` : ""}
          {event.stateBy ? ` · terakhir diubah ${event.stateBy}` : ""}
        </p>
        <p className="t-label c-label-2">
          Urutan uji: /dev/states/f2 Siapkan data uji → check-in tamu → buka link tamu di bawah
          (layar acara) dan Kontrol acara di HP/tab lain. Tombol di sini bertindak sebagai &quot;HP
          LAIN&quot;: Kontrol acara yang kebuka dapat toast BP02d, layar tamu pindah ≤ 3 dtk.
        </p>
        <div className={styles.links}>
          <form action={devStartNext}>
            <Button size="sm" type="submit" icon={<Play />}>
              Mulai sesi berikutnya (HP lain)
            </Button>
          </form>
          <form action={devFinishActive}>
            <Button size="sm" variant="secondary" type="submit" icon={<Stop />}>
              Selesaikan sesi (HP lain)
            </Button>
          </form>
          <form action={devSeedCards}>
            <Button size="sm" variant="secondary" type="submit" icon={<Users />}>
              Isi kartu tamu BT05
            </Button>
          </form>
        </div>
        <CardLabel>Link</CardLabel>
        <div className={styles.links}>
          {inside.map((g) => (
            <a key={g.id} href={`/t/${g.token}/acara`} target="_blank" className={styles.link}>
              Layar acara {g.name}
            </a>
          ))}
          {!inside.length && (
            <span className="t-label c-label-2">Belum ada tamu yang check-in.</span>
          )}
          <a href={`/panitia/event/${HMD_ID}/kontrol`} target="_blank" className={styles.link}>
            Kontrol acara
          </a>
        </div>
      </Card>
    </>
  );
}
