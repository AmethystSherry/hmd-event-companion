import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { KontrolScreen } from "@/components/f2/Kontrol";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { eventPhase } from "@/lib/format";
import { questionsView, talkshowFor } from "@/lib/questions";
import { rundownView } from "@/lib/rundown";
import { requireCrew } from "@/lib/server/access";
import { isEventDay, serverNow } from "@/lib/server/clock";
import { ensurePurged } from "@/lib/server/feedback";
import { closeEvent, finishSession, startSession } from "../../../actions";

export const metadata = { title: "Kontrol acara · House Moving Day" };

// BP02 Kontrol acara: kartu sesi (Mulai/Selesaikan → BP01b/BP03), stat, rundown, Scan tiket.
// F5: semua sesi selesai → kartu BP04 "Jeda terakhir" + sheet BP04b; setelah ditutup → rekap.
// Hanya bisa dibuka kalau tamu & rundown terisi; kalau belum, kembali ke Home event (PE03b).
// Hari-H: Home event otomatis pindah ke sini. Realtime antar-HP panitia lewat SSE (remote: poll
// 2 dtk); state diubah HP lain → toast BP02d (F3).
export default function KontrolPage({ params }: PageProps<"/panitia/event/[id]/kontrol">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={90} radius={12} />
          <Skeleton height={230} />
          <Skeleton height={110} />
          <Skeleton height={240} />
        </Screen>
      }
    >
      <Kontrol params={params} />
    </Suspense>
  );
}

async function Kontrol({ params }: Pick<PageProps<"/panitia/event/[id]/kontrol">, "params">) {
  await requireCrew();
  const { id } = await params;
  await ensurePurged(id); // F5: hapus data per orang H+30 (lazy)
  const store = await getStore();
  const event = store.getEvent(id);
  if (!event) notFound();
  const sessions = store.listSessions(id);
  if (!store.listGuests(id).length || !sessions.length) redirect(`/panitia/event/${id}`);

  const now = await serverNow();
  const eventDay = isEventDay(event.date, now);
  const recap = store.feedbackRecap(id);
  const rundown = rundownView(event, sessions);
  // N1: tile Pertanyaan = semua pertanyaan talkshow ("23 masuk"), border kalau ada yang belum dijawab.
  const asked = questionsView(
    store.listQuestions(id),
    [],
    talkshowFor(rundown.sessions)?.id ?? null,
  );
  return (
    <>
      <KontrolScreen
        event={event}
        rundown={rundown}
        checkIn={store.doorStats(id)}
        photos={store.photoCount(id)}
        questions={{ total: asked.total, open: asked.open.length }}
        eventDay={eventDay}
        phaseLabel={eventDay ? "Hari-H · Live" : eventPhase(event.date, now).label}
        backHref={eventDay ? "/panitia" : `/panitia/event/${id}`}
        serverNow={now.toISOString()}
        start={startSession}
        finish={finishSession}
        finale={{
          canClose: store.canClose(id),
          closedAt: event.closedAt ?? null,
          endsAt: event.endsAt,
          feedback: { respondents: recap.respondents, expected: recap.expected },
        }}
        close={closeEvent}
        state={{
          updatedAt: event.stateUpdatedAt ?? null,
          by: event.stateBy ?? null,
          action: event.stateAction ?? null,
        }}
      />
      <LiveRefresh pollMs={2000} />
    </>
  );
}
