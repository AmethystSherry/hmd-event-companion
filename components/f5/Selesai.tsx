import Link from "next/link";
import {
  BookOpen,
  Camera,
  CaretRight,
  ChatCircle,
  Image as ImageIcon,
  InstagramLogo,
  Users,
} from "@/components/icons";
import {
  Button,
  Card,
  CardLabel,
  HeroState,
  Screen,
  ScreenHeader,
  StatTile,
} from "@/components/ui";
import { cx } from "@/lib/cx";
import s from "./f5.module.css";

// BT12 · Acara selesai: layar akar setelah panitia tutup acara (tanpa back). Semua HP tamu
// pindah ke sini lewat rev → SSE. Tile "pertanyaan" (N1) = semua pertanyaan talkshow acara ini.
export function SelesaiScreen({
  eyebrow,
  photoCount,
  questionCount,
  photoGuests,
  guestCount,
  latest,
  kolaseHref,
  bukuTamuHref,
}: {
  eyebrow: string; // "17.02 · 4 dari 4 bagian selesai"
  photoCount: number;
  questionCount: number;
  photoGuests: number; // tamu yang punya foto
  guestCount: number; // tamu yang udah masuk
  latest: { id: string; src?: string; tone: number }[]; // 4 foto terbaru
  kolaseHref: string;
  bukuTamuHref: string;
}) {
  return (
    <Screen
      bottomHeight={118}
      bottom={
        <>
          <Button href={bukuTamuHref} icon={<BookOpen />}>
            Isi buku tamu
          </Button>
          <Button variant="secondary" href={kolaseHref} icon={<ImageIcon />}>
            Lihat kolase lengkap
          </Button>
        </>
      }
    >
      <ScreenHeader eyebrow={eyebrow} title="Makasih udah mampir ke rumah baru!" />
      <div className={s.tiles}>
        <StatTile icon={<Camera />} value={photoCount} label="foto kolase" />
        <StatTile icon={<ChatCircle />} value={questionCount} label="pertanyaan" />
        <StatTile icon={<Users />} value={guestCount} label="tamu" />
      </div>
      <Link href={kolaseHref} className={s.cardLink}>
        <Card>
          <CardLabel trailing={<CaretRight size={16} className="c-label-3" />}>
            Kolase kulkas
          </CardLabel>
          {latest.length > 0 && (
            <ul className={s.thumbs} aria-label="Foto terbaru di kolase">
              {latest.map((p) => (
                <li key={p.id} className={cx(s.thumb, !p.src && s[`ph${p.tone % 4}`])}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- route proxy, bukan aset statis */}
                  {p.src && <img src={p.src} alt="" loading="lazy" draggable={false} />}
                </li>
              ))}
            </ul>
          )}
          <p className="t-label c-label-2">
            {photoCount
              ? `Dibuat otomatis dari ${photoCount} foto dari ${photoGuests} tamu.`
              : "Belum ada foto yang nempel di kulkas."}
          </p>
        </Card>
      </Link>
    </Screen>
  );
}

// Tamu yang belum check-in buka link setelah acara ditutup: tanpa buku tamu & kolase
// (keputusan F5). Copy belum ada di Figma.
export function SelesaiLuarScreen({
  eyebrow,
  followHref,
}: {
  eyebrow: string;
  followHref: string;
}) {
  return (
    <Screen
      bottom={
        <Button variant="secondary" href={followHref} icon={<InstagramLogo />}>
          Follow @potarastudio
        </Button>
      }
    >
      <ScreenHeader eyebrow={eyebrow} title="Acaranya udah selesai" />
      <HeroState icon={<BookOpen size={30} />} tone="accent" title="Makasih udah mau datang">
        Sampai ketemu di acara Potara berikutnya. Kabar terbarunya ada di Instagram kami.
      </HeroState>
    </Screen>
  );
}
