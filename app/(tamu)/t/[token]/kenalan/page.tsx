import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getStore } from "@/lib/data";
import { guestFromToken } from "@/lib/server/access";
import { GuestSkeleton, InvalidLink } from "../InvalidLink";
import { IntroForm } from "./IntroForm";

export const metadata = { title: "Kenalan dikit · House Moving Day" };

// T02b · Kenalan dikit (opsional, langkah 2 dari 2 setelah konfirmasi hadir).
export default function KenalanPage({ params }: PageProps<"/t/[token]/kenalan">) {
  return (
    <Suspense fallback={<GuestSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

async function Content({ params }: { params: PageProps<"/t/[token]/kenalan">["params"] }) {
  const { token } = await params;
  const guest = await guestFromToken(token);
  if (!guest) return <InvalidLink />;
  if (guest.rsvp !== "hadir") redirect(`/t/${token}`);
  const profile = await (await getStore()).getProfile(guest.id);
  return (
    <IntroForm
      token={token}
      initialSkills={profile?.skills ?? []}
      initialAsbun={profile?.asbun ?? []}
    />
  );
}
