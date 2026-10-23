import { Camera, CaretLeft, ChatCircle, QrCode, Users } from "@/components/icons";
import {
  Badge,
  Button,
  Card,
  CardLabel,
  IconButton,
  NumberedRow,
  Screen,
  ScreenHeader,
  StatTile,
  TabBar,
} from "@/components/ui";
import type { Event, Session } from "@/lib/data/types";
import type { DoorCard } from "@/lib/door";
import { dateLong } from "@/lib/format";
import s from "./f2.module.css";

// BP00 · Kontrol acara (home hari-H panitia): card Pintu masuk + "Scan tiket", stat, rundown.
// Rundown di sini baru tampilan jadwal; mulai/selesai sesi (BP01) dibangun di F3.
export function KontrolScreen({
  event,
  sessions,
  door,
  checkIn,
  eventDay,
  phaseLabel,
  backHref,
}: {
  event: Pick<Event, "id" | "name" | "date">;
  sessions: Session[];
  door: DoorCard;
  checkIn: { checkedIn: number; expected: number };
  eventDay: boolean; // sebelum hari-H tombol Scan belum ada
  phaseLabel: string; // "Hari-H · Live" / "Persiapan · H-17"
  backHref: string;
}) {
  const base = `/panitia/event/${event.id}`;
  return (
    <Screen bottomHeight={57} bottom={<TabBar active="kontrol" eventId={event.id} />}>
      <ScreenHeader
        leading={<IconButton href={backHref} label="Kembali" icon={<CaretLeft />} />}
        eyebrow={`Kontrol acara · ${dateLong(event.date)}`}
        title={event.name}
        trailing={
          <Badge tone="crew" pulse={eventDay}>
            {phaseLabel}
          </Badge>
        }
      />
      <Card className={s.door}>
        <CardLabel>{door.eyebrow}</CardLabel>
        <p className="t-card-title">{door.title}</p>
        <p className="t-label c-label-2">{door.sub}</p>
        {eventDay && (
          <Button href={`${base}/scan`} icon={<QrCode />}>
            Scan tiket
          </Button>
        )}
      </Card>
      <div className={s.stats}>
        <StatTile
          icon={<Users size={18} />}
          value={`${checkIn.checkedIn}/${checkIn.expected}`}
          label="Check-in"
          href={eventDay ? `${base}/scan/cari` : undefined}
        />
        <StatTile icon={<Camera size={18} />} value="0" label="Foto" />
        <StatTile icon={<ChatCircle size={18} />} value="0" label="Pertanyaan" />
      </div>
      {sessions.length > 0 && (
        <Card inset>
          <div className={s.rundownHead}>
            <p className="t-headline">Rundown</p>
            <p className="t-label c-label-2">Belum mulai</p>
          </div>
          <div aria-hidden className={s.progress}>
            {sessions.map((x) => (
              <span key={x.id} />
            ))}
          </div>
          {sessions.map((x, i) => (
            <NumberedRow
              key={x.id}
              number={i + 1}
              title={x.title}
              subtitle={`${x.durationMin} mnt · PIC ${x.pic}`}
              trailing={<span className="t-label c-label-2 tabular">{x.startsAt}</span>}
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}
