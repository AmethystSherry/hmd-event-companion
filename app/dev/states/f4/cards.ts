import type { GuestCard } from "@/lib/data/types";

// Kartu BT05 dummy (Figma C18 "Tamu di sini"), per IG tamu dummy. Tamu lain dapat peran umum.
export const DEMO_CARDS: Record<string, GuestCard> = {
  rarawening: { role: "Product designer", askAbout: ["UX writing", "Design system", "Kopi"] },
  yogasap: { role: "Motion designer", askAbout: ["Rive", "film horor"] },
  dimaspr: { role: "Product manager", askAbout: ["AI tools", "kopi"] },
};

const ROLES: GuestCard[] = [
  { role: "Brand strategist", askAbout: ["branding"] },
  { role: "Frontend engineer", askAbout: ["Next.js", "keyboard"] },
  { role: "Illustrator", askAbout: ["Procreate", "kucing"] },
  { role: "Copywriter", askAbout: ["naming", "puisi"] },
  { role: "Fotografer", askAbout: ["film 35mm"] },
];

export function demoCard(ig: string, i: number): GuestCard {
  return DEMO_CARDS[ig] ?? ROLES[i % ROLES.length];
}
