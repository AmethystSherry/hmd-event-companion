import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LiveRefresh } from "@/components/LiveRefresh";
import { PertanyaanScreen } from "@/components/n1/Pertanyaan";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { eventPhase } from "@/lib/format";
import { questionsView, talkshowFor } from "@/lib/questions";
import { rundownView } from "@/lib/rundown";
import { requireCrew } from "@/lib/server/access";
import { isEventDay, serverNow } from "@/lib/server/clock";
import { ensurePurged } from "@/lib/server/feedback";
import { markAnswered } from "../../../actions";

export const metadata = { title: "Pertanyaan · House Moving Day" };

// N1 · P10 Pertanyaan / P10c kosong (tile Pertanyaan BP02). Talkshow yang jalan, atau talkshow
// terakhir/berikutnya kalau lagi jeda — tetap bisa dibuka & ditandai setelah talkshow selesai.
// Realtime antar-HP lewat LiveRefresh (remote: poll 2 dtk). Tanpa TabBar (sama BP02).
export default function Page({ params }: PageProps<"/panitia/event/[id]/tanya">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={90} radius={12} />
          <Skeleton height={420} />
        </Screen>
      }
    >
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/panitia/event/[id]/tanya">, "params">) {
  await requireCrew();
  const { id } = await params;
  await ensurePurged(id);
  const store = await getStore();
  const event = store.getEvent(id);
  if (!event) notFound();
  const talk = talkshowFor(rundownView(event, store.listSessions(id)).sessions);
  const now = await serverNow();
  return (
    <>
      <PertanyaanScreen
        eventId={id}
        view={questionsView(store.listQuestions(id), store.listGuests(id), talk?.id ?? null)}
        startsAt={talk?.startsAt ?? null}
        phaseLabel={
          isEventDay(event.date, now) ? "Hari-H · Live" : eventPhase(event.date, now).label
        }
        mark={markAnswered}
      />
      <LiveRefresh pollMs={2000} />
    </>
  );
}
