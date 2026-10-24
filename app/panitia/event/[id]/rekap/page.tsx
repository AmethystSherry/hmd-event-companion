import { notFound } from "next/navigation";
import { Suspense } from "react";
import { RekapScreen } from "@/components/f5/Rekap";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { purgeAt, summaryView } from "@/lib/feedback";
import { dateLong, wibDate } from "@/lib/format";
import { requireCrew } from "@/lib/server/access";
import { serverNow } from "@/lib/server/clock";
import { ensurePurged } from "@/lib/server/feedback";

export const metadata = { title: "Rekap buku tamu · House Moving Day" };

// F5 · P11 Rekap buku tamu (+ P11b/P11c/P11d). Sesi PIN saja; sebelum acara ditutup boleh dibuka
// (P11c). Feedback baru masuk → rev → SSE → angka ikut berubah tanpa reload.
export default function RecapPage({ params }: PageProps<"/panitia/event/[id]/rekap">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={90} radius={12} />
          <Skeleton height={110} />
          <Skeleton height={160} />
          <Skeleton height={140} />
        </Screen>
      }
    >
      <Recap params={params} />
    </Suspense>
  );
}

async function Recap({ params }: Pick<PageProps<"/panitia/event/[id]/rekap">, "params">) {
  await requireCrew();
  const { id } = await params;
  await ensurePurged(id); // lewat 8 Des → P11d
  const store = await getStore();
  const event = store.getEvent(id);
  if (!event) notFound();

  const now = await serverNow();
  const recap = store.feedbackRecap(id);
  return (
    <>
      <RekapScreen
        eventId={id}
        backHref={`/panitia/event/${id}/kontrol`}
        recap={recap}
        summary={summaryView(event.summary, recap, now.getTime())}
        purgeDate={dateLong(wibDate(purgeAt(event.date))).split(", ")[1]}
        csvHref={`/api/panitia/event/${id}/rekap.csv`}
      />
      <LiveRefresh />
    </>
  );
}
