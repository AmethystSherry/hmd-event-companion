import { Suspense } from "react";
import { CrewPlaceholder } from "@/components/f2/Placeholder";
import { Camera } from "@/components/icons";
import { requireCrew } from "@/lib/server/access";

export const metadata = { title: "Galeri kolase · House Moving Day" };

// Foto (stat tile BP02) → galeri kolase N4 untuk panitia (placeholder; galeri tamu = BT07d).
export default function Page({ params }: PageProps<"/panitia/event/[id]/foto">) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/panitia/event/[id]/foto">, "params">) {
  await requireCrew();
  const { id } = await params;
  return (
    <CrewPlaceholder eventId={id} title="Galeri kolase" icon={<Camera size={30} />}>
      Foto tamu udah masuk lewat kulkas polaroid (jumlahnya di Kontrol). Galeri kolase buat panitia
      menyusul.
    </CrewPlaceholder>
  );
}
