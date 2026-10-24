import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Camera, Coffee, Key, Play } from "@/components/icons";
import { LiveRefresh } from "@/components/LiveRefresh";
import { PhotoOutbox } from "@/components/n4/PhotoOutbox";
import { RegisterOffline } from "@/components/RegisterOffline";
import { Badge, Button, HeroState, Screen, ScreenHeader, Skeleton } from "@/components/ui";
import { getStore } from "@/lib/data";
import { firstName } from "@/lib/format";
import { rundownView } from "@/lib/rundown";
import { guestFromToken } from "@/lib/server/access";

export const metadata = { title: "House Moving Day · Potara Studio" };

// Layar acara tamu (placeholder F3/F4): ikut mode yang diatur panitia di BP00 — SESI (sesi yang
// lagi jalan) atau JEDA (sesi berikutnya). Panitia Mulai/Selesaikan → rev naik → SSE →
// halaman ini pindah sendiri tanpa reload. Isi layar sebenarnya (BT20/BT03) dibangun di F3/F4.
export default function EventScreenPage({ params }: PageProps<"/t/[token]/acara">) {
  return (
    <Suspense
      fallback={
        <Screen>
          <Skeleton height={80} radius={12} />
          <Skeleton height={260} />
        </Screen>
      }
    >
      <EventScreen params={params} />
    </Suspense>
  );
}

async function EventScreen({ params }: Pick<PageProps<"/t/[token]/acara">, "params">) {
  const { token } = await params;
  const guest = await guestFromToken(token);
  const store = await getStore();
  const event = guest ? store.getEvent(guest.eventId) : null;
  const ticket = guest ? store.ticketFor(guest.id) : null;
  // Belum masuk (atau link salah) → kembali ke tiket.
  if (!guest || !event || ticket?.status !== "dipakai") redirect(`/t/${token}`);
  if (event.mode === "closed") redirect(`/t/${token}/selesai`); // F5 · BT12

  const { active, next } = rundownView(event, store.listSessions(event.id));
  return (
    <>
      <Screen
        bottomHeight={active ? 54 : 118}
        bottom={
          <>
            {/* N4: pas Jeda tamu bisa foto buat kolase (BT03 asli menyusul di F3). */}
            {!active && (
              <Button href={`/t/${token}/foto`} icon={<Camera />}>
                Foto buat kolase
              </Button>
            )}
            <Button variant="secondary" href={`/t/${token}`} icon={<Key />}>
              Lihat tiket
            </Button>
          </>
        }
      >
        <ScreenHeader
          eyebrow={`${event.name} · hai, ${firstName(guest.name)}`}
          title={active ? active.title : "Lagi jeda"}
          trailing={
            active ? (
              <Badge tone="live" pulse>
                Sesi
              </Badge>
            ) : (
              <Badge tone="neutral">Jeda</Badge>
            )
          }
        />
        {active ? (
          <HeroState icon={<Play size={30} />} title={`${active.startsAt}–${active.endsAt}`}>
            Sesi lagi jalan. Layar sesi lengkap (pertanyaan, titik tur) menyusul di F3/F4.
          </HeroState>
        ) : (
          <HeroState
            icon={<Coffee size={30} />}
            title={next ? `Berikutnya: ${next.title}` : "Santai dulu"}
          >
            {next
              ? `Mulai sekitar ${next.startsAt}. Layar ini pindah sendiri pas panitia mulai sesi.`
              : "Nikmati open space. Layar ini pindah sendiri pas panitia mulai sesi."}
          </HeroState>
        )}
      </Screen>
      <LiveRefresh token={token} />
      <PhotoOutbox token={token} />
      <RegisterOffline />
    </>
  );
}
