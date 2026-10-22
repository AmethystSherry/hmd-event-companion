import { Suspense } from "react";
import { Screen, Skeleton, TabBar } from "@/components/ui";
import { getStore } from "@/lib/data";
import { requireCrew } from "@/lib/server/access";
import { Scanner } from "./Scanner";

export const metadata = { title: "Scan tiket · Panitia" };

// P05 · Scan tiket (+ sheet P06 Valid / P06b Sudah dipakai / P06c Tidak dikenal).
export default function ScanPage() {
  return (
    <Suspense
      fallback={
        <Screen bottom={<TabBar active="scan" />} bottomHeight={57}>
          <Skeleton height={60} radius={12} />
          <Skeleton height={430} radius={28} />
          <Skeleton height={60} radius={20} />
        </Screen>
      }
    >
      <Content />
    </Suspense>
  );
}

async function Content() {
  await requireCrew("/panitia/scan");
  const count = await (await getStore()).checkInCount();
  return <Scanner initialCount={count} />;
}
