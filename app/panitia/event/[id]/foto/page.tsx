import { notFound } from "next/navigation";
import { Suspense } from "react";
import { FotoMasukScreen } from "@/components/f3/FotoMasuk";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { eventPhase } from "@/lib/format";
import { toKolasePhotos } from "@/lib/kolase";
import { sessionShort } from "@/lib/data/sessionInfo";
import { requireCrew } from "@/lib/server/access";
import { isEventDay, serverNow } from "@/lib/server/clock";
import { ensurePurged } from "@/lib/server/feedback";

export const metadata = { title: "Foto masuk · House Moving Day" };

// F3 v3 · P13 Foto masuk (tile Foto BP02): semua foto tamu, filter per sesi, hapus foto yang nggak
// pantas, unduh ZIP. Realtime antar-HP lewat LiveRefresh (remote: poll 2 dtk). Tanpa TabBar.
export default function Page({ params }: PageProps<"/panitia/event/[id]/foto">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={120} radius={12} />
          <Skeleton height={420} />
        </Screen>
      }
    >
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/panitia/event/[id]/foto">, "params">) {
  await requireCrew();
  const { id } = await params;
  await ensurePurged(id); // H+30: foto ikut dihapus
  const store = await getStore();
  const event = store.getEvent(id);
  if (!event) notFound();
  const now = await serverNow();
  const sessions = store.listSessions(id);
  return (
    <>
      <FotoMasukScreen
        eventId={id}
        phaseLabel={isEventDay(event.date, now) ? "Hari-H" : eventPhase(event.date, now).label}
        photos={toKolasePhotos(store.listPhotos(id), store.listGuests(id), sessions, null)}
        sessions={sessions.map((x) => ({ id: x.id, title: sessionShort(x) }))}
      />
      <LiveRefresh pollMs={2000} />
    </>
  );
}
