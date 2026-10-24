import type { ReactNode } from "react";
import { CaretLeft } from "@/components/icons";
import { HeroState, IconButton, Screen, ScreenHeader } from "@/components/ui";

// Layar tamu yang dibangun di fase berikutnya (Galeri BT07d · N4 susulan, Tanya · N1, Ubah kartu
// T11 · N3): pintasan di layar acara tetap mendarat di halaman, bukan 404.
export function GuestPlaceholder({
  token,
  title,
  icon,
  children,
}: {
  token: string;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <Screen withBack>
      <ScreenHeader
        leading={
          <IconButton href={`/t/${token}/acara`} label="Kembali ke acara" icon={<CaretLeft />} />
        }
        eyebrow="House Moving Day"
        title={title}
      />
      <HeroState icon={icon} title="Segera hadir">
        {children}
      </HeroState>
    </Screen>
  );
}
