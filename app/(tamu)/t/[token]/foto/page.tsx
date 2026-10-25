import { redirect } from "next/navigation";
import { Suspense } from "react";
import { KolaseApp } from "@/components/n4/KolaseApp";
import { RegisterOffline } from "@/components/RegisterOffline";
import { Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { firstName } from "@/lib/format";
import { polaroidDate } from "@/lib/photo";
import { guestFromToken } from "@/lib/server/access";

export const metadata = { title: "Kulkas polaroid · House Moving Day" };

// N4 · Kamera kolase (BT06/BT06b). Hasil jepret = sheet di layar acara (?sheet=foto&id=…).
// Hanya tamu yang udah check-in; acara ditutup → BT12 (kolase lengkap T15). Kamera & kompres jalan
// di HP (KolaseApp).
export default function PhotoPage({ params }: PageProps<"/t/[token]/foto">) {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100dvh", background: "#0a0a0a", padding: 16 }}>
          <Skeleton height={420} radius={6} />
        </div>
      }
    >
      <Photo params={params} />
    </Suspense>
  );
}

async function Photo({ params }: Pick<PageProps<"/t/[token]/foto">, "params">) {
  const { token } = await params;
  const guest = await guestFromToken(token);
  const store = await getStore();
  const event = guest ? store.getEvent(guest.eventId) : null;
  if (!guest || !event || store.ticketFor(guest.id)?.status !== "dipakai") {
    redirect(`/t/${token}`);
  }
  if (event.mode === "closed") redirect(`/t/${token}/selesai`); // F5 · BT12

  const lastOwn = store.listPhotos(event.id).find((p) => p.guestId === guest.id);
  return (
    <>
      <KolaseApp
        token={token}
        name={firstName(guest.name)}
        date={polaroidDate(event.date)}
        backHref={`/t/${token}/acara`}
        lastOwnId={lastOwn?.id ?? null}
      />
      <RegisterOffline />
    </>
  );
}
