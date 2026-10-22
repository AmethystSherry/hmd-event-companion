import { getStore, type Guest } from "@/lib/data";
import { firstName } from "@/lib/invite";
import { EventScreen } from "./EventScreen";

// Server: ambil snapshot acara + statistik ringan, lalu serahkan ke layar realtime di klien.
export async function EventLoader({ guest, token }: { guest: Guest; token: string }) {
  const store = await getStore();
  const [snap, stats] = await Promise.all([store.getSnapshot(), store.eventStats()]);
  return (
    <EventScreen
      token={token}
      firstName={firstName(guest.name)}
      initial={snap}
      stats={{ checkedIn: stats.checkedIn, photos: stats.photos, recentNames: stats.recentNames }}
    />
  );
}
