import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Rundown } from "@/components/f1/Rundown";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { requireCrew } from "@/lib/server/access";
import { deleteSession, saveSession } from "../../../actions";

// PE04k belum ada sesi · PE04 atur sesi · PE04a ubah / hapus sesi (sheet).
export default function RundownPage({ params }: PageProps<"/panitia/event/[id]/rundown">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={90} radius={12} />
          <Skeleton height={320} />
        </Screen>
      }
    >
      <View params={params} />
    </Suspense>
  );
}

async function View({ params }: Pick<PageProps<"/panitia/event/[id]/rundown">, "params">) {
  await requireCrew();
  const { id } = await params;
  const store = await getStore();
  const event = store.getEvent(id);
  if (!event) notFound();
  return (
    <Rundown
      eventId={id}
      eventName={event.name}
      sessions={store.listSessions(id)}
      save={saveSession}
      remove={deleteSession}
    />
  );
}
