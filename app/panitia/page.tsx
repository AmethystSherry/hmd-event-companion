import { Suspense } from "react";
import { EventList } from "@/components/f1/EventList";
import { PinLogin } from "@/components/f1/PinLogin";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { isCrew } from "@/lib/server/access";
import { toEventCard } from "@/lib/view";
import { createEvent, loginWithPin, logout, removeEvent } from "./actions";

export const metadata = { title: "Daftar event · Panitia" };

// /panitia: belum masuk → P01 PIN. Sudah masuk → PE01 Daftar event.
export default function PanitiaPage() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Skeleton height={60} radius={12} />
          <Skeleton height={180} />
          <Skeleton height={180} />
        </Screen>
      }
    >
      <Gate />
    </Suspense>
  );
}

async function Gate() {
  if (!(await isCrew())) return <PinLogin login={loginWithPin} />;
  const store = await getStore();
  const now = new Date();
  const events = store
    .listEvents()
    .map((e) =>
      toEventCard(
        e,
        { guests: store.listGuests(e.id).length, sessions: store.listSessions(e.id).length },
        now,
      ),
    );
  return <EventList events={events} logout={logout} create={createEvent} remove={removeEvent} />;
}
