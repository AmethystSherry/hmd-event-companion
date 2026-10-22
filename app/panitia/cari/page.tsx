import { Suspense } from "react";
import { Screen, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { keyLabel } from "@/lib/event";
import { timeWib } from "@/lib/format";
import { requireCrew } from "@/lib/server/access";
import { NameSearch, type SearchRow } from "./NameSearch";

export const metadata = { title: "Cari nama · Panitia" };

// P07 · Cari nama (cadangan) · P07b kamera error (?kamera=error) · P07c walk-in.
export default function CariPage({ searchParams }: PageProps<"/panitia/cari">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={100} />
          <Skeleton height={44} radius={22} />
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
  searchParams: PageProps<"/panitia/cari">["searchParams"];
}) {
  const { kamera, q } = await searchParams;
  await requireCrew("/panitia/cari");
  const store = await getStore();
  const guests = await store.listGuests();
  const tickets = await Promise.all(guests.map((g) => store.getTicketForGuest(g.id)));
  const rows: SearchRow[] = guests.map((g, i) => {
    const t = tickets[i];
    const inside = t?.status === "dipakai" && t.checkedInAt;
    return {
      id: g.id,
      name: g.name,
      ig: g.ig,
      keyNo: keyLabel(g.keyNo),
      code: t?.shortCode ?? "",
      checkedInAt: inside ? timeWib(t.checkedInAt!) : null,
      method: inside ? t.method : null,
    };
  });
  return (
    <NameSearch
      rows={rows}
      cameraError={kamera === "error"}
      initialQuery={typeof q === "string" ? q : ""}
    />
  );
}
