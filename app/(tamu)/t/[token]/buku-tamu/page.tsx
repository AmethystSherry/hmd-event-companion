import { redirect } from "next/navigation";
import { Suspense } from "react";
import { BukuTamuScreen } from "@/components/f5/BukuTamu";
import { LiveRefresh } from "@/components/LiveRefresh";
import { RegisterOffline } from "@/components/RegisterOffline";
import { Screen, Skeleton } from "@/components/ui";
import { closedGuest } from "@/lib/server/feedback";

export const metadata = { title: "Buku tamu · House Moving Day" };

// F5 · T14 Buku tamu (+ T14b / T14c di HP). Cuma tamu yang udah masuk; udah pernah isi → T14d
// (kolase + toast). Link yang sama dipakai tamu yang udah pulang.
export default function GuestbookPage({ params }: PageProps<"/t/[token]/buku-tamu">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={90} radius={12} />
          <Skeleton height={110} />
          <Skeleton height={150} />
          <Skeleton height={140} />
        </Screen>
      }
    >
      <Guestbook params={params} />
    </Suspense>
  );
}

async function Guestbook({ params }: Pick<PageProps<"/t/[token]/buku-tamu">, "params">) {
  const { token } = await params;
  const ctx = await closedGuest(token);
  if (!ctx) redirect(`/t/${token}`);
  const { guest, event, store, inside } = ctx;
  if (!inside) redirect(`/t/${token}/selesai`);
  if (store.feedbackFor(guest.id)) redirect(`/t/${token}/kolase?isi=1`);

  return (
    <>
      <BukuTamuScreen
        token={token}
        sessions={store.listSessions(event.id).map((x) => ({ id: x.id, title: x.title }))}
        backHref={`/t/${token}/selesai`}
        kolaseHref={`/t/${token}/kolase`}
      />
      <LiveRefresh token={token} />
      <RegisterOffline />
    </>
  );
}
