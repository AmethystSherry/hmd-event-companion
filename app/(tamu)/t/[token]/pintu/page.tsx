import { redirect } from "next/navigation";
import { Suspense } from "react";
import { guestFromToken } from "@/lib/server/access";
import { GuestSkeleton, InvalidLink } from "../InvalidLink";
import { DoorScreen } from "../TicketScreens";

export const metadata = { title: "Tiket hari-H · House Moving Day" };

// /t/{token}/pintu: T05 Tiket hari-H kapan saja (link langsung dari pengingat & untuk uji).
// Di hari-H, /t/{token} juga otomatis menampilkan layar ini.
export default function PintuPage({ params }: PageProps<"/t/[token]/pintu">) {
  return (
    <Suspense fallback={<GuestSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/t/[token]/pintu">["params"] }) {
  const { token } = await params;
  const guest = await guestFromToken(token);
  if (!guest) return <InvalidLink />;
  if (guest.rsvp !== "hadir") redirect(`/t/${token}`);
  return <DoorScreen guest={guest} token={token} />;
}
