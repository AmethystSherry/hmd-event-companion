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
  "Aturan F2 di kode". F3–F5 & N1–N3 belum; kerjakan lewat `HANDOFF-CLAUDE-CODE.md`.
- **F2 v2 (23 Okt, Prompt E)**: Button primary oranye; BP02 dirombak (carousel kartu sesi +
  stopwatch + Mulai/Selesaikan lewat Dialog BP03/BP01b, state acara prd §6 di store); layar scan
  tanpa TabBar ("Lihat daftar tamu"); P06 baru; P07 tanpa badge "Belum masuk" + P07d Profil tamu.
  Layar tamu Sesi/Jeda & Foto/Tanya panitia masih placeholder (F3/F4).
- **F2 v3 (25 Okt, Prompt F)**: BT02 baru (ilustrasi Pota di pintu + panel, Figma `4961:7021`,
  komponen `IllustratedScreen`); kode layar panitia disatukan dengan F3: BP00 = **BP02**, BP00a =
  **BP03**, BP00b = **BP01b** (label & komentar saja, file `Kontrol.tsx` tetap).
- Repo GitHub private `AmethystSherry/hmd-event-companion` (tag `f2-done`, `archive-pre-revisi`;
  branch `archive/pre-revisi` sengaja tetap lokal).
- **Deploy (24 Okt)**: Vercel Hobby project `hmd-event-companion` (tim alfin100605-9544's projects),
  auto-deploy tiap push ke `main`. Supabase Free `supabase-cinnabar-jacket` (Singapore) lewat
  integrasi Vercel Storage → env `SUPABASE_*` otomatis; tabel dari `supabase/schema.sql` sudah
  dijalankan. Secret (`EVENT_PIN`, `TICKET_HMAC_SECRET`, `SESSION_SECRET`) diisi sendiri oleh
  pemilik di Vercel. Di production jam palsu & alat `/dev/states` mati.
- **N4 · Foto kolase polaroid sudah dibangun** (24 Okt, **v2 25 Okt**: hasil & galeri = sheet di `acara/`; Figma section `4670:4981`,
  `N4-deliverables.md`). Semua keputusan terbuka dijawab pakai default — lihat "Aturan N4 di kode".
  **Belum jalan di Vercel sampai pemilik menjalankan blok bucket `hmd-photos` di
  `supabase/schema.sql`** (SQL Editor). Tombol "Foto buat kolase" sementara di placeholder `acara/`.
- **F5 · Tutup acara & feedback — logika (Prompt B, 24 Okt)**: store + API + Claude + CSV + tes.
  **Layar tamu (Prompt C, 24 Okt)**: BT12 · T14/T14b/T14c/T14d · T15/T15b/T15c/T15d (+T15e share
  sheet HP). **Layar panitia (Prompt D, 24 Okt)**: BP04 + BP04b di `kontrol/`, P11/P11b/P11c/P11d
  di `rekap/`. Semua layar F5 menunggu review.
  12 keputusan F5-deliverables dijawab pakai rekomendasi — lihat "Aturan F5 di kode". Ringkasan
  Claude butuh `ANTHROPIC_API_KEY` di Vercel (tanpa key → P11b).
- **F5 v2 (27 Okt)**: `F5-deliverables.md` v2, K1–K13 = default. **Data (Prompt B) udah**:
  `Session.shortTitle`, `Guest.thanksSentAt` + `markThanksSent`, `lib/thanks.ts`. **Layar tamu
  (Prompt C) udah**: BT12 baru, T14/T14b/T14c sheet, `/buku-tamu` redirect, T15 "Foto saya" + pin
  bingkai. **Panitia (Prompt D) udah**: BP04 kartu "Tutup acara", BP04b Dialog, BP05 Acara selesai,
  P12 tab Makasih. Menunggu review.
- **F1 update 23 + 25 Okt (v5)**: Figma band `4732:12593`, `F1-deliverables.md` v5 — 37 layar.
  Amplop T01a (ilustrasi Pota, segel = tombol) + T01 kartu kertas & Jejak undangan, T02 Pekerjaan/
  Minat, T02b titip ucapan, T03k sheet kalender, P04i IG perlu dicek, P04g/h hint filter, swipe hapus
  P04s/PE04s + 🗑 di judul sheet (Batalkan 5 dtk), P04b Kirim WA per tamu, satu badge per baris,
  PE04a/PE04b field sesi. Lihat "Aturan F1 di kode". Menunggu review.
- **F1 update 26 Okt (v5.1)**: T01 tanpa Jejak undangan + grid kartu "bagian acara"; T01a teks di
  atas & ilustrasi/segel turun; header PE01/PE01a/PE02 "Daftar event" + "{n} event". Menunggu review.
- **F3 + F4 · Selama acara (25 Okt)**: Figma band `4668:4730`, full-size C18 `4899:12734`,
  `F3-F4-deliverables.md` v2. Layar tamu `acara/` dibangun (BT20/21/23/24 · BT03 · sheet BT22/BT21p/
  BT04/BT05 · S01); Kontrol acara dapat BP01 jeda, BP02c, pengingat lewat jam mulai, BP02d. Keputusan
  1–12 pakai default kecuali K3/K8/K10 (lihat "Aturan F3 + F4 di kode"). Menunggu review.
- **N1 · Pertanyaan talkshow (25 Okt)**: Figma section `4669:4888`, `N1-deliverables.md` v1. **Tanpa
  Claude** — P10 daftar mentah, terbaru di atas (PRD §7 N1 soal pengelompokan diabaikan). Sheet Tanya
  BT08/BT09/BT08b di `acara/` (`?sheet=tanya`), P10/P10c di `panitia/event/[id]/tanya`, tile
  Pertanyaan BP02 + BT12 nyala. Lihat "Aturan N1 di kode". Menunggu review.
- **F3 + F4 v3 (26 Okt)**: `F3-F4-deliverables.md` v3, Figma C18 (udah ikut). Jejak acara + kartu
  countdown → **Tiket acara (geser)** `EventTickets`, badge tamu "Sedang berjalan/jeda", header cuma
  badge, BT03s "Bentar lagi mulai", **P13 Foto masuk** (hapus oleh panitia, unduh ZIP). K13–K21 =
  default. Lihat "Aturan F3 + F4 di kode" v3. Menunggu review.
- **N3 · Kenalan antartamu (26 Okt)**: Figma section `4670:4888`, `N3-deliverables.md` v1. Satu sumber kartu
  (`cardOf`, lib/card): `Guest.card` atau turunan isian T02. Sheet T11/T11e di `acara/` (`?sheet=kartu`,
  `/kartu` = redirect), toast gelap T11s, BT05b empty state, `POST /api/t/[token]/kartu`. Lihat "Aturan N3
  di kode". Menunggu review.

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
  layout.tsx · page.tsx   root layout (font, noindex) · `/` → redirect /panitia (P01 PIN)
  (tamu)/t/[token]/       T01a/T01/T01e/T02b/T03/T03k/T03h · konfirmasi/ (T02/T02c/T02d) · kalender/ (.ics) ·
                          acara/ (F4 Sesi/Jeda + sheet) · foto/ (N4 BT06–BT07c) ·
                          selesai/ (F5 BT12) · buku-tamu/ (T14*) · kolase/ (T15*, T14d) ·
                          galeri/ (→ acara?sheet=galeri) · tanya/ (→ acara?sheet=tanya) ·
                          kartu/ (→ acara?sheet=kartu, N3)
  panitia/                P01 + PE01/PE02 · actions.ts (semua server action panitia)
    event/[id]/           PE03/PE03b (+ sheet PE03e/PE03h) · rundown/ (PE04k/PE04/PE04a/PE04b/
                          PE04s) · tamu/ (P04k/P04a/P04c/P04i/P04/P04b/d/e/f/g/h/s) · kontrol/ (BP02/BP03/BP01b +
                          F5 BP04/BP04b) · rekap/ (F5 P11/P11b/P11c/P11d) ·
                          foto/ (F3 v3 P13 Foto masuk) · tanya/ (N1 P10/P10c) ·
                          scan/ (P05/P05b/P06/P06b/P06c) · scan/cari/ (P07/P07b/P07c)
  api/live/               SSE: kirim `rev` store tiap ada perubahan (tanpa data tamu)
  api/panitia/            event/[id]/manifest (GET daftar pintu) · checkin (POST antrean op) ·
                          foto/[id] (GET gambar / DELETE hapus P13, sesi PIN) · event/[id]/rekap.csv (GET, F5) ·
                          event/[id]/ringkasan (POST ringkasan Claude, F5)
  api/t/[token]/foto/     POST upload foto (N4) · [id] GET gambar / DELETE foto sendiri
  api/t/[token]/buku-tamu POST isian buku tamu (F5 · T14)
  api/t/[token]/tanya     POST pertanyaan talkshow (N1 · BT08)
  api/t/[token]/kartu     POST kartu kenalan (N3 · T11)
  dev/                    daftar alat dev (dulu beranda `/`): link design system + semua /dev/states
  dev/ui/                 preview design system (light & dark)
  dev/states/f1/          37 layar F1 dengan data contoh + alat uji (link tamu, CSV dummy, reset)
  dev/states/f2/          17 layar F2 (BP02/BP02-pre/BP03/BP01b …) + alat uji (jam pura-pura hari-H,
                          data 12 hadir, reset check-in, mulai/selesaikan sesi)
  dev/states/n4/          11 layar N4 v3 (BT03 + kamera + sheet) + alat uji (check-in semua, 30 foto dummy, hapus semua foto)
  dev/states/f4/          20 layar F3+F4 (tamu + panitia) + alat uji (jam 13.48/14.03, mulai/selesai sesi
                          sebagai "HP LAIN" → BP02d, isi kartu BT05)
  dev/states/n1/          8 layar N1 (BT21/BT08/BT09/BT08b/BP02/P10/P10c + link BT21p) + alat uji (mulai
                          Talkshow, 23 pertanyaan dummy, hapus semua, simulasi gagal kirim)
  dev/states/n3/          8 layar N3 (BT03/BT05/BT05b/BT05c/T11/T11e/T11s/T11f) + alat uji (kartu dummy, kosongkan
                          kartu Rara, cuma 2 yang datang, reset kartu)
  dev/states/f5/          17 layar F5 (tamu + panitia) + alat uji (foto dummy, selesaikan semua sesi, tutup/buka
                          lagi, 15 feedback dummy, ringkasan sekarang, reset feedback, loncat ke 8 Des,
                          link tamu udah/belum masuk)
  tokens.css · globals.css · fonts/
components/ui/            komponen design system Clean v0.5
components/f1/            layar F1 presentasional (dipakai route asli & /dev/states/f1) · Envelope
                          (InviteGate + T01a) · TamuActions (T02b ucapan,
                          T03k sheet kalender) · invite.module.css (T01a/T01)
components/f2/            tamu.tsx (T05/T05a/BT02/T03b) · Kontrol (BP02 + dialog) · DoorApp (P05–P07d) ·
                          useDoor (manifest + antrean) · Viewfinder (kamera) · DoorPage (guard route) ·
                          Placeholder (Foto/Tanya)
components/n4/            KolaseApp (kamera BT06/BT06b) · useCamera · capture (crop+kompres) ·
                          usePhotoOutbox (kirim + antrean) · NempelSheet (BT07/b/c/e) · GaleriSheet (BT07d)
components/n1/            TanyaSheet (BT08/BT09/BT08b) · Pertanyaan (P10/P10c)
components/n3/            KartuSheet (T11/T11e + gagal simpan) · InterestChips (chip minat + tambah di tempat)
components/f3/            FotoMasuk (P13: masonry bingkai, filter sesi, hapus + Dialog, unduh ZIP)
components/f4/            AcaraScreen (BT20–24/BT03/S01, sheet lewat ?sheet=) · Sheets (BT22/BT21p/BT04/BT05) ·
components/f5/            Selesai (BT12 v2 + belum masuk, sheet T14) · BukuTamu (BukuTamuSheet T14/b/c) · KolaseKulkas (T15/T15c/
                          T15d/T14d) · FotoDetail (T15b) · kolaseCanvas (gambar 9:16) · saveImage ·
                          Rekap (P11/P11b/P11c/P11d)
components/               LiveRefresh (SSE → router.refresh, `pollMs`, `onHealth`) · useServerNow · RefreshAt ·
                          TicketQr · RegisterOffline
components/icons.ts       ekspor ikon Phosphor (/ssr)
lib/data/                 tipe, store (logika murni + tes), seed, sessionInfo (info sesi F4 + lengkapi store
                          lama), getStore() (file .data/)
lib/server/               env, HMAC (QR & cookie sesi), rate-limit PIN, akses crew/tamu, origin,
                          clock (hari-H + jam palsu dev), door (manifest & terapkan op check-in),
                          photos (file foto: Supabase Storage / .data/photos) · photoResponse ·
                          summary (Claude, F5) · feedback (hapus H+30 lazy + buat ringkasan) ·
                          rateLimit (in-memory per kunci, buku tamu & tanya)
lib/                      csv (+ CSV buku tamu) · feedback (aturan buku tamu, tanggal hapus) ·
                          card (N3: cardOf, normalizeCard, splitInterests) ·
                          questions (N1: validasi, talkshowFor, questionsView, nama tampil) ·
                          kolase (masonry, tata letak 9:16, filter, foto → KolasePhoto) ·
                          format · invite (+ rundownTiles) · confirm · ics (+ googleCalendarUrl) ·
                          view (guestStatus, eventCountLabel) · sessionForm (form sesi PE04a/b, sessionForGuest) ·
                          fixtures · clipboard · cx ·
                          door (logika pintu tanpa secret, jalan di HP) · offline/doorDb (IndexedDB) ·
                          rundown (status sesi + stopwatch, lewat jadwal, countdown) · acara (data layar
                          tamu F4 + BT05) · device (label HP panitia) · photo (crop, batas,
                          kemiringan, URL foto) · offline/photoDb (antrean foto IndexedDB)
public/                   figma/ (+ t01a/t01 ilustrasi @2x/@3x) · sw.js · template-tamu-hmd.csv · dev/*.csv
next.config.ts            header X-Robots-Tag noindex, allowedDevOrigins (HP di LAN)
```

## Aturan F1 di kode
- Link tamu `/t/{token}`: token acak 22 karakter base64url, disimpan per tamu. `?dari=wa` → T03h.
  Sudah hadir → T03; nggak bisa → T02b; token salah / event lewat 30 hari → T01e.
- Panitia: PIN 6 digit `EVENT_PIN` (server), 5× salah → kunci 5 menit per IP, cookie httpOnly 24 jam.
- **T01a amplop** (`InviteGate`, `components/f1/Envelope`): cuma kunjungan pertama per token
  (localStorage `hmd_env_open_{token}`), tamu yang belum jawab. Segel di ilustrasi (tombol transparan
  posisi persen di atas segel lilin) **dan** "Buka undangan" (primary) sama-sama buka T01: segel
  mengecil 150 ms → amplop pudar + T01 naik 24px 400 ms; reduced motion = fade 200 ms. Ilustrasi
  `public/figma/t01a-invitation-closed(@3x).webp` & `t01-invitation-opened(@3x).webp` (crop tengah
  dari Figma, ≤ 85 KB). Ilustrasi punya latar sendiri (nggak ikut dark mode), dipudarkan ke `--bg`.
  v5.1: teks di atas (absolute y128), ilustrasi mulai y164; segel = 370/640 dari atas ilustrasi
  (y534), chip 470/640 (y634), persen dari kotak ilustrasi. Lebar ilustrasi dibatasi tinggi layar
  (`(100dvh − 308px) × 0,83`, = 100% di 390×844) dan HP ≤ 740 tinggi teks/ilustrasi naik, supaya
  segel & chip nggak ketutup tombol (375×667).
- **T01** (v5.1): kartu kertas y368 (menimpa ilustrasi 46px; garis putus accent 35%, prangko rotate
  6° "No. {keyNo}"), info 3 kolom (`<dl>`), lalu "{n} bagian acara" + **grid 2 kolom** kartu sesi
  (`rundownTiles`: semua sesi urut jam, nomor 2 digit, jam, nama lengkap ellipsis 2 baris, tanpa
  pembicara; `<ol>`, aria "Bagian 2, 14.00, Talkshow"; ganjil = terakhir di kiri). Jejak undangan
  dihapus. Nama panjang 2 baris bikin kartu lebih tinggi dari Figma → di 390×844 halaman scroll
  ±25px, tombol tetap di bawah. Sesi ke HP tamu lewat `sessionForGuest` (tanpa PIC).
- **PE03 Mulai event** (28 Okt): `Event.startedAt` (`eventStarted` di lib/data/eventState: startedAt atau mode
  ≠ pre). Tombol bawah: belum dimulai = "Mulai event" (redup kalau belum 3/3 siap) → Dialog "Mulai event
  sekarang?" → server action `startEvent` (store `startEvent` sekali jalan) → Kontrol acara; udah dimulai =
  "Buka Kontrol acara". Setelah dimulai Edit detail event `aria-disabled` + `updateEvent` ditolak
  (`event-dimulai`). Hari-H redirect PE03 → BP02 cuma kalau udah dimulai. Dev: PE03m, PE03s.
- **PE01/PE01a/PE02** (v5.1): toolbar LogoMark 32 + Badge crew "Panitia" | "Keluar"; baris judul
  "Daftar event" (t-title) + `eventCountLabel` "{n} event" rata baseline. Metadata "Daftar event · Panitia".
- **T02**: Pekerjaan (≤ 40) & Minat (≤ 60) opsional → `Guest.job/interests` (cuma disimpan saat
  Hadir; jawab "Nggak bisa" nggak menghapus), ikut prefill "Ubah jawaban", belum ditampilkan (N3).
- **T02b titip ucapan**: chip cepat mengisi field, ≤ 140 huruf, `sendFarewell` → `Guest.farewellMessage/
  farewellAt`, sekali kirim (store `setFarewell` → false kalau udah ada). Setelah terkirim field
  read-only + "Ucapanmu udah terkirim. Makasih!" (copy bukan Figma); gagal → Banner, isian tetap.
  Belum ditampilkan di mana pun. Hapus H+30 ikut menghapus ucapan, pekerjaan, minat.
- **T03/T03h → T03k**: "Simpan ke kalender" buka Sheet: Google Calendar (`googleCalendarUrl`, jam UTC,
  link tiket) + "Kalender HP" (.ics, `VALARM -PT1H`).
- CSV sekali per event (`csvImportedAt`); unggah ulang boleh selama belum disimpan. Baris error (P04c)
  dan masalah username IG (P04i: IG kosong / ada spasi / URL, dengan saran) **dibuang**, ikut Figma
  "Simpan 20 tamu dulu" → ditambah manual nanti. `template-tamu-hmd.csv` = "Unduh template CSV".
- **Status baris tamu** `guestStatus(guest, now)` (lib/view, dihitung di server saat render): Hadir ·
  Nggak bisa · Diundang barusan (< 10 menit) · Belum jawab · Belum diundang — satu Badge per baris,
  angka chip filter dari fungsi yang sama (Belum jawab termasuk Diundang barusan). P04g/P04h: hint
  di atas daftar. Template DM tampil di filter Semua saja.
- **Hapus tamu/sesi** (🗑 sm destructive iconOnly di kanan judul sheet P04e/PE04a/PE04b, atau swipe
  kiri `SwipeRow` P04s/PE04s): baris langsung hilang + Toast "{nama} dihapus" Batalkan 5 dtk; hapus
  di server baru jalan saat toast habis, hapus berikutnya, `pagehide`, atau layar ditutup (jadi
  Batalkan nggak perlu memulihkan data). Swipe: geser ≥ 44px buka panel 88, satu baris terbuka,
  gerak vertikal = scroll, Delete/Backspace di baris membuka panel.
- ✈ salin template + buka `ig.me/m/{ig}`; balik ke tab (visibilitychange/focus) → Diundang + toast
  Batalkan 5 dtk. **P04b pengingat H-1 manual satu-satu**: "Kirim WA" per baris → `wa.me` + link
  `?dari=wa`; balik ke tab → `reminderSentAt` → Badge "Terkirim" (tanpa kirim massal / kirim ulang).
- **Sesi PE04a/PE04b** (`lib/sessionForm`): Nama · Jam + Durasi · Ruang · Tipe · Talkshow: Topik,
  Pembicara, IG pembicara (`speaker {name, ig, label}`, label lama tetap / "Guest star") · Info: hint
  "nggak ada kolom Tanya" · Deskripsi (≤ 140) · PIC. Ganti tipe cuma menyembunyikan; simpan sebagai
  Info → topik & pembicara null. Tombol sheet sticky. Seed sesi tetap dari F4 (`sessionInfo`).
- Kode Figma **BP02 = BP00** di kode (keputusan 24 Okt), belum di-rename.
- Realtime: tiap perubahan store menaikkan `rev` → `/api/live` (SSE) → `router.refresh()`.
- Layar di `components/f1/` tidak memanggil server sendiri: aksi masuk lewat props (kosong = pratinjau).

## Aturan F2 di kode
Keputusan default 22 Okt (jawaban "Keputusan & asumsi" di F2-deliverables; prd.md §7 F2 belum diubah):
1. Hari-H mulai **00.00 WIB** tanggal event (`lib/server/clock` → `isEventDay`); scan boleh sebelum
   13.00. Tamu T03 → T05, panitia PE03b → BP02 otomatis. (27 Okt) **Scan tiket & P07 dibuka sejak
   Kontrol acara bisa dibuka, nggak nunggu hari-H** (tamu datang lebih awal). Mulai/Selesaikan sesi &
   Tutup acara juga aktif kapan aja (manual panitia; jam sesi cuma display). **Urut rundown**: Mulai
   cuma di kartu "Berikutnya" & selagi nggak ada sesi jalan (lainnya redup); server action
   `startSession` juga menolak (no-op) sesi lain → nggak bisa lompat / mulai ulang sesi selesai.
   Tiket `dipakai` sebelum hari-H → tamu langsung ke T05/BT02. Dev: cookie `hmd_now` / env `HMD_FAKE_NOW`
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
  − `startedAt` (HP cuma memutar detiknya). Sesi yang sudah selesai bisa dimulai lagi (BP01b).
- BP02 (28 Okt): Rundown = timeline ke bawah tanpa progress bar, tap baris → Sheet detail sesi (baca saja). Tile Check-in → P07 `?status=udah&dari=kontrol` (filter Udah masuk, back ke BP02).
- BP02: carousel scroll-snap dibuka di sesi yang jalan (atau berikutnya); "Scan tiket" = tombol
  bawah, tanpa TabBar. Konfirmasi pakai `Dialog` (tengah layar), bukan Sheet.
- **F2 v4 (26 Okt)**: Badge kartu sesi dari `SESSION_CARD_BADGE` (lib/rundown): Live "**Sedang
  berjalan**" · Selesai · Berikutnya · Belum mulai. Teks rundown ("Sesi {n} lagi jalan", "Lagi jalan ·
  MM:SS") tetap "lagi jalan" (Figma). Layar tamu ikut "Sedang …" sejak F3 v3 (K15). Tile Foto → P13.
- Scan (P05–P06c): back → BP02, tombol bawah "Lihat daftar tamu" → P07, tanpa TabBar. P05b = Toast
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
- **BT02 v3** (Figma `4961:7021`): `IllustratedScreen` dengan `/figma/bt02-welcome-at-door.webp`
  (raw layer `4961:7022`, 1179×1650, webp 86, 55 KB; `object-fit: cover` di kotak ±390×584) + panel:
  eyebrow "Masuk {jam} · tamu ke-n dari N" (stamp kosong → "Udah masuk"), judul `t-title`, Pill
  "Kunci #014" (Key) + Pill "Sudah masuk" (Check, copy Figma), "Masuk sekarang", caption 12
  `aria-live`. Tanpa Ticket/cap (sobek cuma di T05a). Ilustrasi di-`preload()` (react-dom) sejak T05.
- (28 Okt) `Ticket`: QR di kepala tiket (ganti ikon kunci) selama belum sobek; potongan bawah cuma kode +
  "Tunjukkan ke panitia di pintu". Tamu yang baru masuk (< 10 mnt) selalu mulai dari sobek T05a, juga
  kalau discan sebelum hari-H (halaman pindah dari T03); dibuka ulang setelah BT02 → langsung T03b.
  T01: "@potarastudio" di caption bawah = link profil IG.
  (28 Okt) + baris follow di akhir kartu T01 (`inv.follow`, accent-soft, logo IG + "Follow @potarastudio" +
  Button sm "Follow" → profil IG, tab baru). T02 toggle follow: "Syarat hadir · Buka profil IG" (link, tab baru).
- Kamera butuh HTTPS di HP (`npx next dev --experimental-https`); gagal/ditolak → P07b.
- Store dev ada di `globalThis.__hmdStoreStart`: naikkan kuncinya tiap method store bertambah (server
  dev yang sedang jalan nggak membuat ulang instance lama saat HMR). Server dev yang sudah jalan
  bisa tetap memakai modul server lama (mis. `store.getPhoto is not a function`) → restart `npm run dev`.

## Aturan N4 di kode
Keputusan default 24 Okt (jawaban "Keputusan & asumsi" + "Temuan" di N4-deliverables), direvisi v2 25 Okt
(Figma N4 `4670:4981` versi 25 Okt, N4-deliverables v2 — hasil foto & galeri jadi sheet di `acara/`):
1. Hanya tamu yang **udah check-in**; acara `closed` → `/foto` dialihkan ke `acara/`, upload ditolak
   (tetap, keputusan F5). Hapus foto sendiri **tetap boleh setelah ditutup** sampai data dihapus H+30.
2. Kamera default **depan**, preview di-mirror (CSS), hasil **tidak** mirror. Ganti kamera = tombol
   kanan. Senter cuma kalau `track.getCapabilities().torch` ada; tombol Lightning disembunyikan
   kalau kamera belum jalan (BT06b).
3. Disimpan = foto mentah crop tengah **5:6**; bingkai polaroid digambar UI (`Polaroid`).
4. Kompres di HP (`components/n4/capture.ts`): sisi panjang 1280, JPEG kualitas 0,85 → 0,5, lalu
   diperkecil ×0,85 sampai ≤ 400 KB; thumbnail 320 ≤ 40 KB. Server menolak > 480/80 KB & non-JPEG.
5. **Maks 20 foto per tamu** (`MAX_PHOTOS_PER_GUEST`, foto yang dihapus nggak dihitung).
6. Strip BT07 = 4 foto **tamu lain** terbaru (teaser, boleh); "+N" = foto tamu lain − 4, tap → toast
   BT07c "Kolase lengkap kebuka pas acara selesai (± {endsAt})" (ikut alur sheet di atas tombol).
   0 foto tamu lain → **BT07e** "Kamu yang pertama!" + strip = fotomu sendiri (maks 4), tanpa "+N".
7. Webview IG/FB (`isInAppBrowser`), tanpa getUserMedia/HTTPS, atau kamera error → jalur cadangan
   `<input type="file" accept="image/*" capture="user">` + teks "Buka di Safari/Chrome…". BT06b
   punya 2 tombol lg: primary "Coba lagi" + secondary "Pakai kamera HP" (input file), toolbar cuma X.
8. Copy ikut Figma v2 ("Jepret sekali, langsung nempel di kulkas bareng.", "kebuka"). Sheet hasil:
   primary "Foto lagi" → `/foto` (antre: "Coba kirim sekarang") + secondary "**Selesai**" = tutup sheet,
   tetap di home (Sesi/Jeda ikut mode). Judul sheet `t-card-title`.
9. Thumbnail kiri di bar kamera = foto terakhirmu → `/acara?sheet=foto&id=…`; belum ada → disembunyikan.
10. File di Supabase Storage bucket privat `hmd-photos` (`{eventId}/{id}.jpg` + `_t.jpg`), lokal
    `.data/photos/`. Metadata `Photo` di store (`photos?`). HP baca lewat **route proxy** yang cek
    token tamu (event sama) / sesi PIN; `Cache-Control: private, immutable` + SW cache-first.
11. Upload `POST /api/t/[token]/foto` (multipart, route handler — bukan server action, batas 1 MB).
    Urutan: file dulu (upsert), baru `mutateStore(addPhoto)`. Idempoten per id = UUID dari HP
    (`newPhotoId`, jalan juga di http LAN). `sessionId` = sesi yang jalan / terakhir selesai.
12. `/foto` = kamera saja (BT06/BT06b). Jepret → antrean IndexedDB **dulu** → kirim, tunggu ≤ 5 dtk
    (shutter loading) → kamera dimatikan → `router.replace(/acara?sheet=foto&id=…)`. Ditolak (4xx) →
    toast, tetap di kamera. Status sheet (`nempelStatus`): id ada di data server (`GuestPhotos.mine`) =
    terkirim (BT07/BT07e), masih di antrean HP = antre (BT07b, gambar dari Blob), nggak ada di
    keduanya = sheet nggak dibuka. Antrean dikirim dari `AcaraScreen` (`usePhotoOutbox`, tiap 5 dtk &
    `online`); terkirim → `router.refresh()` → sheet BT07b berubah ke BT07 sendiri.
- **Sheet N4 di `acara/`** (`components/n4/NempelSheet`, `GaleriSheet`): `?sheet=foto&id=` / `?sheet=galeri`,
  pola pushState F4 (back HP/Esc/backdrop menutup; dari kamera = `replace`, jadi back keluar ke home).
  `Sheet strong` = backdrop 45%. Data dari server `toGuestPhotos` (lib/photo): nama depan, `endsAt`,
  fotoku (id + jam), jumlah & 4 foto tamu lain. `/galeri` lama dialihkan ke `/acara?sheet=galeri`.
- **Polaroid** prop `magnet` (bulatan oranye CSS, bukan aset), `status` sent|queued (badge 30 pojok
  kanan atas, border 3px `--card`), ukuran `lg` (kamera) · `sheet` (foto 150×170) · `grid` (152×170),
  `caption` & slot `action`. Miring tetap `photoTilt` (±4°); galeri berganti +2°/−2°/+1,5°/−1,5°.
- **BT07d Galeri**: `Segmented` "Foto saya · {n}" / 🔒 "Foto tamu" (opsi `locked` + `onLocked` → toast
  BT07c). Grid 2 kolom fotoku terbaru dulu (foto antre ikut, badge ⌛, tanpa hapus); caption "{nama} ·
  {jam}" + Trash 16 (area tap 44). Tile "Foto lagi" (dashed accent) disembunyikan di 20 foto → "Maks 20
  foto". Kosong → tile + "Belum ada foto. Jepret yang pertama!" (TODO copy). Tap polaroid = belum ada (TODO).
- **BT07dh hapus (v3 26 Okt)**: foto sendiri bisa dihapus **kapan aja** (server tetap: sampai H+30). 🗑 →
  **tanpa Dialog**: foto disembunyikan di HP (nggak dihitung di "Foto saya · n" & batas 20) + `Toast undo`
  5 dtk (Trash + "Foto dihapus dari kolase" + "Batalkan", dock lebar penuh − 20, radius 12). Batalkan →
  foto balik, tanpa request. `DELETE` baru dikirim saat toast habis, saat foto lain dihapus (yang sebelumnya
  langsung final, toast diganti), atau saat sheet Galeri ditutup (`keepalive`). Tab ditutup < 5 dtk = nggak
  jadi kehapus. Gagal → foto balik + toast "Gagal hapus, coba lagi". Berhasil → `router.refresh()`; HP lain
  & tile Foto panitia lewat `rev`. T15b (F5) tetap pakai Dialog.
- Badge home "Sedang jeda" / "Sedang berjalan" (F3 v3, K15).
- (28 Okt) **Pratinjau setelah jepret**: foto nggak langsung dikirim — tampil di polaroid + "Tempel ke kulkas"
  (antre + kirim seperti no. 12) / "Ulangi" / "Simpan" (`saveFile`, ke HP tanpa ngirim). Dev BT06r.
  Antrean: tiap kirim dari pengurasan dibatasi 30 dtk (fetch nggantung nggak mengunci antrean); 5xx =
  `offline` + `server`. iPhone (WebKit): antrean IndexedDB disimpan sebagai ArrayBuffer, dibungkus Blob baru saat
  dibaca (Blob dari IndexedDB gagal dikirim fetch); kiriman pertama nggak di-abort di 5 dtk (cuma layar pindah).
  Galeri BT07d: Banner "{n} foto belum terkirim" + "Kirim sekarang" (dev BT07d-antre).
13. Hapus foto sendiri: `DELETE /api/t/[token]/foto/[id]` (soft delete `deletedAt` + file dihapus),
    UI di F5 (T15b). Hapus otomatis H+30: lihat "Aturan F5 di kode".
14. Tile "Foto" BP02 = `photoCount` (realtime lewat `rev`).

## Aturan F5 di kode
Keputusan 24 Okt (rekomendasi atas "Keputusan & asumsi" + "Temuan" di F5-deliverables, disetujui):
1. **Tutup acara** `closeEvent` → `mode: closed` + `closedAt`, sekali jalan (dobel tap / dua HP →
   `false`, rev tetap). Boleh kalau **nggak ada sesi yang jalan & sesi terakhir selesai** (sesi yang
   dilewati nggak menghalangi), selain itu `sesi-belum-selesai`. Setelah ditutup `startSession`/
   `finishSession` → `acara-ditutup`. `reopenEvent` dev saja. Server action `closeEvent`.
2. Upload foto setelah ditutup **tetap ditolak**; CTA T15d diganti secondary "Kembali" (Prompt C).
   Hapus foto sendiri boleh sampai H+30 (aturan N4 no. 1 direvisi).
3. Pembagi "dari N" di BT12/BP04b/P11 = tamu **udah check-in** (`feedbackRecap.expected`).
4. "Mau diundang lagi?" **nggak terpilih dari awal** (opsional); % dihitung dari yang menjawab.
5. (v2) BP04 = satu kartu "Tutup acara" pengganti carousel, tanpa TabBar. BP04b = **Dialog** (K8).
   Setelah ditutup → BP05 Acara selesai (lihat no. 18).
6. Buku tamu cuma tamu udah check-in & acara closed; **1 isian per tamu, nggak bisa diubah**.
   `POST /api/t/[token]/buku-tamu` (JSON `clientId` UUID, rating 1–5 wajib, `highlightSessionId`,
   `improve` ≤ 280, `inviteAgain` boolean|null). Idempoten per clientId; id lain → `sudah-isi`
   (respons `{ok:true,status:"sudah-isi"}` → T14d). Rate-limit 10/menit per tamu (per instance).
7. Link WA terima kasih **di luar F5** — tamu pakai link `/t/[token]` yang sama.
8. T15: IconButton unduh di header dihapus; TextAction "Follow @potarastudio". T14b/T14c ada back.
   Tile "pertanyaan" BT12 nyala sejak N1 (semua pertanyaan event). Kolase 9:16 = JPEG 0,9 `kolase-hmd.jpg`, maks 12 foto.
9. **Rekap** `feedbackRecap`: rata-rata 1 desimal, paling seru semua sesi urut terbanyak (seri =
   urutan rundown), jawaban "perbaiki" bernomor urut jawaban ("Tamu #04"), tanpa nama.
10. **Ringkasan Claude** (`lib/server/summary.ts`): server saja, `ANTHROPIC_API_KEY` (+
    `ANTHROPIC_MODEL`, default `claude-haiku-5-5`, effort low, structured output JSON), timeout 15
    dtk tanpa retry. Input tanpa nama/IG (rating, judul sesi, teks perbaikan, mau diundang); teks
    tamu ditandai sebagai data. Output tepat 3 poin ≤ 90 huruf (dipotong "…"). Cache di
    `Event.summary` (`basedOn`, `pendingSince` 30 dtk cegah dobel). Dibuat kalau ≥ 3 jawaban dan
    (belum ada / ≥ 3 jawaban baru / "Coba lagi"). Gagal → poin lama tetap + `error` (P11b), nggak
    diulang otomatis. Alur `refreshSummary`: `beginSummary` (mutateStore) → Claude di luar store →
    `saveSummary`. P11 tampil dari cache, HP panitia memanggil `POST …/ringkasan` (`{force}`).
11. **CSV** `GET /api/panitia/event/[id]/rekap.csv` (sesi PIN): `nama, ig, rating, paling_seru,
    perbaikan, mau_diundang, waktu_isi`, UTF-8 BOM + CRLF, sel diawali `= + - @` diberi `'`
    (ig tanpa "@"). Setelah H+30 → 410.
12. **Hapus H+30** (`purgeAt` = tanggal event + 30 hari 00.00 WIB = 8 Des 2026): lazy lewat
    `ensurePurged` (link tamu `/t/[token]`, Kontrol acara, API buku tamu/CSV/ringkasan; jam
    `serverNow`, jadi bisa diuji dengan `hmd_now`). Arsip rekap tanpa jawaban per tamu disimpan di
    `Event.recapArchive`, lalu isian per tamu & metadata foto dihapus (file foto dihapus sesudahnya),
    nama/IG/WA tamu jadi "Tamu #nn" + token baru (link lama → T01e). Idempoten. Cron = Phase 8.
13. **Routing tamu**: acara `closed` → `/t/[token]`, `acara/`, `foto/` dialihkan ke `selesai/`
    (BT12; HP yang terbuka pindah sendiri lewat rev → SSE). `selesai/ buku-tamu/ kolase/` pakai
    `closedGuest(token)`: belum ditutup / data dihapus → `/t/[token]`. Belum check-in → `selesai/`
    versi sederhana "Acaranya udah selesai" + Follow @potarastudio (copy bukan dari Figma).
    Udah isi buku tamu → BT12 "Isi buku tamu" & `/buku-tamu` ke `/kolase?isi=1` (T14d, query
    dihapus setelah toast).
14. **T14**: draft + clientId di `localStorage` (`hmd-buku-tamu:{token}`), kirim tunggu ≤ 5 dtk,
    gagal/offline → T14b + kirim ulang saat `online`; rating kosong → tombol `aria-disabled`, tap →
    hint merah + fokus ke bintang (T14c). Opsi "paling seru" = judul sesi rundown apa adanya.
15. **T15**: `Masonry` + `PhotoPin` (thumbnail, rasio asli, kolom terpendek); chip Semua · Fotoku
    (kalau punya foto) · sesi yang punya foto. T15b = overlay scroll-snap (pushState `?foto=`,
    back HP/Esc/X menutup, fokus terkunci), simpan foto (blob disiapkan saat slide aktif), hapus
    foto sendiri → Dialog → `DELETE` → toast. T15d: CTA jadi secondary "Kembali" + copy disesuaikan.
16. **Gambar 9:16** (`components/f5/kolaseCanvas`): canvas 1080×1920, warna token light (elemen
    bantu `data-theme="light"`), font body, maks 12 foto filter aktif (foto full lewat proxy),
    2 kolom (≤ 4) / 3 kolom, JPEG 0,9 `kolase-hmd.jpg`. Dibuat **sebelum** tap (sheet T15c dibuka /
    1,5 dtk setelah T15 tenang) supaya `navigator.share` tetap dalam gesture. Pratinjau T15c =
    gambar hasil itu sendiri. Simpan: iOS → share sheet, Android/desktop → download, webview IG/FB
    → gambar layar penuh (data: URL) + toast "Tekan lama gambarnya buat simpan". Batal share = diam.
17. (v2) **BP04** (`KontrolScreen` prop `finale {canClose, closedAt, endsAt, feedback}` + `close`):
    `canClose` & belum ditutup → carousel diganti **satu kartu**: Badge "{x} dari {n} selesai" + "±
    {endsAt}", `t-title` "Tutup acara", body, "Tutup acara & buka buku tamu" → **Dialog BP04b**
    ("Tutup acara sekarang?", jumlah HP tamu = check-in, "Ya, tutup acara" / "Batal", tombol "Menutup
    acara…" selagi jalan). Sub header "Semua sesi selesai · tamu masih di layar jeda". Rundown
    **bernomor** "Selesai · {n} mnt" (ikon ✓ v1 dihapus), kepala "{x} dari {n} selesai".
18. (v2) **BP05 Acara selesai** (ganti kartu TODO v1): Badge neutral "Acara selesai" (ganti Badge
    Hari-H), sub "Acara ditutup {jam} · tamu lagi isi buku tamu", kartu Badge "Buku tamu kebuka" + jam
    tutup, "{x} dari {n} udah ngisi" (`feedbackRecap`, realtime), "Lihat rekap buku tamu" → `rekap/`,
    secondary "Kirim makasih via WA" → `tamu?tab=makasih`. Tile Check-in · Foto · Pertanyaan. **Tanpa
    Scan tiket.**
19. **P11** (`/panitia/event/[id]/rekap`, sesi PIN, sebelum ditutup = P11c): angka & `BarList` dari
    `feedbackRecap`, realtime lewat `LiveRefresh`. Kartu ringkasan dari `summaryView` (lib/feedback):
    siap · lagi dibuat (skeleton; HP yang melihat ringkasan basi memanggil `POST …/ringkasan`, sekali
    per jumlah jawaban) · gagal (P11b: Banner + "Coba lagi" force, + daftar "Satu hal yang bisa
    diperbaiki" bernomor "Tamu #nn" — daftar cuma di P11b sesuai Figma) · < 3 jawaban ("Ringkasan
    muncul setelah ada 3 jawaban.", copy bukan Figma). P11d: arsip + Banner, CSV nonaktif. Unduh
    CSV = `<form method=get>` ke `rekap.csv` (`rekap-buku-tamu-hmd.csv`); 0 jawaban / dihapus →
    nonaktif. Komponen baru `BarList` (bar teratas Ink).
- **v2 (27 Okt, K1–K13 default) · data**:
  - K1: tutup acara tetap cuma setelah sesi terakhir selesai (BT24 Closing = konteks).
  - K4 `Session.shortTitle?` (seed s04 "Closing"), baca lewat `sessionShort(s)` (lib/data/sessionInfo)
    = label pendek atau `title`. Dipakai bar P11 (`feedbackRecap.highlights.title`) & caption T15/P13
    (`toKolasePhotos`); ringkasan Claude & CSV tetap judul lengkap. `updateSession` dengan judul baru →
    `shortTitle` null. Backfill store lama cuma mengisi kalau judulnya masih judul seed.
  - K10–K13 P12: `Guest.thanksSentAt?`, store `markThanksSent(id, at)` (acara closed, tamu udah masuk,
    belum dihapus; udah terkirim → `false`, rev tetap — tanpa kirim ulang), server action
    `markThanksSent`. `lib/thanks.ts`: `THANKS_TEMPLATE` (copy Figma, read-only, `{nama}` = nama depan),
    `thanksLink` = `/t/{token}/buku-tamu?dari=wa`, `thanksView` (tamu udah check-in urut nama
    `localeCompare id`, `waHref` null kalau tanpa WA, `sent/total`). Hapus H+30 mengosongkan
    `thanksSentAt`. Store dev `__hmdStoreStart`.
- **v2 · layar tamu** (menggantikan no. 8 "T14b/T14c ada back", no. 13 soal `/buku-tamu`, no. 14 layout):
  - **BT12** (`components/f5/Selesai`, client): `IllustratedScreen` `/figma/f3-closing.webp` + panel —
    Badge neutral "Acara selesai", `t-title` "Makasih udah mampir!", "{n} foto · {m} pertanyaan · {k}
    tamu" (k = udah check-in), `EventTickets` (semua sesi = sobekan, caption "{x} dari {n} selesai") +
    prop baru **`extra`** (tiket gaya Sekarang, stub ikon `BookOpen`, "SATU LAGI · Isi buku tamu · ± 1
    menit"; `done` = sobekan terakhir ikon BookOpen + cek, K2, TODO desain), kartu `--card-2` "Kolase
    kulkas · {n} foto" + 4 thumbnail + "+{n−4}" (satu `Link` ke T15, tanpa tombol bersarang; 0 foto →
    "Belum ada foto"). Tanpa tombol bawah. Belum check-in → `SelesaiLuarScreen` kerangka sama +
    "Acaranya udah selesai" + Follow (copy bukan Figma).
  - (28 Okt) BT12: buku tamu = tombol di bawah panel (belum isi: primary "Isi buku tamu · ± 1 menit"; udah: secondary
    "Buku tamu udah diisi" → kolase + T14d), tiket `extra` nggak dipakai lagi. Belum isi → sheet T14 kebuka sendiri
    sekali per HP (localStorage `hmd-buku-tamu-auto:{token}`, 600 ms setelah layar muncul).
    Tiap BT12 tampil lagi (mis. back dari kolase setelah kirim) sheet disamakan dengan URL + `router.refresh()`
    (state layar yang disimpan Next dulu bikin sheet kebuka lagi).
  - **T14/T14b/T14c** = `BukuTamuSheet` (`Sheet strong`) di BT12, `?sheet=buku-tamu` (pushState, back HP/
    backdrop/Esc menutup, draft tetap). Header `t-card-title` + "± 1 menit. Cuma bintang yang wajib.",
    bagian tanpa Card, T14b = baris merah WifiSlash (bukan Banner), tombol di dalam sheet. Tiket extra →
    sheet; udah isi → `/kolase?isi=1`. `/buku-tamu` (link WA P12) = redirect: belum isi → `selesai?
    sheet=buku-tamu`, udah isi → `/kolase?isi=1`, belum masuk → `/selesai`.
  - **T15**: chip & label kaca "**Foto saya**" (kunci filter internal tetap `fotoku`), pin `PhotoPin
    frame`. Chip sesi T14/T15 & P13 + caption pakai `sessionShort`.
- **v2 · P12 Kirim makasih** (`GuestManager`; ada `thanks` = acara ditutup → cuma layar Makasih, tanpa tab Undangan/Pengingat H-1 (28 Okt); prop `thanks` = `thanksView` +
  `dateLabel`, cuma kalau `closed` & belum `purgedAt`; `?tab=makasih`): eyebrow "{tanggal} · setelah
  acara", kartu "{n} tamu yang datang" + "{x}/{n} terkirim" / cek bulat kalau semua (K11), template
  read-only, baris Avatar + nama + Badge "Terkirim" / sm "Kirim WA" (`wa.me`, pola P04b:
  sessionStorage `{kind:"thanks"}` → balik ke tab → `markThanksSent`) / "Nggak ada WA" `--label-3`.

## Aturan F3 + F4 di kode
Keputusan 25 Okt (default "Keputusan & asumsi" F3-F4-deliverables, kecuali K3/K8/K10 = usulan):
1. **Satu route** `/t/[token]/acara` → `components/f4/AcaraScreen`: SESI kalau ada sesi jalan, selain
   itu JEDA (termasuk sebelum sesi 1 = Berikutnya Open space, "0 dari 4 selesai", dan **jeda terakhir**
   = 1 baris "Semua sesi udah selesai…" + 4 ✓). Data layar = `acaraView` (`lib/acara.ts`, murni,
   bisa diserialisasi). Sheet BT22/BT21p/BT04/BT05 dibuka lewat `pushState ?sheet=detail|pembicara|
   rundown|tamu (&sesi=)`; back HP menutup; reload membuka sheet yang sama (searchParams → `initialSheet`).
2. **Data sesi** baru (opsional di `Session`): `room`, `roomNote`, `description`, `speaker {name, ig,
   label}`, `topic`, `art`. Diisi seed (`lib/data/sessionInfo.ts`); form PE04 belum bisa mengubah.
3. **K3 · seed ikut Figma**: "Open space", tagline Talkshow "Bareng Alfin Ganteng", PIC Closing "MC".
   Store lama (`.data/` / Supabase) dilengkapi saat dimuat (`backfillSessionInfo` di `createStore`,
   tanpa commit/rev): field kosong diisi, nilai seed lama yang **persis sama** diganti, ubahan panitia
   tetap. Idempoten.
4. Ilustrasi `public/figma/f3-{open-space,talkshow,office-tour,closing,break,weak-signal}.webp`
   (raw image layer C18, 1179×1650, webp 88, 67–91 KB). Dari `Session.art`; kosong → talkshow untuk
   `type: talkshow`, lainnya open-space. JEDA = break, JEDA offline = weak-signal. Tinggi ilustrasi =
   sisa layar di atas panel + 32 (flex, min 160; HP pendek = halaman scroll).
5. ~~Countdown~~ **dihapus di v3 (K13)** — lihat "v3" di bawah.
6. **Tanya** aktif (accent-soft) cuma saat sesi `type: talkshow` jalan → sheet N1 `?sheet=tanya`;
   selain itu opacity 0,4 + `aria-disabled`, tap diam.
7. Galeri → `/t/[token]/galeri` (placeholder BT07d). FAB = `Button` primary icon-only 54 (bukan
   komponen baru) → `/t/[token]/foto` di Sesi & Jeda.
8. **K8 · BT05 Tamu di sini**: cuma tamu RSVP hadir **atau** udah check-in. Data ke HP tamu: nama, IG,
   `Guest.card {role, askAbout ≤ 3}`, udah datang + jam datang — **tanpa WA, token, nomor kunci**
   (kecuali kartu sendiri). Urut: baru datang di depan, belum datang paling belakang (nama). Cari =
   filter lokal nama/@ig. "Ubah" → sheet T11 (N3). Kartu = `cardOf(guest)`; diisi tamu lewat T11
   (`saveGuestCard`) / T02 (`setRsvp`), `setGuestCard` apa adanya cuma dari /dev/states.
9. BT22 durasi: jalan "60 mnt · udah jalan 12 mnt", selesai "Selesai · 62 mnt", belum "45 mnt";
   deskripsi kosong → topik. BT04 subjudul: Selesai · "Lagi jalan · {ruang}" · "Berikutnya ·
   {pembicara ?? ruang}" · ruang. Tap baris rundown → BT22 sesi itu.
10. **K10 · konflik 2 HP**: aksi **sama** dari dua HP = HP pertama menang (store tetap idempoten,
    stopwatch nggak ke-reset); aksi **beda** dijalankan berurutan (yang terakhir menang). `Event.stateBy`
    (label HP, `lib/device.ts`, sama dengan `checkedInBy`) + `stateAction {kind: mulai|selesai|tutup,
    sessionId}`. Server action `startSession/finishSession/closeEvent(eventId, …, by)` → `StateResult
    {changed, by, action}`. HP panitia: `stateUpdatedAt` berubah & `stateBy` ≠ label sendiri → toast
    BP02d (TopToast ±4 dtk) + dialog/sheet yang kebuka ditutup; aksi no-op karena HP lain duluan →
    toast juga. Copy: "HP 7K2Q udah mulai Open space duluan. Layarmu ikut update."
11. **BP02c**: stopwatch & baris "Lewat {m} mnt dari jadwal ({jam selesai})" `--danger-text` saat
    elapsed > durasi (m = dibulatkan ke bawah, min 1; nggak maksa selesai). **Pengingat** di kartu
    Berikutnya: jam server > jam mulai → "{sesi} harusnya mulai {jam}" `--crew-text`. BP01: header
    carousel "Lagi jeda · layar tamu nunggu sesi n", Badge crew "Berikutnya", rundown "Selesai · 62 mnt".
    BP01b dari Jeda: "Layar semua tamu langsung pindah dari Jeda ke {sesi}, stopwatch mulai jalan." (F3
    `4900:27743`); ada sesi lain jalan (F2 v4): "{sesi} yang lagi jalan ikut selesai. Layar semua tamu
    langsung pindah ke {sesi}." tanpa kalimat stopwatch. Rundown sesi selesai bernomor (F5 v2 no. 17).
12. **S01 / realtime**: `LiveRefresh pollMs={2000}` di `acara/` & `kontrol/` (remote ≤ 3 dtk). Offline =
    `offline` event / `navigator.onLine` false, atau SSE/poll gagal 2× berturut (`onHealth`); balik
    online → cek `?once=1` → toast hilang. "Info sesi terakhir {jam}" = `loadedAt` (jam server saat data
    dimuat). Layar menyimpan snapshot `hmd-acara:{token}` + selisih jam `hmd-acara-skew` di
    localStorage; HTML dari cache SW yang lebih lama (rev lebih kecil) → pakai snapshot. Keenam
    ilustrasi di-fetch 1,5 dtk setelah layar dibuka (SW cache-first `/figma/`). SW cache `hmd-v4`.
- **v3 (26 Okt, K13–K21 default)**:
  - **Tiket acara** `EventTickets` (components/ui) ganti `JejakAcara` + `TicketNext` (dihapus). Data
    `acaraView.tickets[]` {no, title, jam, room, state done|now|next|soon|later}. Sobekan selesai numpuk
    kiri (54 + 12/sobekan, geser 12, miring 5°/−4°, terbaru di atas), tiket 262×88 (lebar
    `min(262, 100cqw − tumpukan − 8)` di HP sempit), deret melebar ke padding kanan panel, scroll-snap,
    awal di 0. Tiket & sobekan = tombol (label lengkap) → BT22 sesi itu (K16). Jeda terakhir = semua
    sobekan + baris "Semua sesi udah selesai…" (K17).
  - Header cuma Badge "Sedang berjalan" / "Sedang jeda" (baris ruang/jam & "Rumah baru Potara" dihapus).
    BT22 badge & BT04 subjudul "Sedang berjalan · {ruang}" (K15). Rundown/BP01 panitia tetap "lagi jalan".
  - **BT03s** (K14): `acaraView.soon` = jeda + jam server ≥ jam mulai terjadwal sesi berikutnya + belum
    dimulai (termasuk sebelum sesi 1) → judul "Bentar lagi mulai", tiket "SEBENTAR LAGI MULAI". Nggak ada
    perubahan rev → `soonAt` (jam mulai, ISO) dan `AcaraScreen` `router.refresh()` tepat di jam itu.
  - **P13 Foto masuk** (`components/f3/FotoMasuk`, `panitia/event/[id]/foto`, sesi PIN, LiveRefresh 2 dtk):
    `toKolasePhotos` + `Masonry`/`PhotoPin frame` (kartu --card radius 4, foto radius 2, slot `action`
    Trash 16 area 44), chip `Chip look="card"` "Semua" + sesi yang punya foto urut rundown (K20),
    subjudul "{n} foto · tamu lihat semua pas acara selesai". Tap foto = diam (K21). Kosong → HeroState.
  - **Hapus panitia** (K18): Dialog "Hapus foto ini?" / "Fotonya hilang dari galeri & kolase semua tamu."
    → `DELETE /api/panitia/foto/[id]` `{by}` (same-origin + sesi PIN) → store `removePhoto(id, at, by)`
    (`deletedAt` + `Photo.deletedBy`, idempoten → 204) lalu file dihapus. Optimistic (pin hilang dulu,
    gagal → balik + Toast). Rev naik → BT07d/BT07/T15 & tile Foto ikut update.
  - Foto yang udah dihapus (pemilik / panitia) **ditolak saat dikirim ulang**: `POST /api/t/[token]/foto`
    cek `isPhotoDeleted` sebelum nulis file → 410 `foto-dihapus`; `addPhoto` id terhapus → StoreError
    `foto-dihapus` (antrean HP membuang 4xx).
  - **Unduh** (K19): ZIP stored tanpa dependency (`lib/zip.ts`, CRC32, nama UTF-8, tes baca balik via
    zlib). HP fetch foto full lewat proxy panitia (filter aktif), `foto-hmd-{semua|slug-sesi}.zip`,
    file `{nn}-{nama}-{sesi}.jpg` urut lama → baru, download `<a download>`. 0 foto → tombol redup.
  - Dev: /dev/states/f4 BT03s (ganti BT03-habis), P13, P13-hapus, P13-kosong. Store dev `__hmdStoreF34v3`.
- (28 Okt) **PIC nggak dikirim ke HP tamu**: `acaraView` mengosongkan `pic` sesi; BT22 tanpa baris PIC,
  subjudul BT04 tanpa PIC (fallback "Berikutnya" / "Belum mulai").
- (28 Okt) Pintasan layar acara tamu = `GuestTabBar` (components/ui/TabBar, anatomi TabBar panitia): tombol
  bulat Tanya di kanan (redup + aria-disabled kalau Talkshow belum jalan) + bar gelap ikon Tamu · Rundown.
  Galeri = `PhotoStack` (maks 3 thumbnail miring bertumpuk, terbaru di atas, badge merah jumlah fotomu termasuk
  yang antre) di kiri FAB kamera; tanpa foto → satu kartu garis putus + ikon gambar, tanpa badge (galeri tetap bisa dibuka).
  Navbar nempel di bawah layar (fixed, tengah, hug selebar isi; z 55 di atas Sheet z 50, di luar panel). Tab yang sheet-nya kebuka = pil
  `--tabbar-active` + nama menu (Kartu dari BT05 = Tamu); tap tab aktif = tutup, tab lain = ganti sheet
  (replaceState). Sheet di layar acara dapat ruang 64 di bawah (`[data-sheet]::after`). Tombol bulat tetap hitam.
- (28 Okt) **Ilustrasi bergerak**: `public/figma/*.mp4` (1080×1920, 10 dtk loop, 2,4–4,5 MB) pasangan tiap
  webp (BT02, F3 open-space/talkshow/office-tour/closing/break/weak-signal, T01a, T01; closing juga di BT12).
  `ArtVideo` (components/ui) di atas <img> yang sama: posisi dari `lib/artVideo` (s, y diukur dari frame
  pertama) dihitung JS (`videoRect` + ResizeObserver, tanpa container query — Safari iPhone lama bikin
  video 1080 px melebarkan halaman), muncul (fade) setelah `playing`. Cuma diputar kalau sinyal kuat (`useStrongSignal`: online,
  bukan reduced motion/saveData, effectiveType 4g & downlink ≥ 1,5; iPhone tanpa API = coba putar);
  layar acara offline (S01) = gambar. SW nggak menangani `.mp4` (range request). T01 video: Pota main terompet.
  Video punya audio tapi diputar muted (syarat autoplay); T01 `sound`: tap segel T01a (`playArtSound`) / tap
  pertama di halaman → mulai dari awal bersuara sekali, lalu loop tanpa suara.
- Komponen baru: `TopToast` (S01, BP02d), `EventTickets` (v3, Tiket acara), `GuestCard` (BT05). Kartu kamu (tiket gelap `--cta`) di `components/f4/Sheets`.
- Server action dari browser pane Claude ditolak Next (origin `null`) → uji tombol dev di browser biasa.

## Aturan N1 di kode
Keputusan 25 Okt (prompt N1 + default "Keputusan & asumsi"/"Temuan" N1-deliverables):
1. **Tanpa Claude** (T1 ikut Figma): P10 = daftar mentah talkshow, belum dijawab terbaru dulu, udah
   dijawab = terakhir dijawab di atas. Nama tampil = nama depan; nama depan dobel di event → + inisial
   belakang ("Rara S.", `displayNames`). Tanpa opsi anonim.
2. **Data** `Question {id, clientId, eventId, guestId, sessionId, text, createdAt, answeredAt?}` di
   `StoreData.questions?`. `addQuestion` (idempoten per clientId, rev tetap; clientId sama dari tamu lain
   → isian-tidak-valid), `setQuestionAnswered` (✓/↺ idempoten → false), ikut terhapus di hapus tamu /
   hapus event / H+30. `seedQuestions`/`clearQuestions` = dev.
3. **Kirim** `POST /api/t/[token]/tanya` `{clientId, text}`: cuma tamu udah check-in (403), sesi yang
   **jalan** harus `type: talkshow` & acara belum ditutup (409 `{error:"bukan-talkshow"}`), teks trim
   1–280 (400), rate-limit 10/menit per tamu per instance (429, `lib/server/rateLimit`). Respons
   `{ok, question:{id,text,createdAt}}`. Dev: cookie `hmd_tanya_fail=1` → disimpan tapi dijawab 503.
4. **Route handler pakai `isStoreError`** (cek `name` + `code`), bukan `instanceof StoreError`: di dev
   store global dibuat modul layer halaman, jadi kelasnya beda instance di route handler (dulu → 500).
   Diterapkan juga di buku-tamu, foto, foto/[id], door. Server action tetap boleh `instanceof`.
5. **Sheet Tanya** (`components/n1/TanyaSheet`, `?sheet=tanya`, pola pushState F4): kartu pembicara
   accent-soft (avatar 52), stopwatch hh:mm:ss tiap detik (`elapsedMs`, jam server sendiri), textarea
   auto-grow (border 1,5 accent saat fokus/ada isi), Kirim disabled kalau kosong/spasi atau > 280,
   counter "{n}/280" mulai 240. Placeholder "Ada pertanyaan lain?" setelah kirim (Figma BT09); sebelum
   kirim pertama "Tulis pertanyaanmu" (copy bukan Figma). BT09: kartu Terkirim cuma pertanyaan
   terakhir. Talkshow selesai pas sheet kebuka → sheet nutup (state saat render + URL dibersihkan).
6. **Gagal** (BT08b): nggak ada antrean otomatis. Draft + clientId + teks percobaan di `sessionStorage`
   `hmd-tanya:{token}`; "Kirim lagi" / ikon ↻ TopToast pakai clientId yang sama selama teksnya sama
   (diubah → clientId baru). Timeout 8 dtk. 429 → copy "Kebanyakan nanya barengan…" (bukan Figma).
   409 → sheet nutup + TopToast "Sesi talkshow udah selesai" 4 dtk.
7. **P10/P10c** (`components/n1/Pertanyaan`, `panitia/event/[id]/tanya`): sesi = `talkshowFor` (jalan →
   terakhir dimulai → berikutnya), jadi tetap bisa dibuka setelah talkshow selesai. ✓/↺ = server action
   `markAnswered` + `useOptimistic` (gagal → balik sendiri + Toast 4 dtk). ↻ = `router.refresh()`.
   `LiveRefresh pollMs={2000}`, tanpa TabBar. Kartu disembunyikan kalau kosong; 0 total → P10c
   (HeroState lingkaran `--card`, subjudul "Talkshow · 0 masuk · mulai {jam}").
8. **Tile** BP02 Pertanyaan = total pertanyaan talkshow, `StatTile highlight` (border 1,5 accent) cuma
   kalau ada yang belum dijawab (T7). BT12: tile "pertanyaan" = semua pertanyaan event.
8b. (28 Okt) Sheet Tanya tamu: riwayat "Pertanyaan kamu · n" di bawah Kirim (`myQuestions`, semua pertanyaan
   tamu itu, terbaru dulu, Badge "Udah dijawab"/"Belum dijawab" dari P10, realtime lewat LiveRefresh);
   yang baru terkirim ditampilkan dari respons POST sampai data server masuk. Ganti kartu Terkirim BT09.
9. Belum: sembunyikan pertanyaan iseng (T8); BP02p nggak ada di /dev/states (cek lewat BP02 interaktif).

## Aturan N3 di kode
Keputusan 26 Okt (prompt N3 + usulan "Temuan" N3-deliverables T1–T13):
1. **Satu sumber kartu** (T1): `cardOf(guest)` (lib/card) = `Guest.card` kalau ada (kosong pun menang),
   kalau nggak diturunkan dari T02: `job` → role (≤ 40), `interests` dipecah koma/";" → maks 3 minat,
   tiap ≤ 20 huruf, trim, dobel (huruf besar-kecil) dibuang. `acaraView` & BT05 pakai `cardOf`.
2. **Simpan T11** `POST /api/t/[token]/kartu` `{role, askAbout}` → `{ok, card}`. `normalizeCard` menolak
   (400, bukan memotong) role > 40, > 3 minat, minat > 20. Tamu RSVP hadir **atau** udah check-in (403
   `belum-rsvp`), acara closed → 409 `{error:"acara-selesai"}`, purge → 410, rate-limit 20/menit per tamu
   (429). Store `saveGuestCard`: tulis `card` + sinkron `job = role`, `interests = askAbout.join(", ")`
   (prefill "Ubah jawaban" T02 sama); isi sama → `false`, rev tetap (Simpan lagi aman). Rev naik →
   kartu tampil di HP tamu lain lewat LiveRefresh 2 dtk.
3. **T02** (`setRsvp` dengan job/interests, cuma Hadir) ikut mengisi `card` lewat `cardOf`. Copy & batas
   T02 nggak berubah (minat tetap teks bebas ≤ 60, dipecah saat disimpan). Jawab "Nggak bisa" = kartu tetap.
4. Hapus H+30 ikut mengosongkan `card`. Data ke HP tamu lain tetap tanpa WA/token/nomor kunci (K8).
5. **Sheet T11** (`components/n3/KartuSheet`, `Sheet strong`): "Kartu kamu" + `MyCard` live preview + `Field`
   "Pekerjaan (opsional)" (label --label Medium) + `InterestChips` + "Simpan kartu" (aktif walau kosong).
   Prefill dari `cardOf(me)`; tutup tanpa simpan = dibuang (T4).
6. **Navigasi**: "Ubah" BT05 → `pushState ?sheet=kartu` (`hmdFromTamu`); back HP / backdrop / Esc →
   `history.back()` ke BT05. Dibuka langsung (link `/kartu` → redirect, reload) → tutup = `replaceState
   ?sheet=tamu`. Simpan berhasil → balik ke BT05 + TopToast `tone="dark"` Check "Kartu kamu kesimpan. Tamu
   lain bisa lihat sekarang." 3 dtk + `router.refresh()`; kartu baru dipakai (`savedCard`) selama data
   server masih rev lama.
7. **Gagal** (T6, copy usulan): `navigator.onLine` false / error / timeout 8 dtk → isian tetap, tombol
   "Simpan lagi", TopToast WifiSlash "Kartu kamu belum kesimpan" + "Sinyal lagi putus. Isiannya aman,
   tinggal tap Simpan lagi." Nggak diantre. Toast S01 disembunyikan selagi sheet kartu kebuka (posisi
   sama). 409 acara-selesai → sheet nutup + refresh (redirect BT12).
8. **InterestChips** (T3): chip accent-soft + "×" (aria "Hapus {minat}"); < 3 → "+ Tambah minat" dashed →
   input kecil (autofocus, "Mis. Kopi"). Enter / blur = tambah, Esc = batal (nggak nutup sheet), koma /
   ";" di `onChange` (keyboard HP sering kirim key "Unidentified", juga tempel teks) = tambah & lanjut
   ketik, dobel diabaikan. Counter "{n} dari 3".
9. (28 Okt) **BT05** kartu kamu jadi avatar 48 (cincin accent + badge pensil) di pojok kanan judul; tap =
   T11. Tinggi sheet ikut isi (tanpa min-height), "geser →" dihapus. Lama: "Kartu kamu" = `MyCard` (components/ui, dipindah dari f4/Sheets), role kosong → "@ig · belum isi
   pekerjaan" (T8). Saat cari, Kartu kamu disembunyikan; nggak ketemu → BT05b `HeroState size="sm"`
   "Nggak ada tamu bernama “{q}”" + "Coba nama lain atau @instagram-nya.", judul hasil disembunyikan,
   sheet ikut isi. Cari tetap nama/@ig (T10). GuestCard tinggi tetap 228.
10. Dev: `/dev/states/n3` (alat uji pindah dari f4; f4 link ke sini). Store dev `__hmdStoreN3`.

## Design system (Clean v0.5)
- Token: `app/tokens.css` — warna semantik light (utama) + dark (`prefers-color-scheme`, atau paksa
  dengan `data-theme="light|dark"` di `html` atau elemen mana pun), radius, spacing, shadow, motion,
  kelas tipografi `t-*` (Clean/* dari Figma; tracking Figma dalam persen → `em`).
- (28 Okt) `globals.css`: di layar sentuh semua input/textarea/select minimal 16 px (`!important`) — Safari iPhone
  nge-zoom halaman kalau kolom < 16 px difokus (dulu: Tanya 15 px, minat T11 13 px, ucapan T02b).
- **App selalu light** (25 Okt): `app/layout.tsx` memasang `<html data-theme="light">` + `themeColor`
  satu warna, jadi setting dark HP nggak berpengaruh. Dark cuma lewat `data-theme="dark"` per elemen
  (pratinjau `/dev/ui`). CSS `prefers-color-scheme` baru wajib dijaga `:root:not([data-theme="light"])`.
- Komponen: `components/ui/*` (satu `.tsx` + `.module.css`), ekspor lewat `@/components/ui`.
  Button, IconButton, PinPad (P01), Countdown (T03), NumberedRow (T01/PE04), Dropzone (P04k),
  Toggle, Segmented, Badge, Pill/Chip/AddChip,
  Card/CardLabel/InnerBox, StatTile (+`highlight`), ListRow/Avatar, Banner/TextAction, HeroState (+`size="sm"`), Field, Toast
  (undo ring), Sheet (bawah / `floating`), TabBar, Ticket (+`torn`)/TicketStub, LogoMark,
  Screen/ScreenHeader/Skeleton, SearchField, Dialog (konfirmasi tengah layar, BP03/BP01b),
  StarRating (T14), Masonry + PhotoPin (T15; `frame` + `action` P13), Chip `look="card"` (P13), BarList (P11), SwipeRow (P04s/
  PE04s, panel hapus `--danger-fill`), TopToast (S01,
  BP02d, `tone="dark"` T11s), EventTickets (Tiket acara F4 v3) · GuestCard (BT05) · MyCard (BT05/T11), IllustratedScreen (ilustrasi + fade +
  panel `--card`, BT02; pola sama dengan `components/f4/AcaraScreen` yang masih inline). `TextAction`
  bisa `href`.
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
- `Sheet` (28 Okt): geser ke bawah buat nutup kalau dismissible (isi di paling atas + gerak awal vertikal,
  lepas > 96 px / cepat → tutup, selain itu balik); panel `overflow-x: hidden` — cuma carousel di dalamnya
  (mis. kartu tamu BT05) yang geser horizontal.
- `IconButton` = khusus tombol back/close 44 di toolbar (gaya secondary, varian `glass` di kamera).
- `Screen`: `withBack` (konten mulai 8px), `bottom` + `bottomHeight` (1 tombol 54, 2 tombol 118,
  +caption 28) → fade scroll-edge otomatis di atas aksi bawah.
- `TabBar` pakai prop `eventId` → `/panitia/event/{id}/kontrol|tamu|tanya|scan` (Tanya = P10 N1;
  bukan 404 lagi); tanpa `eventId` (pratinjau /dev/ui) semua ke `/panitia`. `Ticket` tanpa QR = placeholder.
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
Uji alur: `/dev/states/f1` (pratinjau 37 layar + link tamu + CSV dummy + "Reset data ke awal").
F2: `/dev/states/f2` → "Siapkan data uji" → "Pura-pura hari-H" → buka link tamu + /panitia → Scan.
Sesi: tombol "Mulai sesi 1" / "Selesaikan sesi" di halaman yang sama, atau lewat BP02.
N1: `/dev/states/f2` → Siapkan data uji → check-in → `/dev/states/n1` "Mulai Talkshow" → layar
acara tamu → Tanya; P10 di tab lain. "Simulasi gagal kirim" (cookie browser itu) → BT08b.
F5: `/dev/states/f2` → Siapkan data uji → `/dev/states/f5` → "Isi 15 feedback dummy" (check-in,
selesaikan sesi, tutup acara otomatis) → "Buat ringkasan sekarang" / Unduh CSV. "Loncat ke 8 Des"
menghapus data per orang di store lokal → balikin lewat `/dev/states/f1` Reset data.

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
- [x] F2 v2 (23 Okt) — BP02 kartu sesi + Mulai/Selesaikan, scan/P06/P07/P07d baru — menunggu review
- [x] F2 v3 (25 Okt) — BT02 ilustrasi + panel, kode BP02/BP03/BP01b — menunggu review
- [x] N4 (24 Okt) — foto kolase polaroid (5 layar + 2 kasus, kompres di HP, antrean offline) —
      menunggu review & bucket Supabase
- [x] N4 v2 (25 Okt) — hasil foto & Galeri BT07d jadi sheet di layar acara, BT07e, magnet + badge status,
      BT06b 2 tombol — menunggu review
- [x] N4 v3 (26 Okt) — BT07dh hapus foto di Galeri tanpa Dialog + Batalkan 5 dtk — menunggu review
- [x] F5 (24 Okt) — tutup acara, buku tamu, kolase 9:16, rekap + ringkasan Claude, CSV, hapus H+30;
      16 layar (BT12, T14*, T15*, BP04/BP04b, P11*) — menunggu review & `ANTHROPIC_API_KEY` di Vercel
- [x] F1 update 26 Okt (v5.1) — T01 grid bagian acara tanpa Jejak undangan, T01a teks di atas,
      header Daftar event — menunggu review
- [x] F1 update 23 + 25 Okt (v5) — 37 layar: amplop Pota, T01 baru, T02 kenalan, T02b ucapan,
      T03k, P04i/g/h/s, PE04b/s, pengingat per tamu — menunggu review
- [x] F3 + F4 (25 Okt) — layar acara tamu Sesi/Jeda (13 layar/kasus) + Kontrol acara BP01/BP02c/
      BP02d, ilustrasi, offline S01 — menunggu review
- [x] N1 (25 Okt) — pertanyaan talkshow tanpa Claude: sheet BT08/BT09/BT08b, P10/P10c, tile BP02/BT12 —
      menunggu review
- [x] N3 (26 Okt) — kenalan antartamu: sheet T11/T11e/T11s, BT05b, satu sumber kartu (T02 ↔ T11),
      POST kartu, realtime — menunggu review
- [x] F3 + F4 v3 (26 Okt) — Tiket acara geser, badge "Sedang …", BT03s, P13 Foto masuk (hapus panitia,
      unduh ZIP) — menunggu review
- [ ] N2, BT07d galeri — berikutnya (versi lama: tag `archive-pre-revisi`)
