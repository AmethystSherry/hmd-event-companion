# Handoff ke Claude Code — HMD Event Companion (Konsep B)

Dokumen ini berisi prompt untuk membangun produk ini dengan Claude Code, dipecah per phase.
Cara pakai:

1. Taruh `prd.md`, `design.md`, dan file ini di root folder project (folder ini).
2. Buka Claude Code di folder ini. Kirim **Prompt 0 (Master)** sekali di awal sesi pertama.
3. Kerjakan phase berurutan. Di tiap phase, kirim prompt phase-nya, review hasil, lalu commit sebelum lanjut.
4. Tiap phase selesai kalau semua **Definition of Done** tercentang. Jangan lompat phase.

Deadline penting (dari PRD §12): **freeze & submit Jumat 30 Okt 2026, 17.00 WIB**. Test Day 2 Nov, pitch 3 Nov, acara 8 Nov.
Prioritas kalau waktu mepet: F1–F5 > N1 > N2 > N4 > N3.

---

## Prompt 0 — Master (kirim sekali di awal)

```text
Kamu akan membangun "HMD Event Companion" (Konsep B "Satu Layar, Dua Mode") untuk Potara Hackathon.

Sumber kebenaran:
- prd.md  → fitur, alur, model state acara, data & privasi, NFR, kriteria terima, milestone.
- design.md → arah visual "Clean v0.5" (light utama + dark), token warna, komponen, inventaris screen, state, motion, copy.
- Desain Figma (pakai Figma MCP kalau tersedia): file key xYZlQ3GjRHHtYcod8rTIZJ, page "DOKSLI SAPI" (4533:746).
  · Section "Finalise Alfin" (4648:1920) = semua layar final Clean (C1–C16).
  · "Screen Flow v2" (4666:3845) = alur antar layar.
  · "Screen Flow · All Case" (4655:2704) = semua case/state + layar yang sudah dipetakan.
  · Komponen di frame "Clean v0.5 / Components" (Clean/Button, Clean/IconButton, Clean/TabBar · Panitia, Clean/Ticket, Clean/Button · Destructive, Potara/Logo mark, dll).
  Kalau ada beda antara prd.md dan design.md soal tampilan, design.md + Figma yang menang. Soal perilaku/fitur, prd.md yang menang.

Aturan kerja:
1. Baca prd.md dan design.md sampai habis sebelum menulis kode. Ringkas pemahamanmu dalam ≤15 poin, lalu tunggu konfirmasiku.
2. Kerjakan per phase sesuai HANDOFF-CLAUDE-CODE.md. Jangan mengerjakan phase berikutnya sebelum aku bilang lanjut.
3. Di awal tiap phase: tulis rencana singkat (file yang dibuat/diubah, keputusan teknis). Di akhir: jalankan, tes, dan laporkan checklist Definition of Done + cara aku mengecek manual.
4. Stack: hanya layanan gratis / free tier / yang sudah dimiliki studio. Dilarang menambah layanan berbayar.
5. Data: hanya CSV dummy sampai Test Day. Jangan pernah meminta/menulis data tamu asli, password, atau secret ke kode atau ke chat. Secret lewat .env (dan .env.example tanpa nilai).
6. Web mobile 390×844, Safari iOS & Chrome Android. Bahasa UI: Indonesia santai, persis copy di Figma/design.md.
7. Semua state wajib ada: loading, kosong, error, offline (lihat design.md §5 dan section C13–C16 di Figma).
8. Commit kecil per fitur dengan pesan jelas. Buat CLAUDE.md di root berisi ringkasan arsitektur, cara run, dan konvensi, lalu jaga tetap update.
```

---

## Phase 0 — Fondasi & keputusan stack

```text
Phase 0: fondasi project.

1. Usulkan stack yang memenuhi prd.md §10 (gratis, realtime/pub-sub atau polling cepat, service worker offline, hosting URL publik, bisa panggil Claude API dari server). Rekomendasi default kalau tidak ada alasan kuat lain: Next.js (App Router, TypeScript) + Supabase free tier (Postgres + Realtime + Storage) + Vercel Hobby. Jelaskan trade-off dalam 5 poin, lalu tunggu persetujuanku.
2. Setelah disetujui: scaffold project, lint/format, struktur folder (app/tamu, app/panitia, lib, components/ui), env (.env.example), dan script dev/build/test.
3. Pasang font Switzer (self-host) + JetBrains Mono, dan meta noindex untuk semua halaman tamu.
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

```text
Phase 1: design system. Ambil semua nilai dari design.md §2A dan catatan "Status di Figma" (gunakan Figma MCP untuk cek detail).

1. Token CSS (light + dark): bg, card, card-2, label, label-2, label-3, separator, cta, on-cta, accent (#F95B00), amber (#FFA101), crew, success/warning/danger soft+text, glass, qr-bg/qr-ink, secondary-fill/stroke/highlight, toggle-track. Radius, spacing, shadow kartu halus, ramp tipografi Clean/* (Switzer).
2. Komponen UI (dengan story/halaman /dev/ui untuk preview semua varian & state):
   - Button Primary (glossy gelap: gradient, rim, border, shadow — nilai persis di design.md)
   - Button Secondary (fill #EFEFEF, border 1px #C8C8C8, highlight putih 1,5px, shadow 2 lapis, pill)
   - Button Destructive (lingkaran merah #F54847 + ikon ember putih)
   - IconButton (gaya Secondary, ikon saja; varian glass untuk layar kamera)
   - Toggle (track cekung + knob 2 lapis), Segmented control (tinggi 54, pill aktif #232325)
   - Badge (Live/Crew/Success/Neutral), Pill, StatTile, ListRow, Card, Banner (danger/warning/neutral), Toast gelap, Bottom sheet (dim + grabber), Field input, Tab bar panitia (bar gelap Kontrol·Tamu·Tanya + tombol Scan bulat hitam terpisah)
   - Ticket (anatomi di design.md: sobekan, perforasi, QR), Logo mark Potara (SVG dari Figma komponen "Potara/Logo mark")
   - Ikon: @phosphor-icons (Regular/Fill) sesuai mapping design.md
3. Layout dasar layar 390 dengan safe area, scroll edge fade di atas tombol bawah, home indicator spacing.
4. prefers-reduced-motion dihormati, target sentuh ≥ 44px, kontras ≥ 4.5:1.
```

**Definition of Done**
- [ ] /dev/ui menampilkan semua komponen di light & dark
- [ ] Button/Toggle/Segmented/TabBar terlihat sama dengan Figma (bandingkan screenshot berdampingan)
- [ ] Tidak ada warna hard-coded di luar token (kecuali yang memang fixed di design.md)

---

## Phase 2 — Data, akses, dan seed dummy

```text
Phase 2: data & akses (prd.md §3, §6, §8).

1. Skema DB: Guest, Ticket, ProfileCard, Session, EventState (1 baris), Question, Photo, Feedback, Script. Tambahkan index & constraint yang perlu (ticket single-use, idempoten check-in).
2. Seed dari CSV dummy (buat sendiri 20 tamu fiktif + rundown default 4 sesi di prd.md §6). Script import CSV yang sama dipakai P04.
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

```text
Phase 3: F1 (prd.md §7 F1, Figma C1/C10/C12/C13/C15).

Tamu: T01 Undangan → T02 Konfirmasi hadir (nama, IG wajib, WA opsional, toggle follow @potarastudio wajib) → T02b Kenalan dikit (chip skill & asbun maks 3, bisa dilewati) → T03 Tiket terkonfirmasi (simpan ke kalender .ics) · "Nggak bisa datang" → T02 state tolak · T04 Pengingat H-1 (countdown).
Panitia: P01 PIN → P03 Daftar tamu (status, cari) → P04 Kirim undangan (import CSV, template pesan, tombol Kirim WA (wa.me) / Salin link / Salin semua link) → P04b Pengingat H-1.
Case states wajib: T01e link tidak valid, T02c form belum lengkap, T02d gagal kirim (isian tidak hilang), P01b PIN salah + sisa percobaan, P01c terkunci, P04c CSV ada baris error.
```

**Definition of Done**
- [ ] Alur tamu T01→T03 jalan di HP asli, data masuk ke P03 realtime
- [ ] Semua case state F1 tampil sesuai Figma
- [ ] Link wa.me berisi pesan template dengan nama & link tamu

---

## Phase 4 — F2 Check-in tiket QR < 30 detik

```text
Phase 4: F2 (prd.md §7 F2, design.md "Tiket", Figma C5/C6).

Tamu: T05 Tiket hari-H (QR besar, kecerahan tinggi, offline dari cache) → setelah discan, HP tamu realtime menampilkan BT02 tiket sobek (animasi tear ~900 ms sesuai design.md; reduced-motion = fade) → otomatis ke layar acara.
Panitia: P05 Scan tiket (kamera tetap nyala antar scan) → P06 Valid / P06b Sudah dipakai / P06c Tidak dikenal (bottom sheet, tutup otomatis 2 dtk) · P07 Cari nama (cadangan) · tab bar Scan.
Case states: T03b tiket dibuka lagi setelah masuk (QR nonaktif), P07b kamera error → langsung Cari nama, P07c walk-in (sheet tambah tamu cepat), P07d daftar manual PDF (unduh, cetak H-1).
Offline: check-in panitia diantrikan lalu sinkron; QR & tiket tamu tersedia offline.
Ukur waktu dari scan sampai tiket sobek di HP tamu.
```

**Definition of Done**
- [ ] Median scan→sobek < 10 dtk di jaringan normal; check-in idempoten (scan dobel = "Sudah dipakai")
- [ ] Mode pesawat di HP panitia: check-in tetap tercatat lalu sinkron
- [ ] PDF daftar manual bisa diunduh

---

## Phase 5 — F3 + F4 Mode acara realtime (inti Konsep B)

```text
Phase 5: F3 & F4 (prd.md §6 model state, §7 F3/F4, Figma C1/C2/C11).

Event state global (mode pre/jeda/sesi/closed, activeSession, nextSession) di-push realtime ke semua HP tamu (≤ 3 dtk, fallback polling 5–10 dtk).
Panitia: BP01 Kontrol acara (Mulai {sesi}) → toast "Batalkan" 5 dtk → BP02 Sesi berjalan (timer, PIC, berikutnya) → BP03 Konfirmasi selesai ("Selesai & mulai {berikutnya}" / "Selesai aja, tamu ke Jeda") → BP04 Semua sesi selesai → Tutup acara (konfirmasi BP04b).
Tamu: BT03 Jeda (countdown, tile Rundown/Peserta/Foto) · BT04 Rundown read-only · BT08 Sesi talkshow (input pertanyaan) · BT11 Sesi info · BT10 Jeda berikutnya · S01 banner sinyal lemah + jadwal terakhir.
Case states: BT03b countdown habis "Sebentar lagi mulai", BP02b toast "Diubah oleh panitia lain", BP02c timer merah "lewat N menit" (tidak memaksa selesai).
Rundown bisa diedit panitia (urutan, jam, tipe, PIC).
```

**Definition of Done**
- [ ] 5 HP terbuka bersamaan pindah JEDA→SESI dalam ≤ 3 dtk setelah Mulai
- [ ] Tamu yang baru buka langsung mendarat di mode aktif
- [ ] Panitia pindah ke bagian berikutnya ≤ 3 tap

---

## Phase 6 — F5 Penutupan: buku tamu & kolase

```text
Phase 6: F5 (prd.md §7 F5, Figma C1/C9/C12/C14/C16).

Tamu: BT12 Acara selesai → T14 Buku tamu (rating, bagian paling seru, satu hal diperbaiki, mau diundang lagi) → T15 Kolase kulkas (masonry 2 kolom gaya Pinterest, filter Semua/Fotoku/per sesi) → T15b Detail foto (Simpan foto, Hapus via tombol destruktif bulat merah, hanya foto sendiri & sebelum acara ditutup).
Panitia: P11 Rekap buku tamu (stat, bar bagian paling seru, ringkasan Claude, unduh CSV).
Case states: T14b gagal kirim (jawaban tetap), T15c simpan kolase 9:16 (generate gambar story di client/server), T15d kolase kosong, P11b Claude gagal (angka & jawaban tetap tampil), P11c belum ada feedback.
```

**Definition of Done**
- [ ] Tutup acara → semua HP tamu ke BT12/T14
- [ ] Gambar kolase 9:16 bisa disimpan di iOS & Android
- [ ] Rekap P11 benar dengan data dummy

---

## Phase 7 — Nilai tambah: N1–N4

```text
Phase 7: N1–N4 (prd.md §7). Panggilan Claude hanya dari server, API key di env, ada timeout & fallback.

N1 Pertanyaan talkshow: BT08 kirim (tampil nama, opsi anonim) → P10 dikelompokkan Claude, tandai dijawab. Fallback P10b daftar mentah urut waktu, P10c kosong.
N2 Naskah MC: P09 dari BP02 per bagian, nama & jam diambil dari data (bukan digenerate). Naskah disiapkan & di-review sebelum hari-H, disimpan; P09b pakai naskah tersimpan kalau Claude/sinyal gagal. Mode baca: ukuran teks, gulir otomatis.
N3 Kenalan: BT05 Peserta (cari, baru datang) → T11b lihat kartu (chip skill/asbun dari T02b) → T11 edit kartu sendiri. Case: BT05b cari nggak ketemu, BT05c baru sedikit yang datang.
N4 Kulkas polaroid: BT06 kamera (frame polaroid) → BT07 foto masuk kolase, kompres sebelum upload, antre saat offline (BT07b), BT06b izin kamera ditolak + cara menyalakan.
Kerjakan berurutan N1 > N2 > N4 > N3; berhenti dan lapor kalau waktu habis.
```

**Definition of Done**
- [ ] Claude mati/timeout → tidak ada layar kosong
- [ ] Foto terkompres (< 500 KB) dan muncul di kolase semua tamu
- [ ] Tidak ada nama/jam yang dikarang Claude di naskah

---

## Phase 8 — Hardening: offline, PWA, a11y, performa

```text
Phase 8: hardening (prd.md §9, design.md §5–§8).

1. Service worker: cache shell, tiket/QR, rundown, mode terakhir; antrian sinkron untuk check-in, pertanyaan, foto, feedback.
2. Audit semua case state di "Screen Flow · All Case" Figma: setiap kartu case harus punya layar yang bisa dipicu (buat halaman /dev/states untuk preview cepat).
3. Aksesibilitas: kontras, fokus, label aria, target 44px, reduced motion. Lighthouse mobile ≥ 90 untuk Performance & Accessibility di halaman tamu.
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
Referensi: prd.md [§...], design.md [§...], Figma node [id] (pakai Figma MCP untuk screenshot & ukuran).
Batasan: jangan ubah komponen di luar [daftar file]. Pakai komponen di components/ui.
Selesai kalau: [kriteria terima]. Laporkan file yang diubah + cara aku cek di HP.
```
