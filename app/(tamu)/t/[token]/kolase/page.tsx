import { redirect } from "next/navigation";
import { Suspense } from "react";
import { KolaseScreen } from "@/components/f5/KolaseKulkas";
import { LiveRefresh } from "@/components/LiveRefresh";
import { RegisterOffline } from "@/components/RegisterOffline";
import { Screen, Skeleton } from "@/components/ui";
import { dateLong, firstName } from "@/lib/format";
import { igProfileUrl, POTARA_IG } from "@/lib/invite";
import { toKolasePhotos } from "@/lib/kolase";
import { polaroidDate } from "@/lib/photo";
import { closedGuest } from "@/lib/server/feedback";

export const metadata = { title: "Kolase kulkas · House Moving Day" };

// F5 · T15 Kolase kulkas (+ T15b ?foto={id}, T15c/T15e simpan & bagikan, T15d kosong,
// T14d ?isi=1). Foto lewat route proxy; daftar ikut berubah lewat rev → SSE.
export default function CollagePage({ params, searchParams }: PageProps<"/t/[token]/kolase">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={120} radius={12} />
          <Skeleton height={40} radius={20} />
          <Skeleton height={420} />
        </Screen>
      }
    >
      <Collage params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Collage({
  params,
  searchParams,
}: Pick<PageProps<"/t/[token]/kolase">, "params" | "searchParams">) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const ctx = await closedGuest(token);
  if (!ctx) redirect(`/t/${token}`);
  const { guest, event, store, inside } = ctx;
  if (!inside) redirect(`/t/${token}/selesai`);

  const sessions = store.listSessions(event.id).map((x) => ({ id: x.id, title: x.title }));
  const raw = store.listPhotos(event.id);
  return (
    <>
      <KolaseScreen
        token={token}
        greeting={`Terima kasih sudah mampir, ${firstName(guest.name)}`}
        dateLabel={dateLong(event.date).split(", ")[1]}
        shortDate={polaroidDate(event.date)}
        photos={toKolasePhotos(raw, store.listGuests(event.id), sessions, guest.id)}
        photoGuests={new Set(raw.map((p) => p.guestId)).size}
        sessions={sessions}
        backHref={`/t/${token}/selesai`}
        followHref={igProfileUrl(POTARA_IG)}
        filledToast={query.isi === "1"}
      />
      <LiveRefresh token={token} />
      <RegisterOffline />
    </>
  );
}
