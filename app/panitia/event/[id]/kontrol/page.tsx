import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { CaretLeft, Lightning } from "@/components/icons";
import { HeroState, IconButton, Screen, ScreenHeader, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { requireCrew } from "@/lib/server/access";

export const metadata = { title: "Kontrol acara · House Moving Day" };

// Kontrol acara (F3) — placeholder. Hanya bisa dibuka kalau detail, tamu, dan rundown terisi
// (tombol "Buka Kontrol acara" di PE03b); kalau belum, kembali ke Home event.
export default function KontrolPage({ params }: PageProps<"/panitia/event/[id]/kontrol">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={90} radius={12} />
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
  if (!store.listGuests(id).length || !store.listSessions(id).length) {
    redirect(`/panitia/event/${id}`);
  }
  return (
    <Screen withBack>
      <ScreenHeader
        leading={
          <IconButton
            href={`/panitia/event/${id}`}
            label="Kembali ke Home event"
            icon={<CaretLeft />}
          />
        }
        eyebrow={event.name}
        title="Kontrol acara"
      />
      <HeroState icon={<Lightning size={30} />} title="Segera hadir">
        Kontrol acara (rundown, check-in, foto & pertanyaan) dibangun di tahap berikutnya.
      </HeroState>
    </Screen>
  );
}
