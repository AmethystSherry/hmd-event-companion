import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { Avatar, Badge, Card, ListRow, Screen, ScreenHeader, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { keyLabel } from "@/lib/event";
import { isCrew } from "@/lib/server/access";

export const metadata = { title: "Tamu dummy · HMD" };

// Dev: daftar tamu DUMMY + link /t/{token} untuk mencoba alur tamu.
// Di production hanya bisa dibuka panitia yang sudah masuk.
export default function DevGuestsPage() {
  return (
    <Suspense
      fallback={
        <Screen>
          <Skeleton height={600} />
        </Screen>
      }
    >
      <GuestList />
    </Suspense>
  );
}

const RSVP_BADGE = {
  hadir: <Badge tone="success">Konfirmasi</Badge>,
  tidak: <Badge tone="danger">Tidak hadir</Badge>,
  belum: <Badge tone="neutral">Belum jawab</Badge>,
} as const;

async function GuestList() {
  await connection();
  if (process.env.NODE_ENV === "production" && !(await isCrew())) notFound();
  const store = await getStore();
  const guests = await store.listGuests();
  const tickets = await Promise.all(guests.map((g) => store.getTicketForGuest(g.id)));

  return (
    <Screen>
      <ScreenHeader eyebrow="Dev · data dummy" title="Tamu dummy" />
      <p className="t-label c-label-2">
        {guests.length} tamu fiktif dari data/dummy-guests.csv. Tap untuk membuka link tamu.
      </p>
      <Card inset>
        {guests.map((g, i) => (
          <ListRow
            key={g.id}
            href={`/t/${store.linkToken(g.id)}`}
            leading={<Avatar name={g.name} />}
            title={g.name}
            subtitle={`${keyLabel(g.keyNo)} · @${g.ig}${tickets[i] ? ` · ${tickets[i]!.shortCode}` : ""}`}
            trailing={RSVP_BADGE[g.rsvp]}
          />
        ))}
      </Card>
      <Link href="/t/link-palsu-buat-coba-1234" className="t-label c-label-2">
        Coba link palsu (T01e)
      </Link>
    </Screen>
  );
}
