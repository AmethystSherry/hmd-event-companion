import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { KontrolScreen } from "@/components/f2/Kontrol";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { eventPhase } from "@/lib/format";
import { rundownView } from "@/lib/rundown";
import { requireCrew } from "@/lib/server/access";
import { isEventDay, serverNow } from "@/lib/server/clock";
import { finishSession, startSession } from "../../../actions";

export const metadata = { title: "Kontrol acara · House Moving Day" };

// BP00 Kontrol acara: kartu sesi (Mulai/Selesaikan → BP00b/BP00a), stat, rundown, Scan tiket.
// Hanya bisa dibuka kalau tamu & rundown terisi; kalau belum, kembali ke Home event (PE03b).
// Hari-H: Home event otomatis pindah ke sini. Realtime antar-HP panitia lewat SSE.
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
  const store = await getStore();
  const event = store.getEvent(id);
  if (!event) notFound();
  const sessions = store.listSessions(id);
  if (!store.listGuests(id).length || !sessions.length) redirect(`/panitia/event/${id}`);

  const now = await serverNow();
  const eventDay = isEventDay(event.date, now);
  return (
    <>
      <KontrolScreen
        event={event}
        rundown={rundownView(event, sessions)}
        checkIn={store.doorStats(id)}
        eventDay={eventDay}
        phaseLabel={eventDay ? "Hari-H · Live" : eventPhase(event.date, now).label}
        backHref={eventDay ? "/panitia" : `/panitia/event/${id}`}
        serverNow={now.toISOString()}
        start={startSession}
        finish={finishSession}
      />
      <LiveRefresh />
    </>
  );
}
