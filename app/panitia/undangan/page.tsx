import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Suspense } from "react";
import { Screen, Skeleton } from "@/components/ui";
import { importGuests, importSummary } from "@/lib/csv";
import { getStore } from "@/lib/data";
import { firstName } from "@/lib/invite";
import { requireCrew } from "@/lib/server/access";
import { appOrigin } from "@/lib/server/url";
import { Invites, type Recipient } from "./Invites";

export const metadata = { title: "Kirim undangan · Panitia" };

// P04 Kirim undangan · P04b Kirim pengingat H-1 (?mode=pengingat) · P04c CSV ada baris error.
export default function UndanganPage({ searchParams }: PageProps<"/panitia/undangan">) {
  return (
    <Suspense
      fallback={
        <Screen withBack bottom={<Skeleton height={54} radius={27} />}>
          <Skeleton height={100} />
          <Skeleton height={54} radius={27} />
          <Skeleton height={72} />
          <Skeleton height={120} />
          <Skeleton height={300} />
        </Screen>
      }
    >
      <Content searchParams={searchParams} />
    </Suspense>
  );
}

async function Content({
  searchParams,
}: {
  searchParams: PageProps<"/panitia/undangan">["searchParams"];
}) {
  const { mode } = await searchParams;
  await requireCrew(`/panitia/undangan${mode === "pengingat" ? "?mode=pengingat" : ""}`);
  const store = await getStore();
  const origin = await appOrigin();
  const guests = await store.listGuests();

  const recipients: Recipient[] = guests.map((g) => ({
    id: g.id,
    name: g.name,
    firstName: firstName(g.name),
    wa: g.wa,
    rsvp: g.rsvp,
    inviteSent: g.inviteStatus === "terkirim",
    reminderSent: g.reminderStatus === "terkirim",
    link: `${origin}/t/${store.linkToken(g.id)}`,
  }));

  // File awal = CSV dummy hasil seed (sampai panitia mengunggah file lain).
  const seedFile = "tamu-hmd-dummy.csv";
  const seed = importGuests(readFileSync(join(process.cwd(), "data", seedFile), "utf8"));

  return (
    <Invites
      initialMode={mode === "pengingat" ? "pengingat" : "undangan"}
      recipients={recipients}
      initialImport={{
        fileName: seedFile,
        summary: importSummary(seed),
        total: seed.total,
        okCount: seed.rows.length,
        errors: seed.errors,
      }}
    />
  );
}
