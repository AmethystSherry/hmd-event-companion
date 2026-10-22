import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Camera, CaretRight, HandWaving, Key, MapPin } from "@/components/icons";
import { Badge, Button, Card, CardLabel, Screen, ScreenHeader } from "@/components/ui";
import { EVENT } from "@/lib/event";
import { guestFromToken } from "@/lib/server/access";
import { GuestSkeleton, InvalidLink } from "../InvalidLink";
import styles from "../guest.module.css";
import { Countdown } from "./Countdown";

export const metadata = { title: "Besok kita pindahan · House Moving Day" };

// T04 · Pengingat H-1 (dibuka dari link pesan pengingat).
export default function BesokPage({ params }: PageProps<"/t/[token]/besok">) {
  return (
    <Suspense fallback={<GuestSkeleton />}>
      <Content params={params} />
    </Suspense>
  );
}

const BRING = [
  { Icon: Key, text: "Tiket di HP ini" },
  { Icon: Camera, text: "Kamera buat isi kulkas polaroid" },
  { Icon: HandWaving, text: "Rasa penasaran soal kantor baru" },
];

async function Content({ params }: { params: PageProps<"/t/[token]/besok">["params"] }) {
  const { token } = await params;
  const guest = await guestFromToken(token);
  if (!guest) return <InvalidLink />;
  if (guest.rsvp !== "hadir") redirect(`/t/${token}`);

  return (
    <Screen
      bottom={
        <Button href={`/t/${token}`} icon={<Key />}>
          Buka tiketku
        </Button>
      }
    >
      <ScreenHeader
        eyebrow="Pesan dari panitia · H-1"
        title="Besok kita pindahan!"
        trailing={<Badge tone="live">H-1</Badge>}
      />
      <Card>
        <CardLabel>Pintu dibuka dalam</CardLabel>
        <Countdown target={EVENT.startsAt} />
        <p className="t-body-emph">Minggu, 8 Nov · 13.00 WIB</p>
      </Card>
      <Card className={styles.bring}>
        <CardLabel>Bawa ini ya</CardLabel>
        {BRING.map(({ Icon, text }) => (
          <div key={text} className={styles.bringRow}>
            <span className={styles.circleIcon}>
              <Icon size={17} />
            </span>
            <span className="t-body">{text}</span>
          </div>
        ))}
      </Card>
      <Card className={styles.location}>
        <span className={styles.circleIcon}>
          <MapPin size={20} />
        </span>
        <span className={styles.stack}>
          <span className="t-body-emph">{EVENT.location} Studio</span>
          <span className="t-label c-label-2">Alamat &amp; rute menyusul</span>
        </span>
        <CaretRight size={16} className={styles.chevron} />
      </Card>
    </Screen>
  );
}
