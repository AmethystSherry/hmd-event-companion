import { cookies } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { ChatCircle, CaretRight, Play, Trash, WifiSlash } from "@/components/icons";
import { Badge, Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { getStore } from "@/lib/data";
import { HMD_ID } from "@/lib/data/seed";
import { questionsView, TANYA_FAIL_COOKIE, talkshowFor } from "@/lib/questions";
import { rundownView } from "@/lib/rundown";
import styles from "../f1/states.module.css";
import { devClearQuestions, devSeedQuestions, devSetTanyaFail, devStartTalkshow } from "./actions";
import { SCREENS } from "./screens";

export const metadata = { title: "N1 states · dev" };

const TONE = { Utama: "neutral", Kasus: "crew", Aksi: "live", Gagal: "danger" } as const;

// /dev/states/n1: daftar layar N1 Pertanyaan talkshow (pratinjau data contoh) + alat uji.
export default function N1States() {
  return (
    <Screen>
      <ScreenHeader eyebrow="Dev · Figma section N1 (4669:4888)" title="N1 · Pertanyaan talkshow" />
      {(["Tamu", "Panitia"] as const).map((lane) => (
        <Card key={lane} inset>
          <div className={styles.head}>
            <CardLabel>{lane}</CardLabel>
          </div>
          {SCREENS.filter((s) => s.lane === lane).map((s) => (
            <Link key={s.code} href={s.href ?? `/dev/states/n1/${s.code}`} className={styles.row}>
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

async function DevTools() {
  const store = await getStore();
  const fail = (await cookies()).get(TANYA_FAIL_COOKIE)?.value === "1";
  const event = store.getEvent(HMD_ID)!;
  const sessions = store.listSessions(HMD_ID);
  const active = sessions.find((s) => s.status === "berlangsung");
  const talk = talkshowFor(rundownView(event, sessions).sessions);
  const view = questionsView(store.listQuestions(HMD_ID), [], talk?.id ?? null);
  const inside = store
    .listGuests(HMD_ID)
    .filter((g) => store.ticketFor(g.id)?.status === "dipakai")
    .slice(0, 2);
  return (
    <Card>
      <CardLabel>Alat uji (store lokal .data/)</CardLabel>
      <p className="t-body-emph">
        mode {event.mode ?? "pre"}
        {active ? ` · ${active.title} jalan` : ""} · {view.total} pertanyaan · {view.answeredCount}{" "}
        dijawab
      </p>
      <p className="t-label c-label-2">
        Urutan uji: /dev/states/f2 Siapkan data uji → check-in tamu → Mulai Talkshow di sini → buka
        layar acara tamu → Tanya. P10 kebuka di tab lain ikut update ≤ 3 dtk. Simulasi gagal kirim:
        pertanyaan tetap tersimpan tapi HP tamu dapat BT08b; matikan lalu tap Kirim lagi → nggak
        dobel.
      </p>
      <div className={styles.links}>
        <form action={devStartTalkshow}>
          <Button size="sm" type="submit" icon={<Play />}>
            Mulai Talkshow (HP lain)
          </Button>
        </form>
        <form action={devSeedQuestions}>
          <Button size="sm" variant="secondary" type="submit" icon={<ChatCircle />}>
            Isi 23 pertanyaan dummy
          </Button>
        </form>
        <form action={devClearQuestions}>
          <Button size="sm" variant="secondary" type="submit" icon={<Trash />}>
            Hapus semua pertanyaan
          </Button>
        </form>
        <form action={devSetTanyaFail.bind(null, !fail)}>
          <Button size="sm" variant="secondary" type="submit" icon={<WifiSlash />}>
            {fail ? "Matikan simulasi gagal kirim" : "Simulasi gagal kirim"}
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
        {!inside.length && <span className="t-label c-label-2">Belum ada tamu yang check-in.</span>}
        <a href={`/panitia/event/${HMD_ID}/kontrol`} target="_blank" className={styles.link}>
          Kontrol acara
        </a>
        <a href={`/panitia/event/${HMD_ID}/tanya`} target="_blank" className={styles.link}>
          P10 Pertanyaan
        </a>
      </div>
    </Card>
  );
}
