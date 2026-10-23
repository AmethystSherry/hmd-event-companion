import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { KontrolScreen } from "@/components/f2/Kontrol";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { doorCardCopy } from "@/lib/door";
import { eventPhase } from "@/lib/format";
import { requireCrew } from "@/lib/server/access";
import { isEventDay, serverNow } from "@/lib/server/clock";

export const metadata = { title: "Kontrol acara · House Moving Day" };

// BP00 Kontrol acara (F2: card Pintu masuk + Scan tiket; rundown penuh di F3).
// Hanya bisa dibuka kalau tamu & rundown terisi; kalau belum, kembali ke Home event (PE03b).
// Hari-H: Home event otomatis pindah ke sini.
export default function KontrolPage({ params }: PageProps<"/panitia/event/[id]/kontrol">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={90} radius={12} />
          <Skeleton height={190} />
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
  const stats = store.doorStats(id);
  const phase = eventPhase(event.date, now);
  return (
    <>
      <KontrolScreen
        event={event}
        sessions={sessions}
        checkIn={stats}
        eventDay={eventDay}
        phaseLabel={eventDay ? "Hari-H · Live" : phase.label}
        backHref={eventDay ? "/panitia" : `/panitia/event/${id}`}
        door={doorCardCopy({
          ...stats,
          date: event.date,
          startsAt: event.startsAt,
          secondSessionAt: sessions[1]?.startsAt ?? null,
          now,
          eventDay,
        })}
      />
      <LiveRefresh />
    </>
  );
}
