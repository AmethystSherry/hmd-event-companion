import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { EventHome } from "@/components/f1/EventHome";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { requireCrew } from "@/lib/server/access";
import { isEventDay, serverNow } from "@/lib/server/clock";
import { deleteEvent, updateEvent } from "../../actions";

// PE03 Home event (kosong) · PE03b udah terisi · PE03e ubah detail · PE03h hapus event.
// Hari-H (F2): kalau tamu & rundown udah siap, langsung ke BP00 Kontrol acara.
export default function EventPage({ params }: PageProps<"/panitia/event/[id]">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={90} radius={12} />
          <Skeleton height={90} />
          <Skeleton height={140} />
          <Skeleton height={140} />
        </Screen>
      }
    >
      <Home params={params} />
    </Suspense>
  );
}

async function Home({ params }: Pick<PageProps<"/panitia/event/[id]">, "params">) {
  await requireCrew();
  const { id } = await params;
  const store = await getStore();
  const event = store.getEvent(id);
  if (!event) notFound();
  const now = await serverNow();
  const sessions = store.listSessions(id);
  if (isEventDay(event.date, now) && store.listGuests(id).length && sessions.length) {
    redirect(`/panitia/event/${id}/kontrol`);
  }
  return (
    <>
      <EventHome
        event={event}
        stats={store.stats(id)}
        sessions={sessions}
        now={now.toISOString()}
        update={updateEvent}
        remove={deleteEvent}
      />
      <LiveRefresh />
    </>
  );
}
