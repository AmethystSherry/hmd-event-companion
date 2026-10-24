import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GuestPlaceholder } from "@/components/f4/Placeholder";
import { ChatCircle } from "@/components/icons";
import { guestFromToken } from "@/lib/server/access";

export const metadata = { title: "Tanya pembicara · House Moving Day" };

// Placeholder N1 Pertanyaan talkshow. Pintasan Tanya cuma aktif pas Talkshow jalan (F4).
export default function Page({ params }: PageProps<"/t/[token]/tanya">) {
  return (
    <Suspense>
      <Body params={params} />
    </Suspense>
  );
}

async function Body({ params }: Pick<PageProps<"/t/[token]/tanya">, "params">) {
  const { token } = await params;
  if (!(await guestFromToken(token))) redirect(`/t/${token}`);
  return (
    <GuestPlaceholder token={token} title="Tanya pembicara" icon={<ChatCircle size={30} />}>
      Kirim pertanyaan ke pembicara lagi disiapin.
    </GuestPlaceholder>
  );
}
