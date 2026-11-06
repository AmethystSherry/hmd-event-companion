import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LiveRefresh } from "@/components/LiveRefresh";
import { GuestDayTicket } from "@/components/f2/tamu";
import { RefreshAt } from "@/components/RefreshAt";
import { RegisterOffline } from "@/components/RegisterOffline";
import { TicketQr } from "@/components/TicketQr";
import { InviteGate } from "@/components/f1/Envelope";
import {
  DeclinedScreen,
  InvalidLinkScreen,
  InvitationScreen,
  TicketScreen,
} from "@/components/f1/tamu";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { daysUntil, eventStart, keyLabel, timeWib } from "@/lib/format";
import { mapsUrl } from "@/lib/houseInfo";
import { googleCalendarUrl } from "@/lib/ics";
import { sessionForGuest } from "@/lib/sessionForm";
import { guestFromToken } from "@/lib/server/access";
import { isEventDay, serverNow } from "@/lib/server/clock";
import { ensurePurged } from "@/lib/server/feedback";
import { secrets } from "@/lib/server/config";
import { signTicket } from "@/lib/server/crypto";
import { appOrigin } from "@/lib/server/url";
import { sendFarewell } from "./actions";

// /t/{token}: layar tamu sesuai jawaban.
// belum → T01a Amplop (kunjungan pertama) → T01 Undangan · nggak → T02b · hadir → T03 Tiket (T03h kalau dibuka dari WA H-1).
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
  // F5: acara ditutup → BT12 (yang belum masuk dapat layar "Acara udah selesai").
  if (event.mode === "closed") redirect(`/t/${token}/selesai`);

  const live = <LiveRefresh token={token} />;
  const now = await serverNow();
  if (guest.rsvp === "hadir") {
    const ticket = store.ticketFor(guest.id);
    const payload = ticket ? signTicket(secrets().ticketSecret, ticket.ticketId) : null;
    const qr = payload ? (
      <TicketQr payload={payload} label={`QR tiket, kode ${ticket!.shortCode}`} />
    ) : undefined;
    // Hari-H, atau udah di-scan lebih awal (scan dibuka sebelum hari-H) → tiket masuk T05/BT02.
    if (ticket && (isEventDay(event.date, now) || ticket.status === "dipakai")) {
      const inAt = ticket.status === "dipakai" ? ticket.checkedInAt : null;
      return (
        <>
          <GuestDayTicket
            ticketKey={ticket.ticketId}
            eventHref={`/t/${token}/acara`}
            status={ticket.status}
            justCheckedIn={!!inAt && now.getTime() - new Date(inAt).getTime() < JUST_IN_MS}
            guestName={guest.name}
            // Komponen klien: cuma field yang dipakai (Info rumah/Wi-Fi nggak ikut ke HP sebelum masuk).
            event={{ date: event.date, startsAt: event.startsAt, location: event.location }}
            mapsHref={event.houseInfo?.address ? mapsUrl(event.houseInfo.address) : undefined}
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
          calendar={{
            event,
            googleHref: googleCalendarUrl(event, `${await appOrigin()}/t/${token}`),
            icsHref: `/t/${token}/kalender`,
          }}
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
      <DeclinedScreen
        guestName={guest.name}
        event={event}
        changeHref={`/t/${token}/konfirmasi`}
        farewell={{
          initial: guest.farewellMessage ?? "",
          sent: !!guest.farewellMessage,
          send: sendFarewell.bind(null, token),
        }}
      />
    );
  }
  return (
    <>
      <InviteGate token={token} guestName={guest.name}>
        <InvitationScreen
          keyNo={keyLabel(guest.keyNo)}
          event={event}
          sessions={store.listSessions(event.id).map(sessionForGuest)}
          confirmHref={`/t/${token}/konfirmasi`}
        />
      </InviteGate>
      {live}
    </>
  );
}
