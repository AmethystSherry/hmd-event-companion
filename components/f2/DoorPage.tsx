import { notFound } from "next/navigation";
import { RegisterOffline } from "@/components/RegisterOffline";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { requireCrew } from "@/lib/server/access";
import { DoorApp, type DoorView } from "./DoorApp";

// Route /scan & /scan/cari (server): guard panitia (sejak sebelum hari-H, tamu bisa datang lebih
// awal), lalu DoorApp (klien).
// HTML-nya kerangka saja: data tamu dimuat di HP (manifest → IndexedDB) supaya jalan offline.
export function DoorFallback() {
  return (
    <Screen>
      <Skeleton height={90} radius={12} />
      <Skeleton height={380} />
      <Skeleton height={54} radius={27} />
    </Screen>
  );
}

export async function Door({
  params,
  view,
  cameraFailed,
}: {
  params: Promise<{ id: string }>;
  view: DoorView;
  cameraFailed?: boolean;
}) {
  await requireCrew();
  const { id } = await params;
  const store = await getStore();
  const event = store.getEvent(id);
  if (!event) notFound();
  return (
    <>
      <DoorApp eventId={id} eventName={event.name} initialView={view} cameraFailed={cameraFailed} />
      <RegisterOffline />
    </>
  );
}
