import { Suspense } from "react";
import { Screen, Skeleton, TabBar } from "@/components/ui";
import { getStore } from "@/lib/data";
import { isCrew, safeNext } from "@/lib/server/access";
import { Control } from "./Control";
import { PinLogin } from "./PinLogin";

export const metadata = { title: "Panitia · House Moving Day" };

// /panitia: belum masuk → P01 PIN. Sudah masuk → tab Kontrol (BP01–BP04).
export default function PanitiaPage({ searchParams }: PageProps<"/panitia">) {
  return (
    <Suspense
      fallback={
        <Screen bottom={<TabBar active="kontrol" />} bottomHeight={57}>
          <Skeleton height={60} radius={12} />
          <Skeleton height={200} />
          <Skeleton height={122} radius={22} />
          <Skeleton height={300} />
        </Screen>
      }
    >
      <Gate searchParams={searchParams} />
    </Suspense>
  );
}

async function Gate({ searchParams }: { searchParams: PageProps<"/panitia">["searchParams"] }) {
  const { next } = await searchParams;
  if (!(await isCrew())) return <PinLogin next={safeNext(next, "/panitia")} />;
  const store = await getStore();
  const [snap, stats] = await Promise.all([store.getSnapshot(), store.eventStats()]);
  return <Control initial={snap} stats={stats} />;
}
