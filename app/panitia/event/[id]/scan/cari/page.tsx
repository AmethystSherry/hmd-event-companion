import { Suspense } from "react";
import { Door, DoorFallback } from "@/components/f2/DoorPage";

export const metadata = { title: "Cari nama · House Moving Day" };

// P07 Cari nama · check-in manual (+ P07b `?kamera=gagal`, P07c walk-in). Jalan offline.
export default function CariPage({
  params,
  searchParams,
}: PageProps<"/panitia/event/[id]/scan/cari">) {
  return (
    <Suspense fallback={<DoorFallback />}>
      <Cari params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Cari({
  params,
  searchParams,
}: Pick<PageProps<"/panitia/event/[id]/scan/cari">, "params" | "searchParams">) {
  const { kamera } = await searchParams;
  return <Door params={params} view="cari" cameraFailed={kamera === "gagal"} />;
}
