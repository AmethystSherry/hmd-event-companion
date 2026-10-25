import type { ReactNode } from "react";
import { CaretLeft } from "@/components/icons";
import { HeroState, IconButton, Screen, ScreenHeader } from "@/components/ui";

// Layar panitia yang dibangun di fase berikutnya (Foto = galeri kolase N4, Tanya = N1): tautan dari BP02 tetap
// mendarat di halaman, bukan 404.
export function CrewPlaceholder({
  eventId,
  title,
  icon,
  children,
}: {
  eventId: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Screen withBack>
      <ScreenHeader
        leading={
          <IconButton
            href={`/panitia/event/${eventId}/kontrol`}
            label="Kembali ke Kontrol acara"
            icon={<CaretLeft />}
          />
        }
        eyebrow="Kontrol acara"
        title={title}
      />
      <HeroState icon={icon} title="Segera hadir">
        {children}
      </HeroState>
    </Screen>
  );
}
