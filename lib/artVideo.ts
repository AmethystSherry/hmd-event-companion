import type { ArtVideoFit } from "@/components/ui/ArtVideo";

// Video ilustrasi (28 Okt, 1080×1920, 10 dtk loop) pasangan gambar statis di public/figma.
// s & y diukur dari frame pertama tiap video terhadap gambarnya (selisih piksel terkecil):
// lebar gambar = s × lebar video (di tengah), tepi atas gambar = y × tinggi video.
const F3 = 1179 / 1650; // rasio f3-*.webp & bt02

const fit = (name: string, ratio: number, s: number, y: number): ArtVideoFit => ({
  src: `/figma/${name}.mp4`,
  ratio,
  s,
  y,
});

export const ART_VIDEO = {
  "bt02-welcome-at-door": fit("bt02-welcome-at-door", F3, 0.96, 0.121),
  "f3-break": fit("f3-break", F3, 0.96, 0.154),
  "f3-open-space": fit("f3-open-space", F3, 1, 0.129),
  "f3-talkshow": fit("f3-talkshow", F3, 0.93, 0.196),
  "f3-office-tour": fit("f3-office-tour", F3, 0.97, 0.142),
  "f3-closing": fit("f3-closing", F3, 0.94, 0.171),
  "f3-weak-signal": fit("f3-weak-signal", F3, 0.92, 0.192),
  "t01a-invitation-closed": fit("t01a-invitation-closed", 780 / 1280, 0.89, 0.1),
  "t01-invitation-opened": fit("t01-invitation-opened", 780 / 828, 0.99, 0.2),
} satisfies Record<string, ArtVideoFit>;

export type ArtVideoName = keyof typeof ART_VIDEO;
