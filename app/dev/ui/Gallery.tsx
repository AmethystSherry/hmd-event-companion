"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowClockwise,
  BookOpen,
  Camera,
  CaretLeft,
  ChatCircle,
  CheckCircle,
  Clock,
  CloudArrowUp,
  UploadSimple,
  Image as ImageIcon,
  ListBullets,
  LockKey,
  MagnifyingGlass,
  PaperPlaneTilt,
  PencilSimple,
  Play,
  Trash,
  Users,
  WhatsappLogo,
  WifiSlash,
  X,
} from "@/components/icons";
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  CardLabel,
  Chip,
  Countdown,
  Dialog,
  Dropzone,
  Field,
  HeroState,
  IconButton,
  InnerBox,
  ListRow,
  Masonry,
  NumberedRow,
  LogoMark,
  PhotoPin,
  Pill,
  PinPad,
  Segmented,
  Sheet,
  Skeleton,
  StarRating,
  StatTile,
  TabBar,
  TextAction,
  Ticket,
  TicketStub,
  Toast,
  Toggle,
  type TicketData,
} from "@/components/ui";
import styles from "./gallery.module.css";

type Theme = "system" | "light" | "dark";

const TICKET: TicketData = {
  name: "Rara Wening",
  keyNo: "#014",
  when: "Min, 8 Nov · 13.00",
  where: "Kantor baru Potara",
  code: "HMD-014-7F3K",
};

const COLORS = [
  "bg",
  "card",
  "card-2",
  "label",
  "label-2",
  "label-3",
  "cta",
  "accent",
  "accent-soft",
  "accent-text",
  "crew",
  "crew-soft",
  "crew-text",
  "success-soft",
  "success-text",
  "warning-soft",
  "warning-text",
  "danger-soft",
  "danger-text",
];

// T15: pin kolase placeholder (tinggi bervariasi, foto sendiri berlabel "Fotoku").
const PINS = [
  { id: "a", name: "Rara Wening", caption: "Rara · Talkshow", h: 1200, tone: 0, mine: true },
  { id: "b", name: "Bima Sakti", caption: "Bima · Open space", h: 900, tone: 1, mine: false },
  { id: "c", name: "Nadia Putri", caption: "Nadia · Tur kantor", h: 1000, tone: 2, mine: false },
  { id: "d", name: "Fajar Nugroho", caption: "Fajar · Open space", h: 1300, tone: 3, mine: false },
];

export function Gallery() {
  const [theme, setTheme] = useState<Theme>("system");
  const [follow, setFollow] = useState(true);
  const [invite, setInvite] = useState<"ya" | "nanti">("ya");
  const [chips, setChips] = useState<string[]>(["Talkshow"]);
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [toastKey, setToastKey] = useState(0);
  const [undone, setUndone] = useState<string | null>(null);
  const [pin, setPin] = useState("12");
  const [stars, setStars] = useState(4);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") delete root.dataset.theme;
    else root.dataset.theme = theme;
    return () => {
      delete root.dataset.theme;
    };
  }, [theme]);

  const toggleChip = (c: string) =>
    setChips((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));

  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <div className={styles.brand}>
          <LogoMark />
          <div>
            <p className="t-label c-label-2">Clean v0.5</p>
            <h1 className="t-title">Design system</h1>
          </div>
        </div>
        <Segmented
          label="Tema"
          value={theme}
          onChange={setTheme}
          options={[
            { value: "system", label: "Sistem" },
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ]}
        />
      </header>

      <Section title="Tipografi">
        <Card>
          <p className="t-display">12</p>
          <p className="t-number-l">26:41</p>
          <p className="t-title">Kamu udah di dalam, Rara!</p>
          <p className="t-number-m">18/20</p>
          <p className="t-card-title">Kunci rumah baru</p>
          <p className="t-headline">Headline 17 · Mulai Talkshow</p>
          <p className="t-body">Body 15 · Pindah rumah, pindah cara kerja.</p>
          <p className="t-body-emph">Body Emph 15 · Rara Wening</p>
          <p className="t-label c-label-2">Label 13 · Selanjutnya</p>
          <p className="t-label-emph">Label Emph 13 · Mulai 14.00</p>
          <p className="t-caption">Caption 12 · Tamu ke-9 dari 20</p>
          <p className="t-code">HMD-014-7F3K</p>
        </Card>
      </Section>

      <Section title="Warna">
        <div className={styles.swatches}>
          {COLORS.map((c) => (
            <div key={c} className={styles.swatch}>
              <span style={{ background: `var(--${c})` }} />
              <code>{c}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Button · 2 size × 3 style × Text / Icon only">
        <ButtonMatrix theme="light" />
        <ButtonMatrix theme="dark" />
      </Section>

      <Section title="Button · contoh F1">
        <Button icon={<Play weight="fill" />}>Mulai Talkshow</Button>
        <Button variant="destructive" icon={<Trash />}>
          Hapus sesi
        </Button>
        <div className={styles.between}>
          <div>
            <p className="t-body-emph">Tamu &amp; undangan</p>
            <p className="t-label c-label-2">13/20 diundang</p>
          </div>
          <Button size="sm" variant="secondary">
            Buka
          </Button>
        </div>
        <Card inset>
          <ListRow
            leading={<Avatar name="Rara Wening" />}
            title="Rara Wening"
            subtitle="@rarawening"
            trailing={
              <div className={styles.rowTight}>
                <Button
                  size="sm"
                  variant="secondary"
                  iconOnly
                  label="Ubah tamu"
                  icon={<PencilSimple />}
                />
                <Button size="sm" iconOnly label="Undang via DM IG" icon={<PaperPlaneTilt />} />
              </div>
            }
          />
          <ListRow
            leading={<Avatar name="Bima Sakti" />}
            title="Bima Sakti"
            subtitle="@bimasakti"
            trailing={
              <Button size="sm" icon={<WhatsappLogo />}>
                Kirim WA
              </Button>
            }
          />
        </Card>
      </Section>

      <Section title="IconButton toolbar 44">
        <div className={styles.row}>
          <IconButton label="Kembali" icon={<CaretLeft />} />
          <IconButton label="Muat ulang" icon={<ArrowClockwise />} />
          <div className={styles.cameraBg}>
            <IconButton variant="glass" label="Tutup kamera" icon={<X />} />
          </div>
        </div>
      </Section>

      <Section title="Kontrol">
        <Card>
          <div className={styles.between}>
            <div>
              <p className="t-body-emph">Saya sudah follow @potarastudio</p>
              <p className="t-label c-label-2">Syarat hadir</p>
            </div>
            <Toggle label="Sudah follow @potarastudio" checked={follow} onChange={setFollow} />
          </div>
          <div className={styles.between}>
            <p className="t-body-emph">Toggle off</p>
            <Toggle label="Contoh off" checked={false} onChange={() => {}} />
          </div>
        </Card>
        <Card>
          <CardLabel>Mau diundang lagi?</CardLabel>
          <Segmented
            label="Mau diundang lagi?"
            value={invite}
            onChange={setInvite}
            options={[
              { value: "ya", label: "Mau dong" },
              { value: "nanti", label: "Nanti dulu" },
            ]}
          />
        </Card>
        <Card>
          <CardLabel>Bagian paling seru</CardLabel>
          <div className={styles.wrap}>
            {["Open space", "Talkshow", "Tur kantor", "Networking"].map((c) => (
              <Chip key={c} selected={chips.includes(c)} onClick={() => toggleChip(c)}>
                {c}
              </Chip>
            ))}
          </div>
          <CardLabel>Potensi asbun (oranye lembut)</CardLabel>
          <div className={styles.wrap}>
            <Chip tone="accent" selected>
              Kopi
            </Chip>
            <Chip tone="accent" selected={false}>
              Film horor
            </Chip>
          </div>
        </Card>
        <Card>
          <Field label="Nama" defaultValue="Rara Wening" />
          <Field label="Instagram" placeholder="@username" error="IG wajib diisi ya" />
          <Field label="WhatsApp (opsional)" placeholder="08xx" hint="Buat kirim pengingat H-1" />
          <Field
            label="Satu hal yang bisa kami perbaiki"
            multiline
            placeholder="Tulis di sini (opsional)"
          />
        </Card>
      </Section>

      <Section title="Badge · 5 tipe & Pill">
        {(["light", "dark"] as const).map((t) => (
          <div key={t} data-theme={t} className={styles.themePanel}>
            <p className="t-label-emph c-label-2">{t === "light" ? "Light" : "Dark"}</p>
            <div className={styles.wrap}>
              <Badge tone="live" pulse>
                Talkshow
              </Badge>
              <Badge tone="crew">Belum jawab</Badge>
              <Badge tone="success">Hadir</Badge>
              <Badge tone="neutral">Belum diundang</Badge>
              <Badge tone="danger">Nggak bisa</Badge>
            </div>
            <div className={styles.wrap}>
              <Pill icon={<Users />}>20 tamu</Pill>
              <Pill icon={<ListBullets />}>Rundown 4 sesi</Pill>
              <Pill icon={<Clock />}>13.00–17.00</Pill>
            </div>
          </div>
        ))}
      </Section>

      <Section title="Stat & list">
        <div className={styles.stats}>
          <StatTile icon={<Users />} value="18/20" label="Check-in" href="#" />
          <StatTile icon={<ImageIcon />} value="34" label="Foto" />
          <StatTile icon={<ChatCircle />} value="0" label="Pertanyaan" />
        </div>
        <Card inset>
          <ListRow
            leading={<Avatar name="Rara Wening" />}
            title="Rara Wening"
            subtitle="@rarawening"
            trailing="13.04"
          />
          <ListRow
            leading={<Avatar name="Bima Sakti" />}
            title="Bima Sakti"
            subtitle="@bimasakti"
            trailing="13.10"
            onClick={() => {}}
            chevron
          />
          <ListRow leading={<Avatar name="Sekar Ayu" />} title="Sekar Ayu" subtitle="@sekarayu" />
        </Card>
        <Card>
          <CardLabel
            trailing={
              <Badge tone="live" pulse>
                Live
              </Badge>
            }
          >
            Sedang berlangsung · Ruang 02
          </CardLabel>
          <p className="t-card-title">Talkshow</p>
          <p className="t-label c-label-2">Mulai 14.00 · Ruang 02</p>
          <InnerBox icon={<CheckCircle />}>Semua sesi udah selesai · 4/4</InnerBox>
        </Card>
      </Section>

      <Section title="Banner, toast, sheet">
        <Banner
          tone="danger"
          icon={<WifiSlash />}
          title="Gagal kirim, sinyalnya lemah"
          action={<TextAction>Coba lagi</TextAction>}
        >
          Tenang, isianmu nggak hilang. Coba lagi ya.
        </Banner>
        <Banner tone="warning" icon={<LockKey />} title="Terlalu banyak salah · coba lagi 04:52">
          Demi keamanan, masuk dikunci sementara. Lupa PIN? Tanya koordinator acara.
        </Banner>
        <Banner tone="neutral" icon={<WifiSlash />} title="Sinyal lagi lemah">
          Menampilkan agenda terakhir (13.42).
        </Banner>
        <div className={styles.toastRow}>
          <Toast icon={<ArrowClockwise />}>Diubah oleh panitia lain · +5 menit</Toast>
        </div>
        <div className={styles.toastRow}>
          <Toast
            key={toastKey}
            icon={<Play weight="fill" />}
            undo={{
              onUndo: () => setUndone("Dibatalkan"),
              onExpire: () => setUndone("Lewat 5 dtk"),
            }}
          >
            Talkshow dimulai · 20 HP pindah
          </Toast>
        </div>
        <div className={styles.row}>
          <Button
            variant="secondary"
            onClick={() => {
              setUndone(null);
              setToastKey((k) => k + 1);
            }}
          >
            Ulang toast {undone ? `(${undone})` : ""}
          </Button>
        </div>
        <Button variant="secondary" icon={<BookOpen />} onClick={() => setSheet(true)}>
          Buka sheet konfirmasi
        </Button>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="Tutup acara sekarang?">
          <span className={styles.sheetIcon}>
            <BookOpen size={30} />
          </span>
          <p className="t-card-title" style={{ textAlign: "center" }}>
            Tutup acara sekarang?
          </p>
          <p className="t-body c-label-2" style={{ textAlign: "center" }}>
            Semua HP tamu (20) langsung pindah ke buku tamu dan kolase. Layar acara nggak bisa
            dibuka lagi.
          </p>
          <div style={{ width: "100%" }}>
            <InnerBox icon={<CheckCircle size={20} />}>Semua sesi udah selesai · 4/4</InnerBox>
          </div>
          <div className={styles.sheetActions}>
            <Button icon={<BookOpen />} onClick={() => setSheet(false)}>
              Ya, tutup acara
            </Button>
            <Button variant="secondary" onClick={() => setSheet(false)}>
              Belum, kembali
            </Button>
          </div>
        </Sheet>
        <Button variant="secondary" onClick={() => setDialog(true)}>
          Buka dialog konfirmasi (BP00a)
        </Button>
        <Dialog
          open={dialog}
          onClose={() => setDialog(false)}
          title="Selesaikan Open space?"
          actions={
            <>
              <Button onClick={() => setDialog(false)}>Ya, selesaikan</Button>
              <Button variant="secondary" onClick={() => setDialog(false)}>
                Batal
              </Button>
            </>
          }
        >
          Udah jalan 00:12:34. Layar tamu otomatis jeda sampai kamu mulai sesi berikutnya.
        </Dialog>
      </Section>

      <Section title="Hero state & loading">
        <Card>
          <HeroState icon={<ChatCircle />} title="Belum ada pertanyaan">
            Biasanya mulai masuk 5 menit setelah talkshow mulai.
          </HeroState>
        </Card>
        <Card>
          <HeroState tone="danger" icon={<MagnifyingGlass />} title="Link-nya nggak kebaca">
            Minta link baru ke panitia ya.
          </HeroState>
        </Card>
        <Skeleton height={140} />
        <div className={styles.stats}>
          <Skeleton height={110} radius={22} />
          <Skeleton height={110} radius={22} />
          <Skeleton height={110} radius={22} />
        </div>
      </Section>

      <Section title="F5 · StarRating, Masonry + PhotoPin">
        <Card>
          <CardLabel>Nilai acaranya</CardLabel>
          <StarRating label="Nilai acaranya" value={stars} onChange={setStars} />
        </Card>
        <Masonry
          items={PINS}
          itemKey={(p) => p.id}
          ratio={(p) => p.h / 1000}
          render={(p) => (
            <PhotoPin
              width={1000}
              height={p.h}
              name={p.name}
              caption={p.caption}
              mine={p.mine}
              tone={p.tone}
              label={`Buka foto dari ${p.name}`}
              onOpen={() => {}}
            />
          )}
        />
      </Section>

      <Section title="F1 · Countdown, NumberedRow, Dropzone, PinPad">
        <Countdown
          label="Pintu dibuka dalam"
          value="17 hari 4 jam"
          caption="Minggu, 8 Nov · 13.00 WIB"
        />
        <Card inset>
          <NumberedRow number={1} title="Open space" subtitle="Keliling rumah baru" />
          <NumberedRow
            number="02"
            title="Talkshow"
            subtitle="14.00 · 45 mnt"
            meta="PIC Tim Acara"
            chevron
            onClick={() => {}}
          />
        </Card>
        <Dropzone
          icon={<CloudArrowUp />}
          title="Belum ada daftar tamu"
          action={
            <Button size="sm" icon={<UploadSimple />}>
              Pilih file CSV
            </Button>
          }
        >
          Unggah CSV sekali di awal. Setelah itu tamu ditambah atau diedit manual.
        </Dropzone>
        <PinPad value={pin} onChange={setPin} state={pin.length === 6 ? "error" : "idle"} />
      </Section>

      <Section title="Tiket">
        <Ticket data={TICKET} state="terkonfirmasi" />
        <Ticket data={TICKET} state="aktif" />
        <Ticket data={TICKET} state="sobek" stamp={{ time: "13.04", guestNo: 9, total: 20 }} />
        <TicketStub code={TICKET.code} />
      </Section>

      <Section title="Tab bar panitia">
        <div className={styles.tabbarBg}>
          <TabBar active="kontrol" />
          <TabBar active="tamu" />
          <TabBar active="scan" />
        </div>
      </Section>

      <Section title="Ikon (Phosphor)">
        <div className={styles.wrap}>
          <PaperPlaneTilt size={20} />
          <PencilSimple size={20} />
          <WhatsappLogo size={20} />
          <Trash size={20} />
          <Camera size={20} />
          <Users size={20} />
          <ChatCircle size={20} />
          <Clock size={20} />
          <WifiSlash size={20} />
        </div>
      </Section>
    </div>
  );
}

const VARIANTS = ["primary", "secondary", "destructive"] as const;

// Matriks Clean/Button (4587:316) di panel bertema sendiri, supaya light & dark terlihat sekaligus.
function ButtonMatrix({ theme }: { theme: "light" | "dark" }) {
  return (
    <div data-theme={theme} className={styles.themePanel}>
      <p className="t-label-emph c-label-2">{theme === "light" ? "Light" : "Dark"}</p>
      <p className="t-label c-label-2">Large · 54</p>
      {VARIANTS.map((v) => (
        <div key={v} className={styles.matrixRow}>
          <Button variant={v}>Foto buat kolase</Button>
          <Button variant={v} icon={<Camera />}>
            Foto buat kolase
          </Button>
          <div className={styles.rowTight}>
            <Button variant={v} iconOnly label="Kamera" icon={<Camera />} />
            <Button variant={v} disabled iconOnly label="Kamera (nonaktif)" icon={<Camera />} />
            <span className={styles.pressed}>
              <Button variant={v} iconOnly label="Kamera (ditekan)" icon={<Camera />} />
            </span>
          </div>
        </div>
      ))}
      <Button disabled>Saya hadir · disabled</Button>
      <span className={styles.pressedBlock}>
        <Button variant="secondary">Belum, kembali · pressed</Button>
      </span>

      <p className="t-label c-label-2">Small · 36</p>
      {VARIANTS.map((v) => (
        <div key={v} className={styles.wrap}>
          <Button size="sm" variant={v}>
            Tambah
          </Button>
          <Button size="sm" variant={v} icon={<Camera />}>
            Kamera
          </Button>
          <Button size="sm" variant={v} iconOnly label="Kamera" icon={<Camera />} />
          <Button
            size="sm"
            variant={v}
            disabled
            iconOnly
            label="Kamera (nonaktif)"
            icon={<Camera />}
          />
          <span className={styles.pressed}>
            <Button size="sm" variant={v} iconOnly label="Kamera (ditekan)" icon={<Camera />} />
          </span>
        </div>
      ))}
      <p className="t-caption c-label-3">Ikon ke-2 dari kanan: disabled · paling kanan: pressed</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className={styles.section}>
      <h2 className="t-label-emph c-label-2">{title}</h2>
      {children}
    </section>
  );
}
