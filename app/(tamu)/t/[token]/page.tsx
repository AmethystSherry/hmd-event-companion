import { Suspense } from "react";
import { LiveRefresh } from "@/components/LiveRefresh";
import { GuestDayTicket } from "@/components/f2/tamu";
import { RefreshAt } from "@/components/RefreshAt";
import { RegisterOffline } from "@/components/RegisterOffline";
import { TicketQr } from "@/components/TicketQr";
import {
  DeclinedScreen,
  InvalidLinkScreen,
  InvitationScreen,
  TicketScreen,
} from "@/components/f1/tamu";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { daysUntil, eventStart, keyLabel, timeWib } from "@/lib/format";
import { guestFromToken } from "@/lib/server/access";
import { isEventDay, serverNow } from "@/lib/server/clock";
import { ensurePurged } from "@/lib/server/feedback";
import { secrets } from "@/lib/server/config";
import { signTicket } from "@/lib/server/crypto";

// /t/{token}: layar tamu sesuai jawaban.
// belum → T01 Undangan · nggak → T02b · hadir → T03 Tiket (T03h kalau dibuka dari WA H-1).
// Hari-H (mulai 00.00 WIB): hadir → T05 tiket hari-H → discan → T05a/BT02 → T03b (F2).
// Token salah / milik event yang sudah lewat 30 hari → T01e. Token tidak pernah ditampilkan.
const JUST_IN_MS = 10 * 60 * 1000; // baru masuk < 10 menit → BT02 sekali

export default function GuestPage({ params, searchParams }: PageProps<"/t/[token]">) {
  return (
    <Suspense
      fallback={
        <Screen>
          <Skeleton height={80} radius={12} />
          <Skeleton height={160} />
          <Skeleton height={220} />
        </Screen>
      }
    >
      <Router params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Router({
  params,
  searchParams,
}: Pick<PageProps<"/t/[token]">, "params" | "searchParams">) {
  const [{ token }, query] = await Promise.all([params, searchParams]);
  const guest = await guestFromToken(token);
  // F5: lewat H+30 → data per orang dihapus (token lama ikut mati) → T01e.
  const purged = guest ? await ensurePurged(guest.eventId) : false;
  const store = await getStore();
  const event = guest ? store.getEvent(guest.eventId) : null;
  if (!guest || !event || purged || daysUntil(event.date, new Date()) < -30) {
    return <InvalidLinkScreen retryHref={`/t/${token}`} />;
  }

  const live = <LiveRefresh token={token} />;
  const now = await serverNow();
  if (guest.rsvp === "hadir") {
    const ticket = store.ticketFor(guest.id);
    const payload = ticket ? signTicket(secrets().ticketSecret, ticket.ticketId) : null;
    const qr = payload ? (
      <TicketQr payload={payload} label={`QR tiket, kode ${ticket!.shortCode}`} />
    ) : undefined;
    if (ticket && isEventDay(event.date, now)) {
      const inAt = ticket.status === "dipakai" ? ticket.checkedInAt : null;
      return (
        <>
          <GuestDayTicket
            ticketKey={ticket.ticketId}
            eventHref={`/t/${token}/acara`}
            status={ticket.status}
            justCheckedIn={!!inAt && now.getTime() - new Date(inAt).getTime() < JUST_IN_MS}
            guestName={guest.name}
            event={event}
            keyNo={keyLabel(guest.keyNo)}
            code={ticket.shortCode}
            qr={qr}
            stamp={
              inAt
                ? {
                    time: timeWib(inAt),
                    guestNo: ticket.guestNo ?? null,
                    total: store.doorStats(event.id).expected,
                  }
                : null
            }
          />
          {live}
          <RegisterOffline />
        </>
      );
    }
    return (
      <>
        <TicketScreen
          variant={query.dari === "wa" ? "t03h" : "t03"}
          guestName={guest.name}
          event={event}
          keyNo={keyLabel(guest.keyNo)}
          code={ticket?.shortCode ?? "—"}
          qr={qr}
          calendarHref={`/t/${token}/kalender`}
          now={now.toISOString()}
        />
        <RefreshAt
          at={eventStart(event.date, "00.00").toISOString()}
          serverNow={now.toISOString()}
        />
        {live}
        <RegisterOffline />
      </>
    );
  }
  if (guest.rsvp === "nggak") {
    return (
      <DeclinedScreen guestName={guest.name} event={event} changeHref={`/t/${token}/konfirmasi`} />
    );
  }
  return (
    <>
      <InvitationScreen
        guestName={guest.name}
        event={event}
        sessions={store.listSessions(event.id)}
        confirmHref={`/t/${token}/konfirmasi`}
      />
      {live}
    </>
  );
}
