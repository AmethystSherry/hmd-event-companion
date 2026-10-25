import type { GuestCard } from "@/lib/data/types";

// Kartu BT05 dummy (Figma N3 "Tamu di sini"), dicocokkan lewat nama depan tamu dummy (Bima, Nadia,
// Sekar, Rara). Tamu lain dapat peran umum bergiliran.
export const DEMO_CARDS: Record<string, GuestCard> = {
  bima: { role: "Motion designer", askAbout: ["Rive", "film horor"] },
  nadia: { role: "Product manager", askAbout: ["AI tools", "kopi"] },
  sekar: { role: "Brand strategist", askAbout: ["branding"] },
  rara: { role: "Product designer", askAbout: ["UX writing", "Design system", "Kopi"] },
};

const ROLES: GuestCard[] = [
  { role: "Frontend engineer", askAbout: ["Next.js", "keyboard"] },
  { role: "Illustrator", askAbout: ["Procreate", "kucing"] },
  { role: "Copywriter", askAbout: ["naming", "puisi"] },
  { role: "Fotografer", askAbout: ["film 35mm"] },
  { role: "UI designer", askAbout: [] },
];

export function demoCard(name: string, i: number): GuestCard {
  return DEMO_CARDS[name.split(" ")[0].toLowerCase()] ?? ROLES[i % ROLES.length];
}
