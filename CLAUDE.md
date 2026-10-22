@AGENTS.md

# HMD Event Companion · Konsep B "Satu Layar, Dua Mode"

Web app mobile untuk House Moving Day Potara Studio (Minggu 8 Nov 2026, 13.00–17.00, ±20 tamu).

## Status (22 Okt 2026)
- Logika direvisi (prd.md v0.2). Kode lama Phase 0–5 diarsipkan di branch **`archive/pre-revisi`** /
  tag **`archive-pre-revisi`** (commit `db60e73`) — bukan acuan alur. Ambil ulang hanya kalau diminta
  (`git show archive-pre-revisi:<path>`). Jangan force push / rewrite history / hapus branch.
- **F1 · Undangan & konfirmasi sudah dibangun** (Figma band `4732:12593`, `F1-deliverables.md`,
  prd §7 F1). F2–F5 & N1–N4 belum; kerjakan lewat `HANDOFF-CLAUDE-CODE.md` setelah F1 di-review.
- Update 22 Okt sore (Figma `4810:11003/11052/11132/11218`): PE03/PE03b dibangun ulang + sheet
  PE03e Ubah detail event & PE03h Hapus event. "Buka Kontrol acara" aktif kalau detail + tamu +
  rundown terisi → `/panitia/event/[id]/kontrol` (placeholder F3, guard redirect kalau belum siap).
- Branch & tag arsip baru ada di lokal (repo belum punya remote); push setelah remote ditambahkan.

## Sumber kebenaran
- **Figma** `xYZlQ3GjRHHtYcod8rTIZJ`, page DOKSLI SAPI → section "Screen Flow · All Case" → frame
  **All Case Flow · v1** (4665:3650). Layar ukuran penuh & komponen: "Finalise Alfin" (4648:1920),
  frame "Clean v0.5 / Components". (Bisa berubah mengikuti revisi logika.)
- Prioritas tampilan: **All Case Flow v1 > design.md > prd.md**. Aturan bisnis: **prd.md** (sedang direvisi).
- Rencana kerja per phase: `HANDOFF-CLAUDE-CODE.md` (akan disesuaikan dengan prd.md revisi).

## Stack (disetujui 21 Okt 2026)
- Next.js 16 (App Router, TypeScript, `cacheComponents` aktif) — baca `node_modules/next/dist/docs/`
  sebelum memakai API Next; banyak yang berubah dari versi lama.
- CSS biasa + CSS Modules + CSS variables (tanpa Tailwind) supaya nilai piksel Figma bisa persis.
- Font: Switzer variable self-host (`app/fonts/`, Free Font License), JetBrains Mono via `next/font`.
- Ikon: `@phosphor-icons/react`. Tes: Vitest. Format: Prettier (printWidth 100). Lint: ESLint (config Next).
- Rencana hosting: Vercel Hobby (gratis). Data (keputusan 22 Okt): store lokal in-memory +
  `.data/store.json` (di-gitignore) lewat `lib/data`; nanti diganti Supabase free di balik interface
  `DataStore` yang sama sebelum deploy (file JSON tidak persisten di Vercel).
- QR tiket: `qrcode` (MIT), SVG dirender di server.

## Struktur (main)
```
app/
  layout.tsx · page.tsx   root layout (font, noindex) · beranda sementara
  (tamu)/t/[token]/       T01/T01e/T02b/T03/T03h · konfirmasi/ (T02/T02c/T02d) · kalender/ (.ics)
  panitia/                P01 + PE01/PE02 · actions.ts (semua server action panitia)
    event/[id]/           PE03/PE03b (+ sheet PE03e/PE03h) · rundown/ (PE04k/PE04/PE04a) ·
                          tamu/ (P04k/P04a/P04c/P04/P04b/d/e/f) · kontrol/ (placeholder F3)
  api/live/               SSE: kirim `rev` store tiap ada perubahan (tanpa data tamu)
  dev/ui/                 preview design system (light & dark)
  dev/states/f1/          27 layar F1 dengan data contoh + alat uji (link tamu, CSV dummy, reset)
  tokens.css · globals.css · fonts/
components/ui/            komponen design system Clean v0.5
components/f1/            layar F1 presentasional (dipakai route asli & /dev/states/f1)
components/               LiveRefresh (SSE → router.refresh) · TicketQr · RegisterOffline (SW)
components/icons.ts       ekspor ikon Phosphor (/ssr)
lib/data/                 tipe, store (logika murni + tes), seed, getStore() (file .data/)
lib/server/               env, HMAC (QR & cookie sesi), rate-limit PIN, akses crew/tamu, origin
lib/                      csv · format · invite · confirm · ics · view · fixtures · clipboard · cx
public/                   figma/ · sw.js (tiket offline) · contoh-tamu.csv · dev/*.csv (dummy)
next.config.ts            header X-Robots-Tag noindex, allowedDevOrigins (HP di LAN)
```

## Aturan F1 di kode
- Link tamu `/t/{token}`: token acak 22 karakter base64url, disimpan per tamu. `?dari=wa` → T03h.
  Sudah hadir → T03; nggak bisa → T02b; token salah / event lewat 30 hari → T01e.
- Panitia: PIN 6 digit `EVENT_PIN` (server), 5× salah → kunci 5 menit per IP, cookie httpOnly 24 jam.
- CSV sekali per event (`csvImportedAt`); baris error dibuang, diperbaiki lewat Tambah tamu.
- ✈ salin template + buka `ig.me/m/{ig}`; balik ke tab (visibilitychange/focus) → Diundang + toast
  Batalkan 5 dtk. Kirim WA → `wa.me` + link `?dari=wa`; "Kirim ke semua" lanjut otomatis saat balik
  (kalau browser memblokir jendela baru, tombol bawah jadi "Lanjut kirim").
- Realtime: tiap perubahan store menaikkan `rev` → `/api/live` (SSE) → `router.refresh()`.
- Layar di `components/f1/` tidak memanggil server sendiri: aksi masuk lewat props (kosong = pratinjau).

## Design system (Clean v0.5)
- Token: `app/tokens.css` — warna semantik light (utama) + dark (`prefers-color-scheme`, atau paksa
  dengan `data-theme="light|dark"` di `html` atau elemen mana pun), radius, spacing, shadow, motion,
  kelas tipografi `t-*` (Clean/* dari Figma; tracking Figma dalam persen → `em`).
- Komponen: `components/ui/*` (satu `.tsx` + `.module.css`), ekspor lewat `@/components/ui`.
  Button, IconButton, PinPad (P01), Countdown (T03), NumberedRow (T01/PE04), Dropzone (P04k),
  Toggle, Segmented, Badge, Pill/Chip/AddChip,
  Card/CardLabel/InnerBox, StatTile, ListRow/Avatar, Banner/TextAction, HeroState, Field, Toast
  (undo ring), Sheet (bawah / `floating`), TabBar, Ticket (+`torn`)/TicketStub, LogoMark,
  Screen/ScreenHeader/Skeleton, SearchField.
- **Button** (`Clean/Button` 4587:316, 12 varian): `size` `lg` (54, lebar penuh) | `sm` (36, lebar
  hug, area tap 44) × `variant` `primary` | `secondary` | `destructive` × `iconOnly` (+ `label` wajib
  untuk aria-label). Aturan pakai:
  - `lg` = CTA di bawah layar & tombol di sheet. `sm` = aksi di header, kartu, baris list
    (Keluar, Edit, Buka, Unggah CSV, Tambah, Kirim WA…).
  - `destructive` = aksi hapus (Hapus sesi, Hapus tamu, hapus foto icon-only).
  - `sm iconOnly` untuk tombol ikon di baris: ✎ `PencilSimple` secondary, ✈ `PaperPlaneTilt`
    primary, ↻ secondary.
  - Jangan override fill/stroke/efek/warna/radius lewat `className` atau `style`; ubah lewat
    `size`/`variant`, lebar boleh diatur. Ikon selalu ikut warna label (CSS memaksa `currentColor`).
  - Disabled sementara opacity 0,35 + `aria-disabled` (Figma belum punya State=Disabled; T02c, PE03).
- `IconButton` = khusus tombol back/close 44 di toolbar (gaya secondary, varian `glass` di kamera).
- `Screen`: `withBack` (konten mulai 8px), `bottom` + `bottomHeight` (1 tombol 54, 2 tombol 118,
  +caption 28) → fade scroll-edge otomatis di atas aksi bawah.
- Catatan: `TabBar` masih menautkan ke `/panitia/*` (rute diarsipkan → 404 kalau diklik);
  `Ticket` tanpa QR asli menampilkan placeholder (generator QR diarsipkan).
- Ikon: hanya lewat `@/components/icons` (ukuran via prop `size`, warna `currentColor`).
- Bentuk yang ikut tema (lekukan, gerigi, tepi sobek tiket) digambar CSS/SVG inline dengan `var(--bg)`.
- Jangan pakai warna hex di komponen; pakai token. Pengecualian tetap di kedua mode:
  Button Primary, tab bar panitia, tombol destruktif, QR.
- Preview semua komponen & tema: `/dev/ui`.

## Cara run
```bash
npm install
npm run dev          # http://localhost:3000 · HP di Wi-Fi sama: http://<IP-laptop>:3000 (baris "Network")
npm test             # vitest
npm run lint && npm run typecheck && npm run format:check
npm run build
```
Butuh `.env.local` (salin `.env.example`): `EVENT_PIN`, `TICKET_HMAC_SECRET`, `SESSION_SECRET`.
Uji alur: `/dev/states/f1` (pratinjau 27 layar + link tamu + CSV dummy + "Reset data ke awal").

## Konvensi
- Copy UI Bahasa Indonesia santai, persis Figma/design.md §7. Jam 24 jam pakai titik (13.00).
- ID layar Figma (T01, BT03, P06b…) dipakai di nama komponen/route/komentar supaya mudah dilacak.
- Semua halaman `noindex` (metadata + header `X-Robots-Tag`).
- Tidak ada data tamu asli, password, atau secret di kode/chat. Hanya data dummy sampai Test Day.
- Hanya layanan gratis / yang sudah dimiliki studio.
- Commit kecil per fitur. Repo GitHub harus **private** (PRD rahasia sampai Test Day).

## Status phase
- [x] Phase 0 — fondasi (scaffold, font, noindex) — sisa yang relevan tetap di main
- [x] Phase 1 — design system (`/dev/ui`)
- [x] F1 — undangan & konfirmasi (27 layar, store lokal, realtime SSE) — menunggu review
- [ ] F2–F5, N1–N4 — berikutnya (versi lama: tag `archive-pre-revisi`)
