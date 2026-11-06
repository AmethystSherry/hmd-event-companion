import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AcaraScreen } from "@/components/f4/AcaraScreen";
import type { SheetKind } from "@/components/f4/Sheets";
import { RegisterOffline } from "@/components/RegisterOffline";
import { TicketQr } from "@/components/TicketQr";
import { Screen, Skeleton } from "@/components/ui";
import { acaraView } from "@/lib/acara";
import { getStore } from "@/lib/data";
import { firstName } from "@/lib/format";
import { kenalanIntro, kenalanView } from "@/lib/kenalan";
import { isPhotoId, polaroidDate, toGuestPhotos } from "@/lib/photo";
import { myQuestions, otherQuestions } from "@/lib/questions";
import { guestFromToken } from "@/lib/server/access";
import { kenalanCode } from "@/lib/server/kenalan";
import { serverNow } from "@/lib/server/clock";

const SHEETS: SheetKind[] = [
  "detail",
  "pembicara",
  "rundown",
  "tamu",
  "foto",
  "galeri",
  "tanya",
  "kartu",
  "rumah",
  "kenalan", // N5 · BTk4 (&id=)
  "kenalan-qr", // N5 · sheet Kenalan (QR saya / Scan QR)
  "pemenang", // N5 · BTk5
];
// ?sheet=&sesi=&id= (reload / back-forward / dari kamera N4) → sheet yang sama kebuka lagi.
function sheetFrom(sheet: unknown, sesi: unknown, id: unknown) {
  const kind = SHEETS.find((k) => k === sheet);
  if (!kind) return null;
  return {
    kind,
    sessionId: typeof sesi === "string" ? sesi : undefined,
    photoId: typeof id === "string" && isPhotoId(id) ? id : undefined,
  };
}

export const metadata = { title: "House Moving Day · Potara Studio" };

// F4 · layar acara tamu: SESI (BT20/21/23/24) ⇄ JEDA (BT03) ikut Kontrol acara panitia.
// Belum check-in → tiket; acara ditutup → BT12 (F5).
export default function EventScreenPage({ params, searchParams }: PageProps<"/t/[token]/acara">) {
  return (
    <Suspense
      fallback={
        <Screen>
          <Skeleton height={420} />
          <Skeleton height={260} />
        </Screen>
      }
    >
      <EventScreen params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function EventScreen({
  params,
  searchParams,
}: Pick<PageProps<"/t/[token]/acara">, "params" | "searchParams">) {
  const { token } = await params;
  const q = await searchParams;
  const guest = await guestFromToken(token);
  const store = await getStore();
  const event = guest ? store.getEvent(guest.eventId) : null;
  const ticket = guest ? store.ticketFor(guest.id) : null;
  // Belum masuk (atau link salah) → kembali ke tiket.
  if (!guest || !event || ticket?.status !== "dipakai") redirect(`/t/${token}`);
  if (event.mode === "closed") redirect(`/t/${token}/selesai`); // F5 · BT12

  const now = await serverNow();
  const initialSheet = sheetFrom(q.sheet, q.sesi, q.id);
  const kenalan = kenalanView(store, guest.id);
  const view = acaraView({
    event,
    sessions: store.listSessions(event.id),
    guests: store.listGuests(event.id),
    tickets: store.listTickets(event.id),
    me: guest,
    now,
    rev: store.rev,
  });
  return (
    <>
      <AcaraScreen
        token={token}
        view={view}
        photos={toGuestPhotos({
          name: firstName(guest.name),
          endsAt: event.endsAt,
          guestId: guest.id,
          photos: store.listPhotos(event.id),
        })}
        questions={myQuestions(store.listQuestions(event.id), guest.id)}
        otherQuestions={otherQuestions(
          store.listQuestions(event.id),
          store.listGuests(event.id),
          guest.id,
        )}
        serverNow={now.toISOString()}
        initialSheet={initialSheet}
        kenalan={kenalan}
        kenalanQr={
          kenalan?.open
            ? {
                qr: <TicketQr payload={kenalanCode(guest.id)} label="QR kenalan kamu" />,
                date: polaroidDate(event.date),
              }
            : null
        }
        kenalanIntro={
          initialSheet?.kind === "kenalan" && initialSheet.photoId
            ? kenalanIntro(store, guest.id, initialSheet.photoId)
            : null
        }
      />
      <RegisterOffline />
    </>
  );
}
