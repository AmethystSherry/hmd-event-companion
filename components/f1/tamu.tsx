import type { ReactNode } from "react";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  CalendarBlank,
  ChatCircle,
  Check,
  Clock,
  Info,
  LinkBreak,
  MapPin,
} from "@/components/icons";
import {
  Banner,
  Button,
  Card,
  CardLabel,
  HeroState,
  LogoMark,
  NumberedRow,
  Pill,
  Screen,
  ScreenHeader,
  Ticket,
} from "@/components/ui";
import type { Event, Session } from "@/lib/data/types";
import { addDays, dateMedium, dateShort, eventStart, firstName } from "@/lib/format";
import { igDmUrl, igProfileUrl, POTARA_IG } from "@/lib/invite";
import f1 from "./f1.module.css";
import { LiveCountdown } from "./LiveCountdown";

// Layar tamu F1 (presentasional). Data & aksi disuplai route /t/[token] atau /dev/states/f1.

// T01 · Undangan
export function InvitationScreen({
  guestName,
  event,
  sessions,
  confirmHref,
}: {
  guestName: string;
  event: Event;
  sessions: Session[];
  confirmHref: string;
}) {
  return (
    <Screen
      bottomHeight={82}
      bottom={
        <>
          <p className={`t-label c-label-2 ${f1.caption}`}>Syarat hadir: follow @{POTARA_IG}</p>
          <Button href={confirmHref} icon={<Check />}>
            Konfirmasi kehadiran
          </Button>
        </>
      }
    >
      <ScreenHeader
        eyebrow={`Undangan pribadi · ${event.name}`}
        title="Potara pindah rumah. Kamu diundang."
      />
      <Card>
        <CardLabel>Untuk</CardLabel>
        <p className="t-card-title">{guestName}</p>
        <div className={f1.pills}>
          <Pill icon={<CalendarBlank />}>{dateShort(event.date)}</Pill>
          <Pill icon={<Clock />}>
            {event.startsAt}–{event.endsAt}
          </Pill>
          <Pill icon={<MapPin />}>{event.location}</Pill>
        </div>
      </Card>
      {sessions.length > 0 && (
        <Card inset>
          {sessions.map((s, i) => (
            <NumberedRow
              key={s.id}
              number={i + 1}
              title={s.title}
              subtitle={s.tagline ?? `${s.startsAt} · ${s.durationMin} mnt`}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}

// T01e · Link tidak valid / kedaluwarsa / milik orang lain
export function InvalidLinkScreen({ retryHref }: { retryHref: string }) {
  return (
    <Screen
      bottomHeight={118}
      bottom={
        <>
          <Button
            href={igDmUrl(POTARA_IG)}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ChatCircle />}
          >
            Hubungi panitia
          </Button>
          <Button variant="secondary" href={retryHref} icon={<ArrowClockwise />}>
            Coba buka lagi
          </Button>
        </>
      }
    >
      <div className={f1.topBar}>
        <LogoMark />
      </div>
      <HeroState tone="danger" icon={<LinkBreak size={30} />} title="Link-nya nggak valid">
        Mungkin salah ketik atau udah kedaluwarsa. Buka lagi dari pesan undangan, atau hubungi
        panitia.
      </HeroState>
      <Banner tone="neutral" icon={<Info />} title="Undangan ini personal">
        Satu link cuma buat satu tamu. Link teman nggak bisa dipakai.
      </Banner>
    </Screen>
  );
}

// T02b · Nggak bisa datang
export function DeclinedScreen({
  guestName,
  event,
  changeHref,
}: {
  guestName: string;
  event: Event;
  changeHref: string;
}) {
  return (
    <Screen
      bottomHeight={146}
      bottom={
        <>
          <p className={`t-label c-label-2 ${f1.caption}`}>
            Berubah pikiran? Kamu masih bisa ubah jawaban.
          </p>
          <Button href={igProfileUrl(POTARA_IG)} target="_blank" rel="noopener noreferrer">
            Follow @{POTARA_IG}
          </Button>
          <Button variant="secondary" href={changeHref} icon={<ArrowCounterClockwise />}>
            Ubah jawaban
          </Button>
        </>
      }
    >
      <ScreenHeader
        eyebrow={`Undangan pribadi · ${event.name}`}
        title={`Makasih udah ngabarin, ${firstName(guestName)}.`}
      />
      <Card>
        <CardLabel>Jawabanmu</CardLabel>
        <p className="t-card-title">Nggak bisa datang</p>
        <p className="t-body c-label-2">
          Kamu nggak dapat tiket dan nggak dikirimi pengingat H-1. Semoga ketemu di acara Potara
          berikutnya!
        </p>
      </Card>
      <Card>
        <CardLabel>Sambil nunggu</CardLabel>
        <p className="t-headline">Intip cerita pindahan kami</p>
        <p className="t-label c-label-2">
          Kolase foto {event.name} bakal dibagi di @{POTARA_IG} setelah{" "}
          {dateShort(event.date).split(", ")[1]}.
        </p>
      </Card>
    </Screen>
  );
}

// T03 · Tiket + countdown · T03h dibuka dari WA pengingat H-1 (countdown dalam jam)
export function TicketScreen({
  variant,
  guestName,
  event,
  keyNo,
  code,
  qr,
  calendarHref,
  now,
  frozen,
}: {
  variant: "t03" | "t03h";
  guestName: string;
  event: Event;
  keyNo: string;
  code: string;
  qr?: ReactNode;
  calendarHref: string;
  now: string;
  frozen?: boolean;
}) {
  const start = eventStart(event.date, event.startsAt);
  return (
    <Screen
      bottom={
        <Button variant="secondary" href={calendarHref} icon={<CalendarBlank />}>
          Simpan ke kalender
        </Button>
      }
    >
      <ScreenHeader
        eyebrow={
          variant === "t03h"
            ? `Pengingat H-1 · ${dateMedium(addDays(event.date, -1))}`
            : "Terkonfirmasi · link ini juga dikirim lewat WA"
        }
        title={`Ini tiketmu, ${firstName(guestName)}.`}
      />
      <LiveCountdown
        target={start.toISOString()}
        label={
          variant === "t03h" ? "Besok kita pindahan! Pintu dibuka dalam" : "Pintu dibuka dalam"
        }
        caption={`${dateMedium(event.date)} · ${event.startsAt} WIB`}
        initialNow={now}
        frozen={frozen}
      />
      <Ticket
        state="terkonfirmasi"
        data={{
          name: guestName,
          keyNo,
          when: `${dateShort(event.date)} · ${event.startsAt}`,
          where: event.location,
          code,
          followNote: `Sudah follow @${POTARA_IG}`,
        }}
        qr={qr}
      />
    </Screen>
  );
}
