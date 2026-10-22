import { Suspense } from "react";
import { ChatCircle } from "@/components/icons";
import { HeroState, Screen, ScreenHeader, Skeleton, TabBar } from "@/components/ui";
import { requireCrew } from "@/lib/server/access";

export const metadata = { title: "Pertanyaan · Panitia" };

// P10 · Pertanyaan moderator (N1, Phase 7). Sementara: penanda supaya tab Tanya tidak 404.
export default function TanyaPage() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Skeleton height={300} />
        </Screen>
      }
    >
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireCrew("/panitia/tanya");
  return (
    <Screen bottom={<TabBar active="tanya" />} bottomHeight={57}>
      <ScreenHeader eyebrow="Talkshow · moderator" title="Pertanyaan" />
      <HeroState icon={<ChatCircle />} title="Pengelompokan menyusul">
        Daftar pertanyaan terkelompok dibangun di tahap nilai tambah (N1).
      </HeroState>
    </Screen>
  );
}
