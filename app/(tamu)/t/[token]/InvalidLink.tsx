"use client";

import { ArrowClockwise, ChatCircle, Info, LinkBreak } from "@/components/icons";
import { Banner, Button, HeroState, LogoMark, Screen, Skeleton } from "@/components/ui";
import { EVENT } from "@/lib/event";
import styles from "./guest.module.css";

// T01e · Link tidak valid.
export function InvalidLink() {
  return (
    <Screen
      withBack
      bottomHeight={118}
      bottom={
        <>
          <Button
            href={`https://ig.me/m/${EVENT.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            icon={<ChatCircle />}
          >
            Hubungi panitia
          </Button>
          <Button variant="secondary" icon={<ArrowClockwise />} onClick={() => location.reload()}>
            Coba buka lagi
          </Button>
        </>
      }
    >
      <LogoMark />
      <HeroState
        className={styles.invalidHero}
        tone="danger"
        icon={<LinkBreak />}
        title="Link-nya nggak valid"
      >
        Mungkin salah ketik atau udah kedaluwarsa. Buka lagi dari pesan undangan, atau hubungi
        panitia.
      </HeroState>
      <Banner tone="neutral" icon={<Info />} title="Undangan ini personal">
        Satu link cuma buat satu tamu. Link teman nggak bisa dipakai.
      </Banner>
    </Screen>
  );
}

// Loading layar tamu: skeleton bentuk kartu.
export function GuestSkeleton() {
  return (
    <Screen>
      <Skeleton height={64} radius={12} />
      <Skeleton height={150} />
      <Skeleton height={260} />
    </Screen>
  );
}
