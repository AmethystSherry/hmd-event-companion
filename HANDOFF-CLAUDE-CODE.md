# Handoff ke Claude Code — HMD Event Companion (Konsep B)

Dokumen ini berisi prompt untuk membangun produk ini dengan Claude Code, dipecah per phase.

> **Update 22 Okt:** development sempat di-hold karena perubahan logic besar. Yang dipertahankan dari kode cuma **design system** (token + komponen UI). F1 sudah final di Figma. Untuk lanjut: kerjakan **`F1-prompt-claude-code.md`** (Prompt A → B → C), yang menggantikan Phase 1 (bagian Button) dan Phase 3 di bawah. Phase lain tetap berlaku setelah F1 selesai.

Cara pakai:

1. Taruh `prd.md` (v0.2), `design.md` (v0.6), `F1-deliverables.md`, `F1-prompt-claude-code.md`, dan file ini di root folder project.
2. Buka Claude Code di folder ini. Kirim **Prompt 0 (Master)** sekali di awal sesi.
3. Kerjakan phase berurutan. Di tiap phase, kirim prompt phase-nya, review hasil, lalu commit sebelum lanjut.
4. Tiap phase selesai kalau semua **Definition of Done** tercentang. Jangan lompat phase.

Deadline penting (dari PRD §12): **freeze & submit Jumat 30 Okt 2026, 17.00 WIB**. Test Day 2 Nov, pitch 3 Nov, acara 8 Nov.
Prioritas kalau waktu mepet: F1–F5 > N1 > N4 > N3 > N2 (N2 di-pause).

---

## Prompt 0 — Master (kirim sekali di awal)

```text
Kamu akan membangun "HMD Event Companion" (Konsep B "Satu Layar, Dua Mode") untuk Potara Hackathon.
Development sempat di-hold. Yang dipertahankan dari kode yang ada hanya DESIGN SYSTEM (token + komponen UI); alur/halaman lama dianggap arsip.

Sumber kebenaran:
- prd.md (v0.2) → fitur, alur, model state acara, data & privasi, NFR, kriteria terima, milestone.
- design.md (v0.6) → arah visual "Clean", token warna, komponen (termasuk Button 22 Okt), state, motion, copy.
- F1-deliverables.md → daftar layar F1, fix annotation, update design system 22 Okt, keputusan.
- F1-prompt-claude-code.md → urutan kerja F1 (Prompt A, B, C).
- Desain Figma (pakai Figma MCP kalau tersedia): file key xYZlQ3GjRHHtYcod8rTIZJ, page "DOKSLI SAPI" (4533:746).
  · SUMBER KEBENARAN: section "Screen Flow · All Case" (4655:2704) → frame "All Case Flow · v1" (4665:3650).
    Bab: F1 Undangan (4732:12593, versi 22 Okt) · F2 Check-in (4667:4654) · F3+F4 Jeda⇄Sesi (4668:4730) · N1 Pertanyaan (4669:4888) · N2 Naskah MC (4669:4993) · N3 Kenalan (4670:4888) · N4 Foto kolase (4670:4981) · F5 Tutup acara (4671:4888).
    Tiap bab = alur layar utama + kartu case (KASUS LAIN/GAGAL) dengan thumbnail layarnya. Layar di bab ditampilkan skala 0,5 (ukuran asli 390×844).
  · Komponen: frame "Clean v0.5 / Components" (4587:276): Clean/Button (Size × Style × Content), Clean/IconButton, Clean/TabBar · Panitia, Clean/Ticket, Potara/Logo mark, dll.
  · ABAIKAN (arsip): "Screen Flow · Konsep B v2" (4666:3845), group "Backup · flow lama" di dalam section All Case, Flow v0.2 (B2), iOS v0.3 (B3/B4), Konsep A/B awal (A–G, B00, BA–BC), komponen lama Clean/Button · Destructive.
  Urutan prioritas kalau ada yang bertentangan: All Case Flow · v1 > F1-deliverables.md > design.md > prd.md untuk alur, layar, state, dan tampilan. prd.md tetap acuan untuk aturan bisnis, data & privasi, NFR, dan milestone.

Aturan kerja:
1. Baca prd.md, design.md, dan F1-deliverables.md sampai habis, lalu petakan kode yang sudah ada (design system) sebelum menulis kode. Ringkas pemahamanmu dalam ≤15 poin, lalu tunggu konfirmasiku.
2. Kerjakan per prompt/phase. Jangan mengerjakan yang berikutnya sebelum aku bilang lanjut.
3. Di awal tiap phase: tulis rencana singkat (file yang dibuat/diubah, keputusan teknis). Di akhir: jalankan, tes, dan laporkan checklist Definition of Done + cara aku mengecek manual.
4. Stack: hanya layanan gratis / free tier / yang sudah dimiliki studio. Dilarang menambah layanan berbayar.
5. Data: hanya CSV dummy sampai Test Day. Jangan pernah meminta/menulis data tamu asli, password, atau secret ke kode atau ke chat. Secret lewat .env (dan .env.example tanpa nilai).
6. Web mobile 390×844, Safari iOS & Chrome Android. Bahasa UI: Indonesia santai, persis copy di Figma.
7. Semua state wajib ada: loading, kosong, error, offline. Daftar case final = semua kartu di All Case Flow · v1.
8. Semua tombol pakai komponen Button dari design system (size lg/sm, variant primary/secondary/destructive, iconOnly). Jangan bikin tombol custom atau override warnanya.
9. Commit kecil per fitur dengan pesan jelas. Jaga CLAUDE.md di root tetap update (arsitektur, cara run, konvensi).
```

---

## Phase 0 — Fondasi & keputusan stack

> Sudah dikerjakan sebelum hold (Next.js). Cek ulang aja: masih jalan, env aman, CLAUDE.md sesuai.

```text
Phase 0: fondasi project.

1. Usulkan stack yang memenuhi prd.md §10 (gratis, realtime/pub-sub atau polling cepat, service worker offline, hosting URL publik, bisa panggil Claude API dari server). Rekomendasi default kalau tidak ada alasan kuat lain: Next.js (App Router, TypeScript) + Supabase free tier (Postgres + Realtime + Storage) + Vercel Hobby. Jelaskan trade-off dalam 5 poin, lalu tunggu persetujuanku.
2. Setelah disetujui: scaffold project, lint/format, struktur folder (app/tamu, app/panitia, lib, components/ui), env (.env.example), dan script dev/build/test.
3. Pasang font Switzer (self-host), dan meta noindex untuk semua halaman tamu.
4. Buat halaman /dev/status sederhana yang menampilkan versi build dan koneksi DB/realtime OK.
5. Deploy preview pertama ke hosting gratis. Tulis CLAUDE.md.
```

**Definition of Done**
- [ ] Stack disetujui dan dicatat di CLAUDE.md
- [ ] `npm run dev` jalan, preview URL publik bisa dibuka dari HP
- [ ] Font Switzer tampil, halaman tamu `noindex`
- [ ] Tidak ada secret ter-commit

---

## Phase 1 — Design system di kode

> Sudah ada di kode. Update 22 Okt (Button 2 size, Destructive teks, icon only, logo baru, ikon baru) dikerjakan lewat **Prompt B** di `F1-prompt-claude-code.md`.

```text
Phase 1: design system. Ambil nilai dari design.md §2A; cek komponen sumber di frame "Clean v0.5 / Components" (Figma MCP).

1. Token CSS (light + dark): bg, card, card-2, label, label-2, label-3, separator, cta, on-cta, accent (#F95B00), amber (#FFA101), crew, success/warning/danger soft+text, danger-fill (#F54847), glass, qr-bg/qr-ink, secondary-fill/stroke/highlight, toggle-track. Radius, spacing, shadow kartu halus, ramp tipografi Clean/* (Switzer).
2. Komponen UI (dengan halaman /dev/ui untuk preview semua varian & state):
   - Button: size lg (54) / sm (36) × variant primary / secondary / destructive × teks / iconOnly — nilai persis di design.md "Button (22 Okt)". Ikon selalu currentColor.
   - IconButton toolbar 44 (gaya Secondary; varian glass untuk layar kamera)
   - Toggle (track cekung + knob 2 lapis), Segmented control (tinggi 54, pill aktif #232325)
   - Badge (Live/Crew/Success/Neutral), Pill, StatTile, ListRow, Card, Banner (danger/warning/neutral), Toast gelap, Bottom sheet (dim + grabber), Field input, Tab bar panitia (bar gelap Kontrol·Tamu·Tanya + tombol Scan bulat hitam terpisah)
   - Ticket (anatomi di design.md), Logo mark Potara (SVG dari komponen Figma "Potara/Logo mark" versi 22 Okt)
   - Ikon: @phosphor-icons (Regular/Fill) sesuai mapping design.md
3. Layout dasar layar 390 dengan safe area, scroll edge fade di atas tombol bawah, home indicator spacing.
4. prefers-reduced-motion dihormati, target sentuh ≥ 44px, kontras ≥ 4.5:1.
```

**Definition of Done**
- [ ] /dev/ui menampilkan semua komponen di light & dark
- [ ] Button/Toggle/Segmented/TabBar terlihat sama dengan Figma (bandingkan screenshot berdampingan)
- [ ] Tidak ada warna hard-coded di luar token

---

## Phase 2 — Data, akses, dan seed dummy

```text
Phase 2: data & akses (prd.md §3, §6, §8).

1. Skema DB: Event, Guest, Ticket, ProfileCard, Session, EventState (1 baris per event), Question, Photo, Feedback, Script. Tambahkan index & constraint yang perlu (ticket single-use, idempoten check-in, CSV import sekali per event).
2. Seed dari CSV dummy (buat sendiri 20 tamu fiktif, kolom nama, ig, pesan, wa + rundown default 4 sesi di prd.md §6). Script import CSV yang sama dipakai P04a.
3. Akses tamu: link unik /t/{token} (token acak panjang), tanpa login. Akses panitia: PIN 6 digit acara, diverifikasi di server, rate-limit (5 salah → kunci 5 menit), sesi panitia via cookie httpOnly.
4. Ticket: ticketId + shortCode + tanda tangan HMAC (secret di env). QR hanya berisi URL/ID bertanda tangan, tanpa data pribadi.
5. Row-level security / guard API: tamu hanya bisa baca/ubah datanya sendiri; panitia butuh sesi PIN.
6. Job hapus otomatis data pribadi 8 Des 2026 (tulis sebagai script/cron gratis + dokumentasi).
```

**Definition of Done**
- [ ] Seed jalan ulang dengan aman (idempoten)
- [ ] PIN salah 5× terkunci 5 menit (tes otomatis)
- [ ] Tanda tangan QR diverifikasi di server; QR palsu ditolak
- [ ] Tidak ada data asli di repo

---

## Phase 3 — F1 Undangan & konfirmasi

> **Diganti:** pakai **Prompt C** di `F1-prompt-claude-code.md`. Figma: band F1 `4732:12593`. Ringkasan alur:
> - Tamu: DM IG (link unik) → T01 → T02 (WA wajib) → T03 tiket + countdown · T02b nggak bisa datang · T03h dari WA H-1. Case: T01e, T02c, T02d.
> - Panitia: P01 PIN (P01b, P01c) → PE01 Event kamu → PE02 Buat event → PE03 Home event → Rundown PE04k/PE04/PE04a → Tamu & undangan P04k → P04a (CSV sekali) → P04 undang via DM IG → P04d (Undo 5 dtk) · P04f tambah · P04e ubah/hapus · P04c CSV error → H-1 P04b Kirim WA / Kirim ke semua.
> - Yang **dibuang** dari versi lama: T04 terpisah, T02b Kenalan dikit, P03 pra-acara, Salin link / Salin semua link.

**Definition of Done**
- [ ] Lihat Definition of Done Prompt C di `F1-prompt-claude-code.md`

---

## Phase 4 — F2 Check-in tiket QR < 30 detik

```text
Phase 4: F2 (prd.md §7 F2, design.md "Tiket"). Figma: bab "F2 · Check-in di pintu" (4667:4654) di All Case Flow · v1.

Tamu: T05 Tiket hari-H (QR besar, kecerahan tinggi, offline dari cache) → setelah discan, HP tamu realtime menampilkan BT02 tiket sobek (animasi tear ~900 ms sesuai design.md; reduced-motion = fade) → otomatis ke layar acara.
Panitia: P05 Scan tiket (kamera tetap nyala antar scan) → P06 Valid / P06b Sudah dipakai / P06c Tidak dikenal (bottom sheet, tutup otomatis 2 dtk) · P07 Cari nama (cadangan) · tab bar Scan.
Case states: T03b tiket dibuka lagi setelah masuk (QR nonaktif), P07b kamera error → langsung Cari nama, P07c walk-in (sheet tambah tamu cepat), P07d daftar manual PDF (unduh, cetak H-1).
Offline: check-in panitia diantrikan lalu sinkron; QR & tiket tamu tersedia offline.
Semua tombol pakai Button (lg untuk CTA/sheet, sm untuk aksi di baris). Ukur waktu dari scan sampai tiket sobek di HP tamu.
```

**Definition of Done**
- [ ] Median scan→sobek < 10 dtk di jaringan normal; check-in idempoten (scan dobel = "Sudah dipakai")
- [ ] Mode pesawat di HP panitia: check-in tetap tercatat lalu sinkron
- [ ] PDF daftar manual bisa diunduh

---

## Phase 5 — F3 + F4 Mode acara realtime (inti Konsep B)

```text
Phase 5: F3 & F4 (prd.md §6 model state, §7 F3/F4). Figma: bab "F3 + F4 · Selama acara: Jeda ⇄ Sesi" (4668:4730) di All Case Flow · v1.

Event state global (mode pre/jeda/sesi/closed, activeSession, nextSession) di-push realtime ke semua HP tamu (≤ 3 dtk, fallback polling 5–10 dtk).
Hari-H: Home event (PE03) otomatis jadi Kontrol acara (BP01). Rundown diambil dari yang diatur panitia di PE04.
Panitia: BP01 Kontrol acara (Mulai {sesi}) → toast "Batalkan" 5 dtk → BP02 Sesi berjalan (timer, PIC, berikutnya) → BP03 Konfirmasi selesai ("Selesai & mulai {berikutnya}" / "Selesai aja, tamu ke Jeda") → BP04 Semua sesi selesai → Tutup acara (konfirmasi BP04b).
Tamu: BT03 Jeda (countdown, tile Rundown/Peserta/Foto) · BT04 Rundown read-only · BT08 Sesi talkshow (input pertanyaan) · BT11 Sesi info · BT10 Jeda berikutnya · S01 banner sinyal lemah + jadwal terakhir.
Case states: BT03b countdown habis "Sebentar lagi mulai", BP02b toast "Diubah oleh panitia lain", BP02c timer merah "lewat N menit" (tidak memaksa selesai).
```

**Definition of Done**
- [ ] 5 HP terbuka bersamaan pindah JEDA→SESI dalam ≤ 3 dtk setelah Mulai
- [ ] Tamu yang baru buka langsung mendarat di mode aktif
- [ ] Panitia pindah ke bagian berikutnya ≤ 3 tap

---

## Phase 6 — F5 Penutupan: buku tamu & kolase

```text
Phase 6: F5 (prd.md §7 F5). Figma: bab "F5 · Tutup acara & feedback" (4671:4888) di All Case Flow · v1.

Tamu: BT12 Acara selesai → T14 Buku tamu (rating, bagian paling seru, satu hal diperbaiki, mau diundang lagi) → T15 Kolase kulkas (masonry 2 kolom gaya Pinterest, filter Semua/Fotoku/per sesi) → T15b Detail foto (Simpan foto, Hapus pakai Button destructive iconOnly, hanya foto sendiri & sebelum acara ditutup).
Panitia: P11 Rekap buku tamu (stat, bar bagian paling seru, ringkasan Claude, unduh CSV).
Case states: T14b gagal kirim (jawaban tetap), T15c simpan kolase 9:16 (generate gambar story di client/server), T15d kolase kosong, P11b Claude gagal (angka & jawaban tetap tampil), P11c belum ada feedback.
```

**Definition of Done**
- [ ] Tutup acara → semua HP tamu ke BT12/T14
- [ ] Gambar kolase 9:16 bisa disimpan di iOS & Android
- [ ] Rekap P11 benar dengan data dummy

---

## Phase 7 — Nilai tambah: N1, N4, N3 (N2 di-pause)

```text
Phase 7: N1, N4, N3 (prd.md §7). Figma: bab N1 (4669:4888), N3 (4670:4888), N4 (4670:4981) di All Case Flow · v1. Panggilan Claude hanya dari server, API key di env, ada timeout & fallback.

N1 Pertanyaan talkshow: BT08 kirim (tampil nama, opsi anonim) → P10 dikelompokkan Claude, tandai dijawab. Fallback P10b daftar mentah urut waktu, P10c kosong.
N4 Kulkas polaroid: BT06 kamera (frame polaroid) → BT07 foto masuk kolase, kompres sebelum upload, antre saat offline (BT07b), BT06b izin kamera ditolak + cara menyalakan.
N3 Kenalan: BT05 Peserta (cari, baru datang) → T11b lihat kartu (chip skill/asbun) → T11 edit kartu sendiri (diisi di sini, tidak lagi saat konfirmasi). Case: BT05b cari nggak ketemu, BT05c baru sedikit yang datang.
N2 Naskah MC: DI-PAUSE, jangan dikerjakan sampai aku bilang.
Kerjakan berurutan N1 > N4 > N3; berhenti dan lapor kalau waktu habis.
```

**Definition of Done**
- [ ] Claude mati/timeout → tidak ada layar kosong
- [ ] Foto terkompres (< 500 KB) dan muncul di kolase semua tamu

---

## Phase 8 — Hardening: offline, PWA, a11y, performa

```text
Phase 8: hardening (prd.md §9, design.md §5–§8).

1. Service worker: cache shell, tiket/QR, rundown, mode terakhir; antrian sinkron untuk check-in, pertanyaan, foto, feedback.
2. Audit semua kartu case di All Case Flow · v1 (4665:3650): setiap kartu case harus punya layar yang bisa dipicu (halaman /dev/states untuk preview cepat).
3. Aksesibilitas: kontras, fokus, label aria (wajib untuk Button iconOnly), target 44px, reduced motion. Lighthouse mobile ≥ 90 untuk Performance & Accessibility di halaman tamu.
4. Performa: first load < 3 dtk di 4G (throttle), bundle tamu kecil, gambar lazy & terkompres.
5. Rate-limit & validasi semua endpoint; log error sederhana.
```

**Definition of Done**
- [ ] Semua kartu case di All Case Flow tercentang di /dev/states
- [ ] Lighthouse mobile ≥ 90 (Perf, A11y) di T01, T05, BT03
- [ ] Uji mode pesawat lulus untuk tiket, check-in, Jeda

---

## Phase 9 — Uji Test Day, submission, freeze

```text
Phase 9: siap Test Day (prd.md §11, §12, §14).

1. Buat checklist uji berdasarkan tabel "Skenario penguji" prd.md §11; jalankan dengan 5 HP (tamu + panitia) dan catat bug.
2. Perbaiki bug blocker saja. Tidak ada fitur baru.
3. Halaman "Cara pakai" (tamu, panitia, rencana cadangan sinyal mati) dan naskah video demo ≤ 60 dtk.
4. Reset data ke dummy bersih, buat tag versi rilis, deploy produksi, catat URL.
5. Freeze: setelah Jumat 30 Okt 17.00 tidak ada deploy. Tulis catatan di CLAUDE.md.
```

**Definition of Done**
- [ ] Semua skenario penguji lulus tanpa dipandu
- [ ] Link produk, video demo, halaman cara pakai siap sebelum 30 Okt 17.00
- [ ] Tag rilis dibuat, tidak ada deploy setelah freeze

---

## Lampiran — template prompt per fitur (kalau phase terlalu besar)

```text
Kerjakan [kode fitur/screen, mis. P06b] saja.
Referensi: All Case Flow · v1 bab [..] node [id] (sumber kebenaran), design.md [§...], prd.md [§...]. Pakai Figma MCP untuk screenshot & ukuran.
Batasan: jangan ubah komponen di luar [daftar file]. Pakai komponen di components/ui (Button size/variant sesuai design.md).
Selesai kalau: [kriteria terima]. Laporkan file yang diubah + cara aku cek di HP.
```
