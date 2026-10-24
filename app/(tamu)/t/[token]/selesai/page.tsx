import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SelesaiLuarScreen, SelesaiScreen } from "@/components/f5/Selesai";
import { LiveRefresh } from "@/components/LiveRefresh";
import { RegisterOffline } from "@/components/RegisterOffline";
import { Screen, Skeleton } from "@/components/ui";
import { dateMedium, timeWib } from "@/lib/format";
import { igProfileUrl, POTARA_IG } from "@/lib/invite";
import { photoTone } from "@/lib/kolase";
import { guestPhotoUrl } from "@/lib/photo";
import { closedGuest } from "@/lib/server/feedback";

export const metadata = { title: "Makasih udah mampir · House Moving Day" };

// F5 · BT12 Acara selesai. Muncul sendiri di semua HP tamu saat panitia tutup acara (rev → SSE →
// /t/{token} dll. dialihkan ke sini). Belum ditutup → kembali ke /t/{token}.
export default function DonePage({ params }: PageProps<"/t/[token]/selesai">) {
  return (
    <Suspense
      fallback={
        <Screen>
          <Skeleton height={110} radius={12} />
          <Skeleton height={130} />
          <Skeleton height={180} />
        </Screen>
      }
    >
      <Done params={params} />
    </Suspense>
  );
}

async function Done({ params }: Pick<PageProps<"/t/[token]/selesai">, "params">) {
  const { token } = await params;
  const ctx = await closedGuest(token);
  if (!ctx) redirect(`/t/${token}`);
  const { guest, event, store, inside } = ctx;

  const live = (
    <>
      <LiveRefresh token={token} />
      <RegisterOffline />
    </>
  );
  if (!inside) {
    return (
      <>
        <SelesaiLuarScreen
          eyebrow={`${event.name} · ${dateMedium(event.date)}`}
          followHref={igProfileUrl(POTARA_IG)}
        />
        {live}
      </>
    );
  }

  const sessions = store.listSessions(event.id);
  const done = sessions.filter((x) => x.status === "selesai").length;
  const photos = store.listPhotos(event.id);
  const filled = !!store.feedbackFor(guest.id);
  return (
    <>
      <SelesaiScreen
        eyebrow={`${event.closedAt ? `${timeWib(event.closedAt)} · ` : ""}${done} dari ${sessions.length} bagian selesai`}
        photoCount={photos.length}
        photoGuests={new Set(photos.map((p) => p.guestId)).size}
        guestCount={store.doorStats(event.id).checkedIn}
        latest={photos
          .slice(0, 4)
          .map((p) => ({ id: p.id, src: guestPhotoUrl(token, p.id), tone: photoTone(p.id) }))}
        kolaseHref={`/t/${token}/kolase`}
        bukuTamuHref={filled ? `/t/${token}/kolase?isi=1` : `/t/${token}/buku-tamu`}
      />
      {live}
    </>
  );
}
