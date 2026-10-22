import { Suspense } from "react";
import { Screen, Skeleton, TabBar } from "@/components/ui";
import { getStore } from "@/lib/data";
import { timeWib } from "@/lib/format";
import { requireCrew } from "@/lib/server/access";
import { GuestList, type GuestRowData } from "./GuestList";

export const metadata = { title: "Daftar tamu · Panitia" };

// P03 · Daftar tamu.
export default function TamuPage() {
  return (
    <Suspense
      fallback={
        <Screen bottom={<TabBar active="tamu" />} bottomHeight={57}>
          <Skeleton height={80} />
          <Skeleton height={122} radius={22} />
          <Skeleton height={44} radius={22} />
          <Skeleton height={400} />
        </Screen>
      }
    >
      <Content />
    </Suspense>
  );
}

// Urutan list: hadir (check-in) → konfirmasi → belum jawab → tidak hadir.
const ORDER = { hadir: 0, konfirmasi: 1, belum: 2, tidak: 3 } as const;

async function Content() {
  await requireCrew("/panitia/tamu");
  const store = await getStore();
  const guests = await store.listGuests();
  const tickets = await Promise.all(guests.map((g) => store.getTicketForGuest(g.id)));

  const rows: GuestRowData[] = guests
    .map((g, i) => {
      const t = tickets[i];
      const checkedIn = t?.status === "dipakai" && t.checkedInAt;
      const status: GuestRowData["status"] = checkedIn
        ? "hadir"
        : g.rsvp === "hadir"
          ? "konfirmasi"
          : g.rsvp === "tidak"
            ? "tidak"
            : "belum";
      return {
        id: g.id,
        keyNo: g.keyNo,
        name: g.name,
        ig: g.ig,
        status,
        checkedInAt: checkedIn ? timeWib(t.checkedInAt!) : null,
      };
    })
    .sort((a, b) => ORDER[a.status] - ORDER[b.status] || a.keyNo - b.keyNo);

  const stats = {
    invited: guests.length,
    confirmed: guests.filter((g) => g.rsvp === "hadir").length,
    present: rows.filter((r) => r.status === "hadir").length,
  };

  return (
    <Screen bottom={<TabBar active="tamu" />} bottomHeight={57}>
      <GuestList rows={rows} stats={stats} />
    </Screen>
  );
}
