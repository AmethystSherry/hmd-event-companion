import { Suspense } from "react";
import { CrewPlaceholder } from "@/components/f2/Placeholder";
import { ChatCircle } from "@/components/icons";
import { requireCrew } from "@/lib/server/access";

export const metadata = { title: "Pertanyaan · House Moving Day" };

// Tanya (stat tile BP02) → tab Tanya N1 (placeholder).
export default function Page({ params }: PageProps<"/panitia/event/[id]/tanya">) {
  return (
    <Suspense>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: Pick<PageProps<"/panitia/event/[id]/tanya">, "params">) {
  await requireCrew();
  const { id } = await params;
  return (
    <CrewPlaceholder eventId={id} title="Pertanyaan" icon={<ChatCircle size={30} />}>
      Pertanyaan talkshow dari tamu (N1) menyusul.
    </CrewPlaceholder>
  );
}
