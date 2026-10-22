import { Suspense } from "react";
import { ArrowCounterClockwise, CalendarBlank, Check, Clock, MapPin } from "@/components/icons";
import { Button, Card, CardLabel, Pill, Screen, ScreenHeader, Ticket } from "@/components/ui";
import { TicketQr } from "@/components/TicketQr";
import { getStore, type Guest } from "@/lib/data";
import { EVENT, isEventDay, keyLabel } from "@/lib/event";
import { firstName } from "@/lib/invite";
import { guestFromToken } from "@/lib/server/access";
import { secrets } from "@/lib/server/config";
import { signTicket } from "@/lib/server/crypto";
import styles from "./guest.module.css";
import { GuestSkeleton, InvalidLink } from "./InvalidLink";
import { DoorScreen, UsedScreen } from "./TicketScreens";

// /t/{token}: layar tamu sesuai status jawaban.
// belum → T01 Undangan · tidak → T02b Nggak bisa datang · hadir → T03 Tiket,
// hari-H → T05 Tiket hari-H (animasi sobek saat discan) · sudah masuk → T03b.
// Token tidak pernah ditampilkan atau di-log; tamu hanya melihat datanya sendiri.
export default function GuestPage({ params }: PageProps<"/t/[token]">) {
  return (
    <Suspense fallback={<GuestSkeleton />}>
      <Router params={params} />
    </Suspense>
  );
}

async function Router({ params }: { params: PageProps<"/t/[token]">["params"] }) {
  const { token } = await params;
  const guest = await guestFromToken(token);
  if (!guest) return <InvalidLink />;
  if (guest.rsvp === "hadir") {
    const ticket = await (await getStore()).getTicketForGuest(guest.id);
    if (ticket?.status === "dipakai") return <UsedScreen guest={guest} token={token} />;
    if (isEventDay(new Date())) return <DoorScreen guest={guest} token={token} />;
    return <TicketScreen guest={guest} token={token} />;
  }
  if (guest.rsvp === "tidak") return <Declined guest={guest} token={token} />;
  return <Invitation guest={guest} token={token} />;
}

// T01 · Undangan
async function Invitation({ guest, token }: { guest: Guest; token: string }) {
  const sessions = await (await getStore()).listSessions();
  return (
    <Screen
      bottomHeight={82}
      bottom={
        <>
          <p className={`t-label c-label-2 ${styles.caption}`}>
            Syarat hadir: follow @{EVENT.instagram}
          </p>
          <Button href={`/t/${token}/konfirmasi`} icon={<Check />}>
            Konfirmasi kehadiran
          </Button>
        </>
      }
    >
      <ScreenHeader
        eyebrow="Undangan pribadi · House Moving Day"
        title="Potara pindah rumah. Kamu diundang."
      />
      <Card>
        <CardLabel>Untuk</CardLabel>
        <p className="t-card-title">{guest.name}</p>
        <div className={styles.pills}>
          <Pill icon={<CalendarBlank />}>{EVENT.dateShort}</Pill>
          <Pill icon={<Clock />}>13.00–17.00</Pill>
          <Pill icon={<MapPin />}>{EVENT.location}</Pill>
        </div>
      </Card>
      <Card className={styles.rundown}>
        {sessions.map((s) => (
          <div key={s.id} className={styles.rundownRow}>
            <span className={`t-label-emph ${styles.num}`}>{s.order}</span>
            <span className={styles.stack}>
              <span className="t-body-emph">{s.title}</span>
              <span className="t-label c-label-2">{s.tagline}</span>
            </span>
          </div>
        ))}
      </Card>
    </Screen>
  );
}

// T03 · Tiket (terkonfirmasi)
async function TicketScreen({ guest, token }: { guest: Guest; token: string }) {
  const ticket = await (await getStore()).getTicketForGuest(guest.id);
  const payload = ticket ? signTicket(secrets().ticketSecret, ticket.ticketId) : null;
  return (
    <Screen
      bottom={
        <Button variant="secondary" href={`/t/${token}/kalender`} icon={<CalendarBlank />}>
          Simpan ke kalender
        </Button>
      }
    >
      <ScreenHeader
        eyebrow="Terkonfirmasi · simpan link ini"
        title={`Ini tiketmu, ${firstName(guest.name)}.`}
      />
      <Ticket
        state="terkonfirmasi"
        data={{
          name: guest.name,
          keyNo: keyLabel(guest.keyNo),
          when: `${EVENT.dateShort} · 13.00`,
          where: EVENT.location,
          code: ticket?.shortCode ?? "—",
          followNote: `Sudah follow @${EVENT.instagram}`,
        }}
        qr={
          payload ? (
            <TicketQr payload={payload} label={`QR tiket, kode ${ticket!.shortCode}`} />
          ) : undefined
        }
      />
    </Screen>
  );
}

// T02b · Nggak bisa datang (terima kasih)
function Declined({ guest, token }: { guest: Guest; token: string }) {
  return (
    <Screen
      bottomHeight={146}
      bottom={
        <>
          <p className={`t-label c-label-2 ${styles.caption}`}>
            Berubah pikiran? Kamu masih bisa ubah jawaban.
          </p>
          <Button
            href={`https://instagram.com/${EVENT.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Follow @{EVENT.instagram}
          </Button>
          <Button
            variant="secondary"
            href={`/t/${token}/konfirmasi`}
            icon={<ArrowCounterClockwise />}
          >
            Ubah jawaban
          </Button>
        </>
      }
    >
      <ScreenHeader
        eyebrow="Undangan pribadi · House Moving Day"
        title={`Makasih udah ngabarin, ${firstName(guest.name)}.`}
      />
      <Card className={styles.answerCard}>
        <CardLabel>Jawabanmu</CardLabel>
        <p className="t-card-title">Nggak bisa datang</p>
        <p className="t-body c-label-2">
          Kamu nggak dapat tiket dan nggak dikirimi pengingat H-1. Semoga ketemu di acara Potara
          berikutnya!
        </p>
      </Card>
      <Card className={styles.waitCard}>
        <CardLabel>Sambil nunggu</CardLabel>
        <p className="t-headline">Intip cerita pindahan kami</p>
        <p className="t-label c-label-2">
          Kolase foto House Moving Day bakal dibagi di @{EVENT.instagram} setelah 8 Nov.
        </p>
      </Card>
    </Screen>
  );
}
