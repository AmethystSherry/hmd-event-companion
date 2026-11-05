import { redirect } from "next/navigation";
import { Suspense } from "react";
import { KenalanApp } from "@/components/n5/KenalanApp";
import { RegisterOffline } from "@/components/RegisterOffline";
import { TicketQr } from "@/components/TicketQr";
import { Screen, Skeleton } from "@/components/ui";
import { cardOf } from "@/lib/card";
import { getStore } from "@/lib/data";
import { firstName } from "@/lib/format";
import { kenalanView } from "@/lib/kenalan";
import { polaroidDate } from "@/lib/photo";
import { guestFromToken } from "@/lib/server/access";
import { kenalanCode } from "@/lib/server/kenalan";

export const metadata = { title: "Kenalan · House Moving Day" };

// N5 · BTk1 Scan QR / BTk2 QR saya / BTk3 Selfie (KenalanApp). Cuma tamu udah check-in selagi
// papan kenalan kebuka (K7, K9): belum masuk → tiket, acara ditutup → BT12, belum mulai / pemenang
// udah diumumin → layar acara (BTk5 kebuka di sana). ?tab=qr = tab QR saya, ?dari=tamu = dari BT05k.
export default function KenalanPage({ params, searchParams }: PageProps<"/t/[token]/kenalan">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={120} />
          <Skeleton height={440} />
        </Screen>
      }
    >
      <Kenalan params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Kenalan({
  params,
  searchParams,
}: Pick<PageProps<"/t/[token]/kenalan">, "params" | "searchParams">) {
  const { token } = await params;
  const q = await searchParams;
  const guest = await guestFromToken(token);
  const store = await getStore();
  const event = guest ? store.getEvent(guest.eventId) : null;
  if (!guest || !event || store.ticketFor(guest.id)?.status !== "dipakai") {
    redirect(`/t/${token}`);
  }
  if (event.mode === "closed") redirect(`/t/${token}/selesai`);
  const view = kenalanView(store, guest.id);
  if (!view?.open) redirect(`/t/${token}/acara`);

  return (
    <>
      <KenalanApp
        token={token}
        me={{
          name: guest.name,
          firstName: firstName(guest.name),
          ig: guest.ig,
          role: cardOf(guest).role,
          keyNo: guest.keyNo,
        }}
        view={view}
        qr={<TicketQr payload={kenalanCode(guest.id)} label="QR kenalan kamu" />}
        date={polaroidDate(event.date)}
        initialTab={q.tab === "qr" ? "qr" : "scan"}
        fromTamu={q.dari === "tamu"}
      />
      <RegisterOffline />
    </>
  );
}
