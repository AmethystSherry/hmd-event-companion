import { Suspense } from "react";
import { guestFromToken } from "@/lib/server/access";
import { GuestSkeleton, InvalidLink } from "../InvalidLink";
import { RsvpForm } from "./RsvpForm";

export const metadata = { title: "Konfirmasi hadir · House Moving Day" };

// T02 · Konfirmasi hadir (+ T02c form belum lengkap, T02d gagal kirim).
export default function KonfirmasiPage({ params }: PageProps<"/t/[token]/konfirmasi">) {
  return (
    <Suspense fallback={<GuestSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

// 62812… → 0812… supaya tampil seperti yang biasa diketik tamu.
function displayWa(wa: string | null): string {
  return wa ? `0${wa.slice(2)}` : "";
}

async function Content({ params }: { params: PageProps<"/t/[token]/konfirmasi">["params"] }) {
  const { token } = await params;
  const guest = await guestFromToken(token);
  if (!guest) return <InvalidLink />;
  return (
    <RsvpForm
      token={token}
      initial={{
        name: guest.name,
        ig: guest.ig ? `@${guest.ig}` : "",
        wa: displayWa(guest.wa),
        follow: guest.followConfirmed,
      }}
    />
  );
}
