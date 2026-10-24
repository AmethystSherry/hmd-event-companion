import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GuestPlaceholder } from "@/components/f4/Placeholder";
import { UserPlus } from "@/components/icons";
import { guestFromToken } from "@/lib/server/access";

export const metadata = { title: "Kartu kamu · House Moving Day" };

// Placeholder T11 Ubah kartu kamu (N3). Dari "Ubah" di BT05 Tamu di sini (F4).
export default function Page({ params }: PageProps<"/t/[token]/kartu">) {
  return (
    <Suspense>
      <Body params={params} />
    </Suspense>
  );
}

async function Body({ params }: Pick<PageProps<"/t/[token]/kartu">, "params">) {
  const { token } = await params;
  if (!(await guestFromToken(token))) redirect(`/t/${token}`);
  return (
    <GuestPlaceholder token={token} title="Kartu kamu" icon={<UserPlus size={30} />}>
      Ubah kartu kenalan (peran &amp; topik ngobrol) lagi disiapin.
    </GuestPlaceholder>
  );
}
