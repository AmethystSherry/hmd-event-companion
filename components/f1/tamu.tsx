import type { ComponentProps, ReactNode } from "react";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  CalendarBlank,
  ChatCircle,
  Check,
  Clock,
  Info,
  InstagramLogo,
  LinkBreak,
  MapPin,
} from "@/components/icons";
import {
  ArtVideo,
  Banner,
  Button,
  Card,
  CardLabel,
  HeroState,
  CollabMark,
  LogoMark,
  Screen,
  ScreenHeader,
  Ticket,
} from "@/components/ui";
import { ART_VIDEO } from "@/lib/artVideo";
import type { Event } from "@/lib/data/types";
import { addDays, dateMedium, dateShort, eventStart, firstName } from "@/lib/format";
import { igDmUrl, igProfileUrl, POTARA_IG, rundownTiles } from "@/lib/invite";
import type { GuestSession } from "@/lib/sessionForm";
import f1 from "./f1.module.css";
import inv from "./invite.module.css";
import { LiveCountdown } from "./LiveCountdown";
import { CalendarButton, FarewellCard } from "./TamuActions";

// Layar tamu F1 (presentasional). Data & aksi disuplai route /t/[token] atau /dev/states/f1.

// T01 · Undangan (Figma 4992:27429): ilustrasi Pota kebuka, kartu kertas + prangko, info 3 kolom,
// grid bagian acara (v5.1, 26 Okt: Jejak undangan dihapus, pembicara nggak ditampilkan).
export function InvitationScreen({
  keyNo,
  event,
  sessions,
  confirmHref,
}: {
  keyNo: string;
  event: Event;
  sessions: GuestSession[];
  confirmHref: string;
}) {
  return (
    <Screen
      className={inv.bleed}
      bottomHeight={82}
      bottom={
        <>
          <Button href={confirmHref} icon={<Check />}>
            Konfirmasi kehadiran
          </Button>
          <p className={`t-label c-label-3 ${f1.caption}`}>
            Syarat hadir: follow{" "}
            <a
              href={igProfileUrl(POTARA_IG)}
              target="_blank"
              rel="noopener noreferrer"
              className={inv.igLink}
            >
              @{POTARA_IG}
            </a>
          </p>
        </>
      }
    >
      <div className={inv.openStage}>
        {/* eslint-disable-next-line @next/next/no-img-element -- ilustrasi statis dari Figma */}
        <img
          src="/figma/t01-invitation-opened.webp"
          srcSet="/figma/t01-invitation-opened.webp 2x, /figma/t01-invitation-opened@3x.webp 3x"
          alt=""
          aria-hidden
          className={inv.art}
        />
        <ArtVideo fit={ART_VIDEO["t01-invitation-opened"]} sound />
        <span aria-hidden className={inv.artFade} />
      </div>
      <section className={inv.paper} aria-labelledby="t01-title">
        <div className={inv.stamp} aria-label={`Nomor kunci ${keyNo}`}>
          {/* Logo Potara × logo kolaborasi HMD */}
          <span className={inv.stampArt}>
            <CollabMark size={18} />
          </span>
          <span className={`t-caption ${inv.accentText}`}>No. {keyNo.replace("#", "")}</span>
        </div>
        <div className={inv.paperHead}>
          <p className={`t-label-emph ${inv.accentText}`}>Undangan pribadi</p>
          <h1 id="t01-title" className="t-card-title">
            Kamu diundang ke {event.name}!
          </h1>
        </div>
        <hr aria-hidden className={inv.perforation} />
        <dl className={inv.facts}>
          <Fact icon={<CalendarBlank size={14} />} label="Kapan" value={dateShort(event.date)} />
          <Fact
            icon={<Clock size={14} />}
            label="Jam"
            value={`${event.startsAt}–${event.endsAt}`}
          />
          <Fact icon={<MapPin size={14} />} label="Di mana" value={event.location} />
        </dl>
        {sessions.length > 0 && (
          <div className={inv.parts}>
            <p id="t01-bagian" className="t-caption c-label-2">
              {sessions.length} bagian acara
            </p>
            <ol className={inv.tiles} aria-labelledby="t01-bagian">
              {rundownTiles(sessions).map((t) => (
                <li
                  key={t.no}
                  className={inv.tile}
                  aria-label={`Bagian ${Number(t.no)}, ${t.time}, ${t.name}`}
                >
                  <span aria-hidden className={inv.tileNo}>
                    {t.no}
                  </span>
                  <span aria-hidden className={inv.tileText}>
                    <span className={inv.tileTime}>{t.time}</span>
                    <span className={inv.tileName}>{t.name}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
        {/* (28 Okt) Syarat hadir follow IG: baris jelas + tombol langsung ke profil IG Potara. */}
        <div className={inv.follow}>
          <span aria-hidden className={inv.followIcon}>
            <InstagramLogo size={20} />
          </span>
          <span className={inv.followText}>
            <span className="t-label-emph">Follow @{POTARA_IG}</span>
            <span className="t-caption c-label-2">Syarat hadir, sekalian lihat kolase nanti</span>
          </span>
          <Button
            size="sm"
            href={igProfileUrl(POTARA_IG)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Follow @${POTARA_IG} di Instagram`}
          >
            Follow
          </Button>
        </div>
      </section>
    </Screen>
  );
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className={inv.fact}>
      <dt className={`t-caption ${inv.factLabel}`}>
        {icon}
        {label}
      </dt>
      <dd className={inv.factValue}>{value}</dd>
    </div>
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

// T02b · Nggak bisa datang + titip ucapan (Figma 4847:6277).
export function DeclinedScreen({
  guestName,
  event,
  changeHref,
  farewell,
}: {
  guestName: string;
  event: Event;
  changeHref: string;
  farewell: ComponentProps<typeof FarewellCard>;
}) {
  return (
    <Screen
      bottomHeight={146}
      bottom={
        <>
          <p className={`t-label c-label-2 ${f1.caption}`}>
            Follow @{POTARA_IG} buat lihat kolase foto acaranya.
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
      <FarewellCard {...farewell} />
    </Screen>
  );
}

// T03 · Tiket + countdown (T03k sheet kalender) · T03h dibuka dari WA pengingat H-1 (countdown
// dalam jam)
export function TicketScreen({
  variant,
  guestName,
  event,
  keyNo,
  code,
  qr,
  calendar,
  now,
  frozen,
}: {
  variant: "t03" | "t03h";
  guestName: string;
  event: Event;
  keyNo: string;
  code: string;
  qr?: ReactNode;
  calendar: ComponentProps<typeof CalendarButton>;
  now: string;
  frozen?: boolean;
}) {
  const start = eventStart(event.date, event.startsAt);
  return (
    <Screen bottom={<CalendarButton {...calendar} />}>
      <ScreenHeader
        eyebrow={
          variant === "t03h"
            ? `Pengingat H-1 · ${dateMedium(addDays(event.date, -1))}`
            : "Terkonfirmasi · H-1 link ini kami kirim lagi lewat WA"
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
