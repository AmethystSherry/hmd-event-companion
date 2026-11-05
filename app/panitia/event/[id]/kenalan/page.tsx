import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LiveRefresh } from "@/components/LiveRefresh";
import { PapanKenalanScreen } from "@/components/n5/PapanKenalan";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { eventPhase } from "@/lib/format";
import { kenalanBoard } from "@/lib/kenalan";
import { requireCrew } from "@/lib/server/access";
import { isEventDay, serverNow } from "@/lib/server/clock";
import { ensurePurged } from "@/lib/server/feedback";
import { announceKenalanWinner } from "../../../actions";

export const metadata = { title: "Papan kenalan · House Moving Day" };

// N5 · P14 Papan kenalan (banner Peringkat BP02k) + Dialog P14b. Peringkat realtime antar-HP lewat
// LiveRefresh (remote: poll 2 dtk). Tanpa TabBar (sama BP02 / P10).
export default function Page({ params }: PageProps<"/panitia/event/[id]/kenalan">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={90} radius={12} />
          <Skeleton height={480} />
        </Screen>
      }
    >
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/panitia/event/[id]/kenalan">, "params">) {
  await requireCrew();
  const { id } = await params;
  await ensurePurged(id);
  const store = await getStore();
  const event = store.getEvent(id);
  if (!event) notFound();
  const now = await serverNow();
  return (
    <>
      <PapanKenalanScreen
        eventId={id}
        board={kenalanBoard(store, id)}
        phaseLabel={
          isEventDay(event.date, now) ? "Hari-H · Live" : eventPhase(event.date, now).label
        }
        announce={announceKenalanWinner}
      />
      <LiveRefresh pollMs={2000} />
    </>
  );
}
