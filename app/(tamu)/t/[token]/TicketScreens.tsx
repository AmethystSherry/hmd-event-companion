import { QrCode } from "@/components/icons";
import { Button, Screen, ScreenHeader, Ticket, type TicketData } from "@/components/ui";
import { TicketQr } from "@/components/TicketQr";
import { getStore, type Guest, type Ticket as TicketRecord } from "@/lib/data";
import { EVENT, keyLabel } from "@/lib/event";
import { timeWib } from "@/lib/format";
import { firstName } from "@/lib/invite";
import { secrets } from "@/lib/server/config";
import { signTicket } from "@/lib/server/crypto";
import styles from "./guest.module.css";
import { DoorTicket } from "./pintu/DoorTicket";

export function ticketData(guest: Guest, ticket: TicketRecord | null): TicketData {
  return {
    name: guest.name,
    keyNo: keyLabel(guest.keyNo),
    when: `${EVENT.dateShort} · 13.00`,
    where: EVENT.location,
    code: ticket?.shortCode ?? "—",
    followNote: `Sudah follow @${EVENT.instagram}`,
  };
}

// T05 · Tiket hari-H (QR aktif, menunggu discan) → animasi sobek → BT02.
export async function DoorScreen({ guest, token }: { guest: Guest; token: string }) {
  const store = await getStore();
  const ticket = await store.getTicketForGuest(guest.id);
  if (ticket?.status === "dipakai") return <UsedScreen guest={guest} token={token} />;
  const payload = ticket ? signTicket(secrets().ticketSecret, ticket.ticketId) : null;
  return (
    <DoorTicket
      token={token}
      firstName={firstName(guest.name)}
      data={ticketData(guest, ticket)}
      nextHref={`/t/${token}/acara`}
      qr={
        payload ? (
          <TicketQr payload={payload} label={`QR tiket, kode ${ticket!.shortCode}`} />
        ) : undefined
      }
    />
  );
}

// T03b · Tiket dibuka lagi (udah masuk): tiket jadi bukti, QR nonaktif.
export async function UsedScreen({ guest, token }: { guest: Guest; token: string }) {
  const store = await getStore();
  const [ticket, count] = await Promise.all([
    store.getTicketForGuest(guest.id),
    store.checkInCount(),
  ]);
  const time = ticket?.checkedInAt ? timeWib(ticket.checkedInAt) : "";
  return (
    <Screen
      bottomHeight={82}
      bottom={
        <>
          <p className={`t-label c-label-2 ${styles.caption}`}>
            QR udah nggak aktif. Tiket ini jadi bukti kamu hadir.
          </p>
          <Button href={`/t/${token}`}>Kembali ke acara</Button>
        </>
      }
    >
      <ScreenHeader eyebrow="Tiket kamu · udah dipakai" title="Kamu udah di dalam" />
      <Ticket
        data={ticketData(guest, ticket)}
        state="sobek"
        stamp={{ time, guestNo: ticket?.guestNo ?? null, total: count.total }}
      />
      <div className={styles.qrOff}>
        <span className={styles.qrOffIcon}>
          <QrCode size={24} />
        </span>
        <span className={styles.stack}>
          <span className="t-body-emph">QR nonaktif</span>
          <span className="t-label c-label-2">Discan panitia {time} · nggak bisa dipakai lagi</span>
        </span>
      </div>
    </Screen>
  );
}
