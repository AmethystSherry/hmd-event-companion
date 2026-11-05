import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SelesaiLuarScreen, SelesaiScreen } from "@/components/f5/Selesai";
import { LiveRefresh } from "@/components/LiveRefresh";
import { RegisterOffline } from "@/components/RegisterOffline";
import { Screen, Skeleton } from "@/components/ui";
import { sessionShort } from "@/lib/data/sessionInfo";
import { fromMinutes, toMinutes } from "@/lib/format";
import { igProfileUrl, POTARA_IG } from "@/lib/invite";
import { photoTone } from "@/lib/kolase";
import { kenalanView } from "@/lib/kenalan";
import { guestPhotoUrl } from "@/lib/photo";
import { closedGuest } from "@/lib/server/feedback";

export const metadata = { title: "Makasih udah mampir · House Moving Day" };

// F5 · BT12 Acara selesai (v2: ilustrasi + panel, Tiket acara, sheet buku tamu). Muncul sendiri di
// semua HP tamu saat panitia tutup acara (rev → SSE → /t/{token} dll. dialihkan ke sini).
// `?sheet=buku-tamu` = T14 kebuka (link WA makasih lewat /buku-tamu). Belum ditutup → /t/{token}.
export default function DonePage({ params, searchParams }: PageProps<"/t/[token]/selesai">) {
  return (
    <Suspense
      fallback={
        <Screen>
          <Skeleton height={360} radius={0} />
          <Skeleton height={88} radius={18} />
          <Skeleton height={120} />
        </Screen>
      }
    >
      <Done params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Done({
  params,
  searchParams,
}: Pick<PageProps<"/t/[token]/selesai">, "params" | "searchParams">) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
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
        <SelesaiLuarScreen followHref={igProfileUrl(POTARA_IG)} />
        {live}
      </>
    );
  }

  const filled = !!store.feedbackFor(guest.id);
  // Udah isi tapi link sheet dibuka lagi → T14d.
  if (filled && query.sheet === "buku-tamu") redirect(`/t/${token}/kolase?isi=1`);

  const sessions = store.listSessions(event.id); // urut jam
  const done = sessions.filter((x) => x.status === "selesai").length;
  const photos = store.listPhotos(event.id);
  return (
    <>
      <SelesaiScreen
        token={token}
        photoCount={photos.length}
        questionCount={store.listQuestions(event.id).length}
        guestCount={store.doorStats(event.id).checkedIn}
        // Acara ditutup = semua bagian jadi sobekan (sesi yang dilewati ikut numpuk).
        tickets={sessions.map((x, i) => ({
          id: x.id,
          no: i + 1,
          title: x.title,
          startsAt: x.startsAt,
          endsAt: fromMinutes(toMinutes(x.startsAt) + x.durationMin),
          room: x.room ?? null,
          state: "done" as const,
        }))}
        ticketCaption={`${done} dari ${sessions.length} selesai`}
        latest={photos
          .slice(0, 4)
          .map((p) => ({ id: p.id, src: guestPhotoUrl(token, p.id), tone: photoTone(p.id) }))}
        filled={filled}
        sessions={sessions.map((x) => ({ id: x.id, title: sessionShort(x) }))}
        kolaseHref={`/t/${token}/kolase`}
        initialSheet={query.sheet === "buku-tamu"}
        kenalan={kenalanView(store, guest.id)}
      />
      {live}
    </>
  );
}
