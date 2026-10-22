import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getStore } from "@/lib/data";
import { guestFromToken } from "@/lib/server/access";
import { GuestSkeleton, InvalidLink } from "../InvalidLink";
import { DoorScreen, UsedScreen } from "../TicketScreens";

export const metadata = { title: "Tiket · House Moving Day" };

// /t/{token}/tiket: buka tiket lagi. Sudah masuk → T03b (bukti, QR nonaktif); belum → T05.
export default function TiketPage({ params }: PageProps<"/t/[token]/tiket">) {
  return (
    <Suspense fallback={<GuestSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/t/[token]/tiket">["params"] }) {
  const { token } = await params;
  const guest = await guestFromToken(token);
  if (!guest) return <InvalidLink />;
  if (guest.rsvp !== "hadir") redirect(`/t/${token}`);
  const ticket = await (await getStore()).getTicketForGuest(guest.id);
  if (ticket?.status === "dipakai") return <UsedScreen guest={guest} token={token} />;
  return <DoorScreen guest={guest} token={token} />;
}
