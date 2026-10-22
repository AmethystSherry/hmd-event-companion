import { Suspense } from "react";
import { ListBullets } from "@/components/icons";
import { HeroState, Screen, ScreenHeader, Skeleton, TabBar, Badge } from "@/components/ui";
import { isCrew, safeNext } from "@/lib/server/access";
import { PinLogin } from "./PinLogin";

export const metadata = { title: "Panitia · House Moving Day" };

// /panitia: belum masuk → P01 PIN. Sudah masuk → tab Kontrol (BP01, dibangun di Phase 5).
export default function PanitiaPage({ searchParams }: PageProps<"/panitia">) {
  return (
    <Suspense
      fallback={
        <Screen>
          <Skeleton height={400} />
        </Screen>
      }
    >
      <Gate searchParams={searchParams} />
    </Suspense>
  );
}

async function Gate({ searchParams }: { searchParams: PageProps<"/panitia">["searchParams"] }) {
  const { next } = await searchParams;
  if (!(await isCrew())) return <PinLogin next={safeNext(next)} />;

  return (
    <Screen bottom={<TabBar active="kontrol" />} bottomHeight={57}>
      <ScreenHeader
        eyebrow="HMD · Minggu, 8 Nov"
        title="Kontrol acara"
        trailing={<Badge tone="crew">Panitia</Badge>}
      />
      <HeroState icon={<ListBullets />} title="Kontrol acara menyusul">
        Mulai/selesaikan sesi dibangun di tahap berikutnya. Buka tab Tamu untuk daftar tamu &
        undangan.
      </HeroState>
    </Screen>
  );
}
