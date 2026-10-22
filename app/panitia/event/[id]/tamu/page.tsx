import { notFound } from "next/navigation";
import { Suspense } from "react";
import { GuestImport } from "@/components/f1/GuestImport";
import { GuestManager } from "@/components/f1/GuestManager";
import { LiveRefresh } from "@/components/LiveRefresh";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { addDays, dateMedium } from "@/lib/format";
import { requireCrew } from "@/lib/server/access";
import { appOrigin } from "@/lib/server/url";
import { templateFromCsv, toGuestRow } from "@/lib/view";
import {
  addGuest,
  deleteGuest,
  importGuests,
  markInvited,
  markReminderSent,
  undoInvite,
  updateGuest,
} from "../../../actions";

// Tamu & undangan: belum ada tamu → P04k/P04a/P04c (CSV sekali). Ada tamu → P04 (+ P04b tab
// Pengingat H-1). Jawaban tamu masuk realtime (LiveRefresh).
export default function GuestsPage({
  params,
  searchParams,
}: PageProps<"/panitia/event/[id]/tamu">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={90} radius={12} />
          <Skeleton height={100} />
          <Skeleton height={140} />
          <Skeleton height={300} />
        </Screen>
      }
    >
      <View params={params} searchParams={searchParams} />
    </Suspense>
  );
}

const actions = { markInvited, undoInvite, addGuest, updateGuest, deleteGuest, markReminderSent };

async function View({
  params,
  searchParams,
}: Pick<PageProps<"/panitia/event/[id]/tamu">, "params" | "searchParams">) {
  await requireCrew();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const store = await getStore();
  const event = store.getEvent(id);
  if (!event) notFound();
  const guests = store.listGuests(id);

  if (!event.csvImportedAt && guests.length === 0) {
    return <GuestImport eventId={id} eventName={event.name} save={importGuests} />;
  }
  const origin = await appOrigin();
  return (
    <>
      <GuestManager
        eventId={id}
        reminderDateLabel={dateMedium(addDays(event.date, -1))}
        templateFromCsv={templateFromCsv(event)}
        dmTemplate={event.dmTemplate}
        guests={guests.map((g) => toGuestRow(g, event, origin))}
        stats={store.stats(id)}
        actions={actions}
        initialTab={query.tab === "pengingat" ? "pengingat" : "undangan"}
      />
      <LiveRefresh />
    </>
  );
}
