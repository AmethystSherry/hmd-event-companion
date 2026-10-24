@AGENTS.md

# HMD Event Companion · Konsep B "Satu Layar, Dua Mode"

Web app mobile untuk House Moving Day Potara Studio (Minggu 8 Nov 2026, 13.00–17.00, ±20 tamu).

## Status (22 Okt 2026)
- Logika direvisi (prd.md v0.2). Kode lama Phase 0–5 diarsipkan di branch **`archive/pre-revisi`** /
  tag **`archive-pre-revisi`** (commit `db60e73`) — bukan acuan alur. Ambil ulang hanya kalau diminta
  (`git show archive-pre-revisi:<path>`). Jangan force push / rewrite history / hapus branch.
- **F1 · Undangan & konfirmasi sudah dibangun** (Figma band `4732:12593`, `F1-deliverables.md`,
  prd §7 F1).
- Update 22 Okt sore (Figma `4810:11003/11052/11132/11218`): PE03/PE03b dibangun ulang + sheet
  PE03e Ubah detail event & PE03h Hapus event. "Buka Kontrol acara" aktif kalau detail + tamu +
  rundown terisi → `/panitia/event/[id]/kontrol` (guard redirect kalau belum siap).
- **F2 · Check-in di pintu sudah dibangun** (22 Okt malam; Figma band `4667:4654`,
  `F2-deliverables.md`). 12 keputusan terbuka di deliverables dijawab pakai default — lihat
  "Aturan F2 di kode". F3–F5 & N1–N4 belum; kerjakan lewat `HANDOFF-CLAUDE-CODE.md`.
- **F2 v2 (23 Okt, Prompt E)**: Button primary oranye; BP00 dirombak (carousel kartu sesi +
  stopwatch + Mulai/Selesaikan lewat Dialog BP00a/BP00b, state acara prd §6 di store); layar scan
  tanpa TabBar ("Lihat daftar tamu"); P06 baru; P07 tanpa badge "Belum masuk" + P07d Profil tamu.
  Layar tamu Sesi/Jeda & Foto/Tanya panitia masih placeholder (F3/F4).
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
- Rencana hosting: Vercel Hobby (gratis). Data: lokal = in-memory + `.data/store.json`
  (di-gitignore); kalau `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` diisi (Vercel) = Supabase free:
  seluruh StoreData satu baris JSON `hmd_store` (skema `supabase/schema.sql`, RLS tanpa policy),
  tulis compare-and-swap di `rev`. **Baca pakai `getStore()`, ubah wajib lewat `mutateStore(fn)`**
  (remote: salinan `getStore()` read-only, `fn` bisa diulang saat kalah balapan — jangan ada efek
  samping di luar store). Remote: SSE dijawab 204 → `LiveRefresh` polling `?once=1`; rate-limit
  PIN di tabel `hmd_pin` (`attemptPin`).
- QR tiket: `qrcode` (MIT), SVG dirender di server. Scan QR (F2): `qr-scanner` (MIT) —
  BarcodeDetector di Android Chrome, decoder Web Worker di iPhone Safari.

## Struktur (main)
```
app/
  layout.tsx · page.tsx   root layout (font, noindex) · beranda sementara
  (tamu)/t/[token]/       T01/T01e/T02b/T03/T03h · konfirmasi/ (T02/T02c/T02d) · kalender/ (.ics) ·
                          acara/ (layar Sesi/Jeda, placeholder F3/F4)
  panitia/                P01 + PE01/PE02 · actions.ts (semua server action panitia)
    event/[id]/           PE03/PE03b (+ sheet PE03e/PE03h) · rundown/ (PE04k/PE04/PE04a) ·
                          tamu/ (P04k/P04a/P04c/P04/P04b/d/e/f) · kontrol/ (BP00/BP00a/BP00b) ·
                          foto/ · tanya/ (placeholder F3/F4) ·
                          scan/ (P05/P05b/P06/P06b/P06c) · scan/cari/ (P07/P07b/P07c)
  api/live/               SSE: kirim `rev` store tiap ada perubahan (tanpa data tamu)
  api/panitia/            event/[id]/manifest (GET daftar pintu) · checkin (POST antrean op)
  dev/ui/                 preview design system (light & dark)
  dev/states/f1/          27 layar F1 dengan data contoh + alat uji (link tamu, CSV dummy, reset)
  dev/states/f2/          13 layar F2 + alat uji (jam pura-pura hari-H, data 12 hadir, reset check-in)
  tokens.css · globals.css · fonts/
components/ui/            komponen design system Clean v0.5
components/f1/            layar F1 presentasional (dipakai route asli & /dev/states/f1)
components/f2/            tamu.tsx (T05/T05a/BT02/T03b) · Kontrol (BP00 + dialog) · DoorApp (P05–P07d) ·
                          useDoor (manifest + antrean) · Viewfinder (kamera) · DoorPage (guard route) ·
                          Placeholder (Foto/Tanya)
components/               LiveRefresh (SSE → router.refresh) · RefreshAt · TicketQr · RegisterOffline
components/icons.ts       ekspor ikon Phosphor (/ssr)
lib/data/                 tipe, store (logika murni + tes), seed, getStore() (file .data/)
lib/server/               env, HMAC (QR & cookie sesi), rate-limit PIN, akses crew/tamu, origin,
                          clock (hari-H + jam palsu dev), door (manifest & terapkan op check-in)
lib/                      csv · format · invite · confirm · ics · view · fixtures · clipboard · cx ·
                          door (logika pintu tanpa secret, jalan di HP) · offline/doorDb (IndexedDB) ·
                          rundown (status sesi + stopwatch dari state acara)
public/                   figma/ · sw.js (tiket & layar pintu offline) · contoh-tamu.csv · dev/*.csv
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

## Aturan F2 di kode
Keputusan default 22 Okt (jawaban "Keputusan & asumsi" di F2-deliverables; prd.md §7 F2 belum diubah):
1. Hari-H mulai **00.00 WIB** tanggal event (`lib/server/clock` → `isEventDay`); scan boleh sebelum
   13.00. Tamu T03 → T05, panitia PE03b → BP00 otomatis. Dev: cookie `hmd_now` / env `HMD_FAKE_NOW`
   (diabaikan di production), dipasang dari `/dev/states/f2`.
2. "Kecerahan maks" = QR layar penuh latar putih + Wake Lock (browser nggak bisa atur brightness).
3. Walk-in P07c dibangun: nama wajib, IG opsional, langsung "Udah masuk" (`source: "walkin"`).
4. Pembagi "dari N" = tamu RSVP hadir (walk-in & yang datang ikut jadi hadir saat check-in).
5. RSVP "Nggak bisa"/belum jawab tapi datang → tetap check-in, RSVP jadi hadir (dipulihkan saat Batalkan).
6. Toast Batalkan 5 dtk hanya untuk ✓ manual (bukan scan).
7. P07 cari nama, @IG, **dan kode pendek** (HMD-014-7F3K).
8. PDF daftar manual **di-drop** (nggak ada di band F2); cadangannya P07 yang jalan offline.
9. Validasi offline: manifest (tamu + ticketId + status, tanpa WA/token/secret) diunduh setelah PIN
   → IndexedDB; HP mencocokkan ticketId dari QR `<ticketId>.<sig>`, tanda tangan dicek server saat
   sinkron. (Hash nggak dipakai: `crypto.subtle` nggak ada di http LAN.) Sesi 401 → data dihapus.
10. Valid = getar (Android) + bunyi pendek WebAudio (iPhone juga); gagal = bunyi rendah.
11. Copy ikut Figma sekarang (usulan copy di deliverables belum diterapkan).
12. (v2 23 Okt) Card Pintu masuk dihapus. Stat tile: Check-in → P07, Foto → `foto/`, Pertanyaan →
    `tanya/` (placeholder). BT02 "Masuk sekarang"/auto 3 dtk → `/t/[token]/acara`; "Kembali ke
    acara" di T03b ke sana juga. `checkedInBy` = label HP ("HP 7K2Q"), bukan nama orang.
- **State acara (prd §6)**: `Event.mode/activeSessionId/nextSessionId` + `Session.status/startedAt/
  endedAt` (opsional, store lama tetap terbaca). `startSession` (sesi lain yang jalan ikut selesai)
  dan `finishSession` (mode jeda, berikutnya = sesi sesudahnya yang belum selesai) idempoten:
  dobel tap / dua HP → `false`, `rev` tetap. Server action `startSession`/`finishSession` pakai
  `serverNow()`. Status per sesi & stopwatch diturunkan di `lib/rundown.ts`; stopwatch = jam server
  − `startedAt` (HP cuma memutar detiknya). Sesi yang sudah selesai bisa dimulai lagi (BP00b).
- BP00: carousel scroll-snap dibuka di sesi yang jalan (atau berikutnya); "Scan tiket" = tombol
  bawah, tanpa TabBar. Konfirmasi pakai `Dialog` (tengah layar), bukan Sheet.
- Scan (P05–P06c): back → BP00, tombol bawah "Lihat daftar tamu" → P07, tanpa TabBar. P05b = Toast
  di bawah baris back (ikut alur, nggak nutupin back/judul). Nomor "tamu ke-n dari N" di P06,
  header, dan BT02 dari sumber sama (hasil server + pembagi RSVP hadir setelah check-in ini).
- P07: baris = tombol (→ P07d) + ✓ / Badge "Udah masuk" bersebelahan (bukan tombol bersarang).
  P07d pakai `waMasked` dari manifest (disamarkan di server); "Buka Instagram" → profil IG.
- Check-in = op `{opId, kind: scan|manual|walkin|undo}` dari HP → `POST /api/panitia/checkin`,
  idempoten per opId (kirim ulang aman); yang sampai server duluan menang (HP kedua → P06b).
  Online: hasil server ditunggu ≤ 3 dtk untuk sheet P06; offline: hasil lokal + antre (P05b),
  dikirim ulang tiap 5 dtk / saat `online`. Op dibuang dari antrean setelah manifest baru masuk.
- `/scan` dan `/scan/cari` = satu `DoorApp` (pindah layar pakai `history.pushState`, tanpa
  jaringan). SW meng-cache kerangka halaman itu (network-first, navigasi saja; request RSC dilewati).
- HP tamu: check-in → `rev` naik → SSE → `router.refresh()` → status tiket berubah selagi terbuka
  → T05a (sobek ±900 ms) → BT02 (3 dtk, sekali per tiket via localStorage) → T03b. HP tamu offline →
  refresh saat `online`/tab terlihat lagi. Dibuka > 10 menit setelah masuk → langsung T03b.
- Kamera butuh HTTPS di HP (`npx next dev --experimental-https`); gagal/ditolak → P07b.
- Store dev ada di `globalThis.__hmdStoreF3`: naikkan kuncinya tiap method store bertambah (server
  dev yang sedang jalan nggak membuat ulang instance lama saat HMR).

## Design system (Clean v0.5)
- Token: `app/tokens.css` — warna semantik light (utama) + dark (`prefers-color-scheme`, atau paksa
  dengan `data-theme="light|dark"` di `html` atau elemen mana pun), radius, spacing, shadow, motion,
  kelas tipografi `t-*` (Clean/* dari Figma; tracking Figma dalam persen → `em`).
- Komponen: `components/ui/*` (satu `.tsx` + `.module.css`), ekspor lewat `@/components/ui`.
  Button, IconButton, PinPad (P01), Countdown (T03), NumberedRow (T01/PE04), Dropzone (P04k),
  Toggle, Segmented, Badge, Pill/Chip/AddChip,
  Card/CardLabel/InnerBox, StatTile, ListRow/Avatar, Banner/TextAction, HeroState, Field, Toast
  (undo ring), Sheet (bawah / `floating`), TabBar, Ticket (+`torn`)/TicketStub, LogoMark,
  Screen/ScreenHeader/Skeleton, SearchField, Dialog (konfirmasi tengah layar, BP00a/BP00b).
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
- `TabBar` pakai prop `eventId` → `/panitia/event/{id}/kontrol|tamu|tanya|scan` (Tanya belum ada →
  404); tanpa `eventId` (pratinjau /dev/ui) semua ke `/panitia`. `Ticket` tanpa QR = placeholder.
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
Testing dari luar (sementara, sebelum Vercel): `npm run dev` + `cloudflared tunnel --protocol http2
--url http://localhost:3000` → link `https://….trycloudflare.com` (HTTPS, kamera jalan; ganti tiap
dijalankan ulang; laptop harus nyala). Quick tunnel nggak meneruskan SSE → `LiveRefresh` otomatis
polling `/api/live?once=1` tiap 4 dtk. Jangan kirim undangan tamu asli dari link tunnel.
Uji alur: `/dev/states/f1` (pratinjau 27 layar + link tamu + CSV dummy + "Reset data ke awal").
F2: `/dev/states/f2` → "Siapkan data uji" → "Pura-pura hari-H" → buka link tamu + /panitia → Scan.
Sesi: tombol "Mulai sesi 1" / "Selesaikan sesi" di halaman yang sama, atau lewat BP00.

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
- [x] F2 — check-in di pintu (13 layar, scan QR, antrean offline, tiket sobek realtime) — menunggu review
- [x] F2 v2 (23 Okt) — BP00 kartu sesi + Mulai/Selesaikan, scan/P06/P07/P07d baru — menunggu review
- [ ] F3–F5, N1–N4 — berikutnya (versi lama: tag `archive-pre-revisi`)
