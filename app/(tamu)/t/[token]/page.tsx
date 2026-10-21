import { Suspense } from "react";
import { LinkBreak } from "@/components/icons";
import { HeroState, Screen, Skeleton } from "@/components/ui";
import { guestFromToken } from "@/lib/server/access";

// Halaman tamu (link unik bertoken). Alur T01–T05 dibangun di Phase 3–4.
// Token tidak pernah ditampilkan atau di-log; tamu hanya melihat datanya sendiri.
export default function GuestPage({ params }: PageProps<"/t/[token]">) {
  return (
    <Suspense
      fallback={
        <Screen>
          <Skeleton height={44} radius={12} />
          <Skeleton height={320} />
        </Screen>
      }
    >
      <Guest params={params} />
    </Suspense>
  );
}

async function Guest({ params }: { params: PageProps<"/t/[token]">["params"] }) {
  const { token } = await params;
  const guest = await guestFromToken(token);

  if (!guest) {
    // T01e · Link tidak valid
    return (
      <Screen>
        <HeroState tone="danger" icon={<LinkBreak />} title="Link-nya nggak kebaca">
          Minta link baru ke panitia ya.
        </HeroState>
      </Screen>
    );
  }

  const firstName = guest.name.split(" ")[0];
  return (
    <Screen>
      <p className="t-label c-label-2">Undangan pribadi · House Moving Day</p>
      <h1 className="t-title">Halo, {firstName}!</h1>
      <p className="t-body c-label-2">Halaman undangan lagi disiapkan.</p>
    </Screen>
  );
}
