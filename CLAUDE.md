@AGENTS.md

# HMD Event Companion · Konsep B "Satu Layar, Dua Mode"

Web app mobile untuk House Moving Day Potara Studio (Minggu 8 Nov 2026, 13.00–17.00, ±20 tamu).
Tamu: undangan → tiket QR → layar acara JEDA ⇄ SESI yang digerakkan panitia → buku tamu & kolase.
Panitia: PIN → kirim undangan, scan tiket, kontrol sesi.

## Sumber kebenaran
- **Figma** `xYZlQ3GjRHHtYcod8rTIZJ`, page DOKSLI SAPI → section "Screen Flow · All Case" → frame
  **All Case Flow · v1** (4665:3650). Bab: F1 4666:6822 · F2 4667:4654 · F3+F4 4668:4730 ·
  N1 4669:4888 · N2 4669:4993 · N3 4670:4888 · N4 4670:4981 · F5 4671:4888.
  Layar ukuran penuh & komponen: "Finalise Alfin" (4648:1920), frame "Clean v0.5 / Components".
  Arsip (abaikan): Screen Flow Konsep B v2, "Backup · flow lama", Flow v0.2, iOS v0.3, Konsep A/B awal.
- Prioritas alur/layar/state/tampilan: **All Case Flow v1 > design.md > prd.md**.
  Aturan bisnis, data & privasi, NFR, milestone: **prd.md**.
- Rencana kerja per phase: `HANDOFF-CLAUDE-CODE.md`. Kerjakan satu phase, tunggu "lanjut".

## Stack (disetujui 21 Okt 2026)
- Next.js 16 (App Router, TypeScript, `cacheComponents` aktif) — baca `node_modules/next/dist/docs/`
  sebelum memakai API Next; banyak yang berubah dari versi lama.
- CSS biasa + CSS Modules + CSS variables (tanpa Tailwind) supaya nilai piksel Figma bisa persis.
- Font: Switzer variable self-host (`app/fonts/`, Free Font License), JetBrains Mono via `next/font`.
- Tes: Vitest. Format: Prettier (printWidth 100). Lint: ESLint (config Next).
- Rencana hosting: Vercel Hobby (gratis). Database: Supabase free (lihat "Ditunda").

### Ditunda sampai akhir proyek (keputusan user 21 Okt)
- **Database asli** (Supabase) dan **offline/service worker**. Sampai saat itu semua data lewat
  `lib/data` dengan adapter **mock in-memory** (`lib/data/mock.ts`). Pemanggil hanya memakai
  `getStore()`; adapter DB nanti dipasang di `lib/data/index.ts` tanpa mengubah layar.
- Akibatnya: data hilang saat server restart, dan mock hanya konsisten di satu proses `next dev`
  (cukup untuk uji banyak HP di LAN yang sama, tidak untuk Vercel serverless).

## Struktur
```
app/
  (tamu)/t/[token]/   halaman tamu via link unik bertoken (T01…T15, BT*)
  panitia/            ruang panitia (P*, BP*)
  dev/status/         versi build + status sumber data
  dev/ui/             preview design system (light & dark)
  dev/guests/         tamu dummy + link /t/{token}
  api/panitia/        login PIN, logout, cek sesi
  fonts/              Switzer
components/ui/        komponen design system Clean v0.5 (Phase 1)
lib/data/             tipe domain + DataStore (mock sekarang, DB nanti)
lib/server/           secrets, HMAC (token/tiket/sesi), PIN gate, guard akses
lib/csv.ts, event.ts  import CSV tamu; fakta acara + rundown default
data/                 CSV dummy (fiktif)
```

## Design system (Clean v0.5)
- Token: `app/tokens.css` — warna semantik light (utama) + dark (`prefers-color-scheme`, atau paksa
  dengan `html[data-theme="light|dark"]`), radius, spacing, shadow, motion, kelas tipografi `t-*`
  (Clean/* dari Figma; tracking Figma dalam persen → `em`).
- Komponen: `components/ui/*` (satu `.tsx` + `.module.css`), ekspor lewat `@/components/ui`.
  Button, IconButton, DestructiveButton, Toggle, Segmented, Badge, Pill/Chip, Card/CardLabel/InnerBox,
  StatTile, ListRow/Avatar, Banner/TextAction, HeroState, Field, Toast (undo ring), Sheet, TabBar,
  Ticket/TicketStub, LogoMark, Screen/ScreenHeader/Skeleton, SearchField, AddChip.
- `Screen`: `withBack` (konten mulai 8px, layar dengan tombol back), `bottom` + `bottomHeight`
  (1 tombol 54, 2 tombol 118, +caption 28) → fade scroll-edge otomatis di atas aksi bawah.
- Ikon: hanya lewat `@/components/icons` (Phosphor `/ssr`, ukuran via prop `size`, warna `currentColor`).
- Aset Figma statis di `public/figma/` (logo, ember, knob toggle). Bentuk yang ikut tema (lekukan,
  gerigi, tepi sobek tiket) digambar CSS/SVG inline dengan `var(--bg)`.
- Jangan pakai warna hex di komponen; pakai token. Pengecualian yang memang tetap di kedua mode:
  Button Primary, tab bar panitia, tombol destruktif, QR.
- Preview semua komponen & tema: `/dev/ui`.

## Data & akses (Phase 2)
- Model: `lib/data/types.ts` (Guest, Ticket, ProfileCard, Session, EventState, Question, Photo,
  Feedback, Script). Interface `DataStore` di `lib/data/store.ts`; implementasi mock di
  `lib/data/mock.ts`. Selalu akses lewat `await getStore()` (sudah memanggil `connection()`).
- Seed: `data/tamu-hmd-dummy.csv` (20 tamu FIKTIF) + `DEFAULT_RUNDOWN` di `lib/event.ts`. Seed jalan
  otomatis saat store dibuat, idempoten (upsert by IG). Status seed: 15 undangan terkirim,
  17 hadir (punya tiket), 1 tidak hadir, 2 belum jawab.
- Import CSV (P04 & seed): `lib/csv.ts` — kolom `nama, ig, wa`; error baris kosong, IG dobel,
  format WA; ringkasan "20 baris · 0 error · 3 tanpa WA".
- Tamu: `/t/{token}`, token = HMAC(GUEST_TOKEN_SECRET, guestId) 22 karakter → stabil, tak
  tertebak. Guard `guestFromToken()` di `lib/server/access.ts`; token salah → T01e.
- Tiket: QR = `ticketId.sig` (HMAC TICKET_HMAC_SECRET), tanpa data pribadi; `verifyTicket()`.
  Kode pendek `HMD-014-XXXX`. Check-in idempoten: scan kedua → `used`, hitungan tetap.
- Panitia: `POST /api/panitia/login {pin}` → cookie httpOnly `hmd_crew` (stateless, HMAC
  SESSION_SECRET, 24 jam). 5× salah per IP → 429 terkunci 5 menit (`lib/server/pinGate.ts`).
  `GET /api/panitia/session`, `POST /api/panitia/logout`. Guard `isCrew()`.
- Hapus otomatis 8 Des 2026 (`EVENT.purgeAt`): dicek tiap akses store (tanpa cron); data per
  orang dihapus, rekap agregat tanpa identitas tetap (`aggregates()`). Saat pindah ke DB asli:
  jalankan hal yang sama via cron gratis (mis. Vercel Cron / Supabase pg_cron).
- Dev: `/dev/guests` daftar tamu dummy + link tamu (production: hanya panitia).
- Secret: `.env.local` (tidak di-commit). `EVENT_PIN` diisi sendiri oleh tim, jangan ditulis di
  chat/kode. Rate-limit & sesi in-memory → per instance server (cukup untuk 1 server).

## Alur F1 (Phase 3)
Tamu (`app/(tamu)/t/[token]/`):
- `/t/{token}` merutekan sesuai jawaban: belum → T01 Undangan · hadir → T03 Tiket (QR asli dari
  `components/TicketQr.tsx`) · tidak → T02b "Nggak bisa datang". Token salah → T01e.
- `/konfirmasi` T02 (+T02c belum lengkap: tombol aria-disabled, tap → error per field; T02d gagal
  kirim: banner + "Coba lagi", isian tetap). Server action `submitRsvp` di `actions.ts`.
- `/kenalan` T02b chip skill/asbun maks. 3 (+ "Tambah" sendiri) → `saveIntro`.
- `/besok` T04 countdown H-1 · `/kalender` file .ics (`lib/ics.ts`).
Panitia (`app/panitia/`):
- `/panitia` P01 PIN (keypad, kirim otomatis 6 digit; P01b sisa percobaan; P01c countdown kunci).
  Sudah masuk → placeholder Kontrol (BP01 di Phase 5). Halaman panitia lain pakai `requireCrew()`.
- `/panitia/tamu` P03 (stat Diundang/Konfirmasi/Hadir, cari, refresh tiap 5 dtk sbg pengganti realtime).
- `/panitia/undangan` P04 (+`?mode=pengingat` P04b, P04c saat CSV error): unggah CSV (server
  action, baris valid langsung masuk), Kirim WA (wa.me) / Salin link → otomatis ditandai Terkirim.
- Template pesan persis Figma di `lib/invite.ts`. Salin teks pakai `lib/clipboard.ts` (fallback http LAN).
- Catatan uji: kalau panel Browser Claude tersembunyi, rAF terblokir dan konten Suspense tidak
  tampil di sana — bukan bug; cek lewat HTML/curl atau HP.

## Alur F2 (Phase 4) — check-in tiket QR
Tamu:
- `/t/{token}`: sudah masuk → T03b (tiket bukti, QR nonaktif); hari-H (WIB, `isEventDay`) → T05.
  `/t/{token}/pintu` = T05 kapan saja (uji/demo). T05 (`pintu/DoorTicket.tsx`) poll
  `/t/{token}/status` tiap 2 dtk → animasi sobek T05a → BT02 (±900 ms, reduce motion = fade)
  → otomatis 3 dtk ke `/t/{token}/acara` (placeholder sampai Phase 5). Wake Lock saat tiket tampil.
Panitia:
- `/panitia/scan` P05: `qr-scanner` (MIT), kamera tetap nyala; sheet mengambang P06 Valid (tutup
  2 dtk) / P06b Sudah dipakai / P06c Tidak dikenal. Kamera ditolak/error → `/panitia/cari?kamera=error`.
- `/panitia/cari` P07 cari nama/IG/kode → Check-in manual; P07b banner kamera; P07c walk-in (tap kartu
  "nggak ada di daftar" → sheet). Check-in manual yang gagal karena offline diantre di HP & dikirim ulang.
- `/panitia/cari/manual` P07d pratinjau + `/api/panitia/daftar-manual` PDF (jspdf).
- API: `POST /api/panitia/checkin {qr}|{guestId}` (header `x-device`), `POST /api/panitia/walkin`.
  Logika di `lib/server/checkin.ts`; QR diverifikasi HMAC di server; 2 HP scan tiket sama → kedua "used".
- Validasi offline di HP panitia (tanpa server) ikut ditunda bersama offline/service worker.

## Cara run
```bash
npm install
npm run dev          # http://localhost:3000
npm run dev          # HP di Wi-Fi yang sama: http://<IP-laptop>:3000 (lihat baris "Network")
npm test             # vitest
npm run lint && npm run typecheck && npm run format:check
npm run build
```
Env: salin `.env.example` → `.env.local`, isi 3 secret acak + `EVENT_PIN` (6 digit, pilih sendiri).

## Konvensi
- Copy UI Bahasa Indonesia santai, persis Figma/design.md §7. Jam 24 jam pakai titik (13.00).
- ID layar Figma (T01, BT03, P06b…) dipakai di nama komponen/route/komentar supaya mudah dilacak.
- Semua halaman `noindex` (metadata + header `X-Robots-Tag`). Token tamu tidak pernah ditampilkan/di-log.
- Tidak ada data tamu asli, password, atau secret di kode/chat. Hanya CSV dummy sampai Test Day.
- Hanya layanan gratis / yang sudah dimiliki studio.
- Tiap layar wajib punya state loading, kosong, error, offline sesuai kartu case All Case Flow v1.
- Commit kecil per fitur. Repo GitHub harus **private** (PRD rahasia sampai Test Day).

## Status phase
- [x] Phase 0 — fondasi (tanpa DB & offline, ditunda)
- [x] Phase 1 — design system (`/dev/ui`)
- [x] Phase 2 — data mock, akses token & PIN, seed dummy, tiket HMAC, purge
- [x] Phase 3 — F1 undangan & konfirmasi (tamu T01–T04 + state, panitia P01/P03/P04)
- [x] Phase 4 — F2 check-in tiket QR (T05→BT02, T03b, P05–P07d)
- [ ] Phase 5 — F3+F4 mode acara realtime
