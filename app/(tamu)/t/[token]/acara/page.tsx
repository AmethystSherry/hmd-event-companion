import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Coffee } from "@/components/icons";
import { HeroState, Screen } from "@/components/ui";
import { guestFromToken } from "@/lib/server/access";
import { GuestSkeleton, InvalidLink } from "../InvalidLink";

// Layar acara JEDA ⇄ SESI (BT03/BT08…) dibangun di Phase 5. Sementara: penanda setelah BT02.
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
  return (
    <Screen>
      <HeroState icon={<Coffee />} title="Layar acara menyusul">
        Jeda & sesi live dibangun di tahap berikutnya.
      </HeroState>
    </Screen>
  );
}
