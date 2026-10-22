import { Suspense } from "react";
import { CaretLeft, Scroll } from "@/components/icons";
import { HeroState, IconButton, Screen, ScreenHeader, Skeleton } from "@/components/ui";
import { requireCrew } from "@/lib/server/access";

export const metadata = { title: "Naskah MC · Panitia" };

// P09 · Naskah MC (N2, Phase 7). Sementara: penanda dari BP02.
export default function NaskahPage() {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={300} />
        </Screen>
      }
    >
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireCrew("/panitia/naskah");
  return (
    <Screen withBack>
      <ScreenHeader
        leading={<IconButton href="/panitia" label="Kembali" icon={<CaretLeft />} />}
        eyebrow="Panitia · MC"
        title="Naskah MC"
      />
      <HeroState icon={<Scroll />} title="Naskah menyusul">
        Naskah per transisi sesi dibangun di tahap nilai tambah (N2).
      </HeroState>
    </Screen>
  );
}
