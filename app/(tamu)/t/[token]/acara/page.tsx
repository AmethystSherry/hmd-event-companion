import { redirect } from "next/navigation";
import { Suspense } from "react";
import { guestFromToken } from "@/lib/server/access";
import { GuestSkeleton, InvalidLink } from "../InvalidLink";
import { EventLoader } from "./EventLoader";

export const metadata = { title: "Acara · House Moving Day" };

// Layar acara tamu: JEDA ⇄ SESI mengikuti panitia (BT03/BT10/BT08/BT11, BT04, S01).
export default function AcaraPage({ params }: PageProps<"/t/[token]/acara">) {
  return (
    <Suspense fallback={<GuestSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/t/[token]/acara">["params"] }) {
  const { token } = await params;
  const guest = await guestFromToken(token);
  if (!guest) return <InvalidLink />;
  if (guest.rsvp !== "hadir") redirect(`/t/${token}`);
  return <EventLoader guest={guest} token={token} />;
}
