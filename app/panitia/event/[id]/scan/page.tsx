import { Suspense } from "react";
import { Door, DoorFallback } from "@/components/f2/DoorPage";

export const metadata = { title: "Scan tiket · House Moving Day" };

// P05 Scan tiket (+ P05b, P06/P06b/P06c). Hanya hari-H; sebelum itu kembali ke BP00.
export default function ScanPage({ params }: PageProps<"/panitia/event/[id]/scan">) {
  return (
    <Suspense fallback={<DoorFallback />}>
      <Door params={params} view="scan" />
    </Suspense>
  );
}
