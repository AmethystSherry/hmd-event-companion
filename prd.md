# PRD — HMD Event Companion · Konsep B "Satu Layar, Dua Mode"

**Tim B** (Gema · Gilang · Alfin · Fawaz) · Potara Hackathon · v0.2 · 22 Okt 2026
Sumber: Buku Panduan Potara Hackathon, Screen Spec v0.1 (15 Okt), Figma "DOKSLI SAPI", Deliverables F1 (22 Okt).
**Sumber kebenaran alur & layar (per 21 Okt): section [“Screen Flow · All Case”](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4655-2704) → “All Case Flow · v1” (`4665:3650`).** Untuk F1: band [All Case Flow · F1](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4732-12593) (`4732:12593`); layar full-size di halaman Archive (C12, C16). Kalau tabel screen di PRD ini beda dengan All Case, ikuti All Case. Section Figma lain (Finalise Alfin, Screen Flow v2, Flow v0.2, iOS B3/B4, B00/BA–BC) = referensi/arsip.
Status: draft untuk disepakati tim. Stack teknis sengaja dibiarkan terbuka (lihat §10).

> Rahasia sampai Test Day (2 Nov). Jangan dibagikan di Sharing Jumat — yang boleh dibagi hanya cara kerja dengan Claude.

### Changelog
- **v0.2 · 22 Okt — F1 direvisi** sesuai All Case Flow · F1: undangan hanya lewat **DM IG**; **nomor WA wajib** diisi tamu saat konfirmasi (dipakai untuk pengingat H-1); **T03 + T04 digabung** (tiket + countdown, varian H-1 = T03h); panitia sekarang punya **Event kamu → Home event** (PE01–PE04) dengan Rundown yang bisa diatur; **CSV sekali unggah**; status undangan & jawaban pindah ke **P04 Tamu & undangan** (P04 + P04a–f); "Salin link" dihapus; T02b sekarang = "Nggak bisa datang". Bagian yang berubah: §3, §4, §5, §7 F1, §8, §13, §14. F2–F5 belum disentuh.
- v0.1 · 18 Okt — draft awal.

---

## 1. Ringkasan

House Moving Day (HMD) adalah puncak acara pindahan kantor Potara Studio, **Minggu 8 November 2026, 13.00–17.00 WIB**, ±20 tamu (tim Potara, undangan waitlist, beberapa customer Omakase Insight). Kita membangun web app mobile yang dipakai **tamu** (undangan → check-in → ikut acara → feedback) dan **panitia/MC** (kirim undangan, check-in, jalankan rundown).

**Ide Konsep B:** di hari-H, layar tamu hanya punya dua mode — **JEDA** dan **SESI**. Tamu tidak bernavigasi; panitia yang memindahkan semua layar tamu dengan tombol **Mulai** / **Selesai** per sesi. UI sengaja minim supaya perhatian ada di ruangan dan obrolan, bukan di HP.

Sebelum dan sesudah acara memakai flow dengan metafora "Kunci Rumah Baru" (undangan → kunci QR → buku tamu → kolase kulkas polaroid).

## 2. Tujuan & metrik sukses

| Tujuan | Metrik | Kaitan penilaian |
|---|---|---|
| Lolos semua fitur wajib di Test Day | F1–F5 masing-masing **berfungsi penuh** oleh 5 penguji tanpa dipandu | Objective 30 (6 poin/fitur) |
| Satu ide jelas dari undangan sampai pulang | Juri bisa menceritakan ulang konsep dalam 1 kalimat ("HP-nya ngikutin acara sendiri") | Konsep 35 |
| Terasa produk jadi & sesuai brand | Warna/font brand konsisten, semua state (kosong, error, offline) didesain | Craft 20 |
| Pitch interaktif 7 menit | Juri ikut menekan **Mulai** dan melihat HP mereka sendiri berpindah ke SESI | Pitch 15 |
| Check-in cepat | Median < 10 dtk, maksimum < 30 dtk dari tamu menunjukkan tiket sampai tiket "sobek" di HP tamu | F2 |
| Panitia tidak bingung | Pindah ke bagian rundown berikutnya ≤ 3 tap, tanpa salah | F3 |

## 3. Pengguna & peran

| Peran | Akses | Kebutuhan utama |
|---|---|---|
| **Tamu** | Link unik per tamu (token) yang dikirim lewat **DM IG**, tanpa login, tanpa install | Konfirmasi (isi nomor WA), tahu harus ke mana & kapan, check-in cepat, ikut acara, kasih feedback |
| **Panitia** | 1 PIN acara 6 digit (P01) | Buat & atur event (detail, rundown), unggah daftar tamu, undang via DM IG, kirim pengingat H-1 via WA, check-in tamu (cadangan), pantau kehadiran, kontrol sesi |
| **MC / Moderator** | PIN yang sama | Naskah MC per bagian (P09), daftar pertanyaan terkelompok (P10) |

Asumsi hari-H: 1–2 HP panitia aktif bersamaan, 1 orang pemegang "Kontrol acara".

## 4. Lingkup

### In scope (wajib — semuanya harus ada)

| Kode | Fitur | Screen Konsep B |
|---|---|---|
| F1 | Undangan online + reminder H-1 | Tamu: T01 T02 T03 (+T01e T02b T02c T02d T03h) · Panitia: P01 PE01–PE04 P04 P04a–f P04k (+P01b P01c PE01a PE03b) |
| F2 | Check-in di lokasi < 30 dtk (QR tiket per tamu / cari nama) | T05 Tiket → T05a → panitia P05 P06 → BT02 Tiket sobek · cadangan P07 |
| F3 | Rundown untuk panitia: sesi berjalan, timer, PIC, berikutnya | BP01 BP02 BP03 BP04 |
| F4 | Live agenda untuk tamu: sekarang, berikutnya, pembicara | BT03 BT04 BT08 BT10 BT11 · S01 |
| F5 | Feedback setelah acara + ucapan terima kasih | BT12 → T14 T15 · P11 |

### In scope (nilai tambah)

| Kode | Fitur | Screen |
|---|---|---|
| N1 | Pertanyaan talkshow dikelompokkan Claude | BT08 BT09 → P10 |
| N2 | Naskah MC mengikuti rundown (Claude) — **di-pause** sesuai annotation | P09 (dibuka dari BP02) |
| N3 | Kenalan antartamu (kartu tetangga) | BT05 → T11 |
| N4 | Kulkas polaroid → kolase bersama | BT06 BT07 → T15 |

### Out of scope
Akun/login tamu, chat antartamu (sengaja: ketemu langsung), pembayaran, aplikasi native, pengiriman WA/DM otomatis via API (WA & DM IG dibuka manual satu per satu), galeri penuh saat hari-H (T12/T13 Konsep A tidak dipakai), layar proyektor.
Catatan: daftar event (PE01) mendukung lebih dari satu event di UI, tapi yang dibangun & diuji tetap 1 event (HMD) — lihat G14.

## 5. Alur utama

### 5.1 Tamu
```
[Pra-acara]  DM IG dari panitia (link unik) → T01 Undangan → T02 Konfirmasi (WA wajib)
             → Hadir: T03 Tiket + countdown (QR unik) · Nggak bisa datang: T02b (selesai)
             Link dibuka lagi setelah konfirmasi → langsung T03
             H-1: WA pengingat dari panitia → T03h (tiket yang sama, countdown jam)
[Hari-H]     T05 Tiket hari-H (tunjukkan ke panitia) → panitia scan P05 → P06 Valid
             → BT02 Tiket sobek di HP tamu, realtime (auto 3 dtk)
             cadangan: sebut nama → panitia P07 cari nama → BT02
             → JEDA (BT03; BT04 rundown, BT05 peserta→T11, BT06→BT07 kamera)
             ⇄ SESI (BT08/BT09 talkshow + tanya; BT11 tur/closing info saja)
             … berulang untuk 4 bagian acara …
             → BT12 Acara selesai
[Pasca]      → T14 Buku tamu → T15 Terima kasih + kolase
```

### 5.2 Panitia
```
[Persiapan]  P01 PIN → PE01 Event kamu → (PE02 Buat event: nama + tanggal) → PE03 Home event
             PE03: 3 kartu — Detail event · Tamu & undangan · Rundown
             Rundown: PE04k kosong → PE04 atur sesi → PE04a ubah/hapus
             Tamu & undangan: P04k kosong → unggah CSV → P04a cek & simpan (sekali)
             → P04 undang via DM IG (✈ per tamu) → balik ke app: P04d "Diundang" + Batalkan 5 dtk
             → pantau status di P04 (filter Belum diundang / Belum jawab / Hadir / Nggak bisa)
             Tambah/ubah tamu manual: P04f / P04e
             H-1: P04b Kirim pengingat via WA (satu-satu atau "Kirim ke semua")
[Hari-H]     Home event otomatis jadi Kontrol acara (BP01)
             BP01 Kontrol (JEDA) → [Mulai X] → BP02 Sesi berjalan (toast Batalkan 5 dtk)
             → [Selesaikan] → BP03 konfirmasi → BP01 (sesi berikutnya)
             … ×4 … → BP04 → [Tutup acara & buka buku tamu]
             Pintu: P05 scan tiket → P06 hasil (Valid / Sudah dipakai / Tidak dikenal) · cadangan P07
             Paralel: P03 daftar hadir · P10 pertanyaan · P09 naskah
[Pasca]      P11 rekap + ringkasan Claude + unduh CSV
```

## 6. Model state acara (inti Konsep B)

Satu state global per acara, di-push realtime ke semua HP tamu:

```
event.mode        : "pre" | "jeda" | "sesi" | "closed"
event.activeSession : session_id | null
event.nextSession   : session_id | null
event.updatedAt     : timestamp
session.status      : "nanti" | "berikutnya" | "berlangsung" | "selesai"
session.startedAt / endedAt
```

| Aksi panitia | Perubahan | Layar tamu |
|---|---|---|
| Mulai sesi N (BP01) | mode=sesi, active=N, N.status=berlangsung | BT08 (talkshow) / BT11 (info saja) |
| Batalkan (≤5 dtk) | kembali ke state sebelumnya | kembali ke JEDA |
| Selesaikan (BP03) | mode=jeda, N=selesai, next=N+1 | BT10 (jeda dengan sesi berikutnya) |
| Tutup acara (BP04) | mode=closed | BT12 → T14 |

Aturan: tamu yang baru check-in/membuka ulang langsung mendarat di mode yang sedang aktif. Tipe sesi menentukan layout SESI: `talkshow` (ada input pertanyaan) atau `info` (titik/daftar, tanpa input).

**Rundown default (dummy, diatur panitia di PE04):**

| # | Bagian | Jadwal | Durasi | Tipe | PIC |
|---|---|---|---|---|---|
| 01 | Pintu dibuka & open space | 13.00 | 60 mnt | info | Tim Acara |
| 02 | Talkshow (guest star menyusul) | 14.00 | 45 mnt | talkshow | Tim Acara |
| 03 | Tur kantor | 14.45 | 45 mnt | info (titik tur) | Tim Potara |
| 04 | Closing & networking | 15.30 | 90 mnt | info | TBD |

> Catatan: brief menyebut "pengenalan kantor **di dalam** talkshow". Figma menjadikannya sesi 03 terpisah (undangan T01 menulis "Tur kantor · di sela talkshow"). Model data mendukung keduanya — perlu konfirmasi ke PIC acara (lihat §13).

## 7. Kebutuhan fungsional & kriteria terima

### F1 — Undangan online & reminder H-1
Rentang: H-14 sampai H-1. Total 27 layar (11 utama + 16 case); 2 layar masih perlu didesain (lihat G15).

**Panitia · masuk & event**
- **P01** PIN 6 digit dari koordinator, tanpa akun. **P01b** PIN salah → pesan + sisa percobaan. **P01c** salah 5× → dikunci 5 menit (hitung mundur), saran tanya koordinator.
- **PE01 Event kamu**: daftar event berbentuk kartu (nama, tanggal, fase mis. "Persiapan · H-17", jumlah tamu, jumlah sesi rundown). Tap kartu → Home event. **PE01a** belum ada event → empty state + tombol Buat event.
- **PE02 Buat event** (sheet): cukup nama + tanggal; rundown & tamu diisi nanti. Field kosong → ditandai, tombol nonaktif. Batal → kembali ke PE01.
- **PE03 Home event**: 3 kartu — **Detail event** (nama & tanggal, Edit), **Tamu & undangan** (Unggah CSV / Buka), **Rundown** (Tambah). Progress "1 dari 3 siap". **PE03b** saat terisi: kartu menampilkan ringkasan (mis. "20 tamu · 13 diundang · 7 hadir · 1 nggak bisa · 4 belum jawab · 7 belum diundang", "4 sesi · 13.00–17.00").
- Hari-H: Home event **otomatis menjadi Kontrol acara (BP01)** → lanjut F3 + F4.

**Panitia · rundown**
- **PE04k** empty state: tambah sesi satu per satu (nama sesi, jam mulai, durasi, tipe Info/Talkshow, PIC).
- **PE04** daftar sesi, urutan otomatis mengikuti jam mulai. **PE04a** ubah/hapus sesi; perubahan langsung terlihat di layar tamu.
- Sesi Talkshow memunculkan kolom pertanyaan di HP tamu; PIC tampil di Kontrol acara.

**Panitia · tamu & undangan**
- **P04k** belum ada tamu → "Pilih file CSV" + daftar kolom + "Unduh contoh CSV". Kolom: `nama` (wajib), `ig` (wajib, untuk buka DM), `pesan` (opsional, template DM; kosong → default), `wa` (opsional; tamu isi sendiri saat konfirmasi).
- **P04a Cek & simpan (sekali)**: ringkasan "20 baris · 0 error · semua punya IG", status per kolom, preview template DM (`{nama}` `{link}` diisi otomatis). **CSV hanya bisa diunggah sekali**; setelah disimpan tombol Unggah CSV hilang, tambah/ubah tamu manual supaya status undangan tidak ter-reset. Batal sebelum simpan → CSV tidak tersimpan.
- **P04c** baris error ditandai per baris (nama kosong, IG dobel, format WA salah, IG kosong/salah format → "Cek IG"); bisa lanjut dengan baris yang aman, baris error diperbaiki nanti.
- Tiap tamu dapat **link unik bertoken** (tidak bisa ditebak, ≥ 16 karakter acak). Satu link = satu tamu.
- **P04 Tamu & undangan**: penghitung "x/20 diundang", template DM, daftar tamu dengan status undangan (Belum diundang / Diundang) + jawaban (Hadir / Nggak bisa / Belum jawab), filter chip (Semua · Belum diundang · Belum jawab · Hadir · Nggak bisa). Tombol ✎ dan ✈ di tiap baris sama besar (36×36).
- **Undang via DM IG (✈)**: template disalin otomatis ke clipboard + DM IG tamu dibuka (app IG; kalau gagal → `instagram.com/{ig}` di browser, template tetap tersalin). Tidak ada CTA "Undang berikutnya".
- **P04d** balik dari IG → status otomatis "Diundang" + toast di bawah "Template udah disalin…" dengan **Batalkan 5 dtk** (IG tidak bisa mengonfirmasi DM terkirim).
- Belum jawab → filter "Belum jawab" → ↻ Undang lagi. Akun IG tidak ketemu → ubah username via ✎ lalu undang lagi.
- **P04f Tambah tamu manual** (nama, username IG, WA opsional) → masuk sebagai "Belum diundang". **P04e Ubah/hapus tamu**: status undangan & jawaban tetap, tidak ter-reset.

**Tamu**
- **T01 Undangan** (dari link DM IG): nama tamu, tanggal, jam, lokasi, 4 bagian acara, syarat follow @potarastudio. **T01e** link salah/kedaluwarsa/milik orang lain → "Link-nya nggak valid", arahkan buka ulang dari pesan atau hubungi panitia. Sudah pernah konfirmasi → link langsung membuka T03.
- **T02 Konfirmasi**: nama (terisi dari CSV), Instagram (wajib), **Nomor WhatsApp (wajib — "buat kirim pengingat H-1 lewat WA")**, checkbox "Saya sudah follow @potarastudio" (wajib, syarat hadir), pilihan Hadir / Nggak bisa datang; teks privasi (dihapus 30 hari setelah acara). Tidak ada lagi opsi "Salin link" atau "Tanpa WA".
- **T02c** form belum lengkap → kolom kosong ditandai, tombol Konfirmasi nonaktif. **T02d** gagal kirim (sinyal) → pesan + Coba lagi, isian tidak hilang.
- **T02b Nggak bisa datang**: "Makasih udah ngabarin" — tidak dapat tiket & tidak dikirimi pengingat H-1; bisa ubah jawaban; ajakan follow @potarastudio. Alur berhenti di sini.
- **T03 Tiket + countdown** (gabungan T03 & T04 lama): tiket digital bergaya tiket fisik (nama, nomor kunci, tanggal, jam, lokasi, syarat follow, QR unik + kode pendek) + countdown "Pintu dibuka dalam 17 hari 4 jam". "Simpan ke kalender" (.ics). Tiket & QR tetap tampil offline (cache). Jawaban langsung masuk ke P04 panitia.
- **T03h** dibuka dari WA pengingat H-1 → tiket yang sama, countdown dalam jam ("18 jam 42 menit").
- Yang hadir lanjut ke F2 di hari-H.

**Panitia · pengingat H-1**
- **P04b Kirim pengingat H-1**: daftar tamu yang konfirmasi hadir (mis. 17), template pesan WA (`{nama}` `{link}`), tombol per tamu dengan ikon WhatsApp **"Kirim WA"** (buka `wa.me` dengan pesan terisi), dan **"Kirim ke semua · N belum"**: WA terbuka bergantian, balik ke app otomatis lanjut ke tamu berikutnya; panitia tetap tap kirim di WA (tanpa API).
- Tamu "Nggak bisa" tidak ikut dikirimi. Nomor WA salah/tidak aktif → ubah via ✎ di P04e lalu kirim lagi.

**Kriteria terima**
- ✅ CSV dummy 20 baris tersimpan tanpa error; unggah ulang tidak bisa.
- ✅ Link tamu dari DM membuka T01 dengan nama yang benar; link acak → T01e.
- ✅ Konfirmasi Hadir (dengan WA) → T03 tampil, status di P04 langsung berubah jadi Hadir.
- ✅ Pengingat H-1 membuka WA dengan pesan & link terisi, link membuka T03h.

### F2 — Check-in < 30 detik (tiket QR per tamu, panitia yang scan)
Keputusan 18 Okt: **QR pintu (BT01) dihapus.** Setiap tamu punya tiket dengan QR unik; panitia yang memindai. Tamu tidak perlu membuka kamera atau memberi izin apa pun.

**Tiket & QR**
- Tiap tamu yang konfirmasi hadir mendapat 1 tiket: `ticketId` + **QR unik** + kode pendek yang bisa dibaca manusia (mis. `HMD-014-7F3K`).
- Isi QR hanya `ticketId` + tanda tangan (HMAC dari server), **tanpa data pribadi**. QR palsu/acak → "Tidak dikenal".
- Tiket **sekali pakai**: setelah valid, status `checked_in` + jam + metode (`scan` / `manual`).
- Tiket ter-cache di HP tamu (service worker), jadi tetap bisa ditunjukkan tanpa sinyal.

**Alur di pintu**
1. Tamu membuka **T05 Tiket hari-H** (dari link WA / H-1). Kecerahan layar dinaikkan, badge "Belum masuk".
2. Panitia membuka **P05 Scan tiket** (tab Scan). Kamera langsung aktif, penghitung "9/20 masuk".
3. Scan → server memvalidasi → **P06** sheet hasil, tutup otomatis 2 dtk, kamera tetap jalan:
   - **Valid**: nama, nomor kunci, IG, "tamu ke-9". Haptic + bunyi pendek.
   - **Sudah dipakai**: "Masuk 13.04 lewat scan" (kuning), tidak menambah hitungan.
   - **Tidak dikenal / bukan acara ini**: merah, saran "Cari nama".
4. Begitu valid, HP tamu menerima event realtime → **tiket sobek** (animasi potongan QR terlepas dan jatuh) → **BT02** "Selamat datang di rumah baru" dengan cap "Masuk 13.04 · tamu ke-9" → otomatis ke JEDA dalam 3 dtk.
5. Tiket yang sudah sobek tetap bisa dibuka (sebagai bukti), tanpa QR aktif.

**Cadangan**
- Tamu lupa / HP mati / QR tidak terbaca: panitia **P07 Cari nama** (nama, IG, atau kode pendek) → Check-in manual. Tiket di HP tamu tetap sobek saat online.
- Panitia offline: validasi lokal dari daftar tiket yang sudah diunduh (cek tanda tangan + status lokal), check-in diantrikan dan disinkron. Konflik dua HP panitia → yang pertama menang, yang kedua tampil "Sudah dipakai".
- HP tamu offline saat discan: check-in tetap tercatat di panitia; tiket sobek saat HP tamu kembali online.
- "Unduh daftar manual (PDF)" berisi nama + kode pendek untuk centang di kertas.

**Kriteria terima**
- ✅ 5 penguji masuk masing-masing < 30 dtk (target median < 10 dtk dari tiket ditunjukkan sampai sobek).
- ✅ Scan kedua tiket yang sama → "Sudah dipakai", hitungan tidak bertambah.
- ✅ QR acak → "Tidak dikenal".
- ✅ P07 berjalan dengan mode pesawat.

### F3 — Rundown panitia
- **BP01** menampilkan: mode layar tamu sekarang, statistik (check-in x/20, foto, pertanyaan), daftar 4 bagian + status + jam + **PIC**, tombol besar "Mulai {sesi berikutnya}".
- **BP02**: timer berjalan (mm:ss / durasi rencana), progress bar, sisa waktu + sesi berikutnya, jumlah pertanyaan → P10, naskah MC → P09, tombol "Selesaikan sesi". Toast "Batalkan" dengan hitung mundur 5 dtk setelah Mulai.
- **BP03** bottom sheet konfirmasi (durasi, jumlah pertanyaan) — Ya, selesaikan / Batal.
- **BP04** setelah sesi terakhir: "Tutup acara & buka buku tamu".
- Timer lewat durasi → tampil merah/"lewat 3 menit", tidak memaksa selesai.
- Hanya 1 perangkat yang menekan Mulai/Selesai pada satu waktu; perangkat lain melihat state yang sama realtime (konflik: aksi terakhir menang + toast "Diubah oleh panitia lain").
- ✅ Diterima jika: penguji panitia bisa memindahkan ke bagian berikutnya tanpa dipandu dan HP tamu ikut berpindah ≤ 3 dtk.

### F4 — Live agenda tamu
- **JEDA (BT03/BT10):** sesi berikutnya (judul, ruang, deskripsi, pembicara) + countdown menit; info jeda kontekstual; tile Rundown (x dari 4 selesai) dan Peserta (jumlah di dalam + avatar); tombol kamera kolase.
- **BT04** rundown read-only, status mengikuti panitia; catatan "Jadwal bisa geser. Layarmu otomatis ikut panitia."
- **SESI (BT08/BT11):** label LIVE, judul, ruang, pembicara/moderator, jam mulai, sisa waktu + progress.
- Countdown habis tapi panitia belum Mulai → teks "Sebentar lagi mulai" (bukan angka negatif).
- **S01 offline:** banner "Sinyal lagi lemah · Menampilkan agenda terakhir (jam)"; mode terakhir + rundown + QR dari cache; sinkron otomatis.
- ✅ Diterima jika: penguji tamu bisa menjawab "sedang apa sekarang, berikutnya apa, siapa pembicaranya" dari layar.

### F5 — Feedback + terima kasih
- **BT12** muncul saat panitia tutup acara: ringkasan (foto, pertanyaan, tamu), preview kolase, CTA "Isi buku tamu".
- **T14** ±1 menit: rating (lihat §13 — perlu ditambah), bagian paling seru (pilih), satu hal yang bisa diperbaiki (opsional), mau diundang lagi. Bisa juga dibuka dari link di pesan terima kasih WA.
- **T15** ucapan terima kasih personal + kolase (simpan sebagai gambar 9:16 untuk story) + "Follow @potarastudio".
- **P11** rata-rata rating, jumlah pengisi, distribusi "paling seru", ringkasan Claude 3 poin, unduh CSV.
- ✅ Diterima jika: feedback penguji tampil di P11 dalam < 10 dtk setelah submit.

### N1 — Pertanyaan talkshow (Claude)
- Input di BT08 hanya saat sesi tipe talkshow; tampil sebagai nama tamu (opsi anonim: TBD). Tamu bisa kirim > 1.
- **BT09** konfirmasi di layar yang sama + "dikelompokkan bareng N pertanyaan mirip".
- **P10**: Claude mengelompokkan per tema + 1 pertanyaan perwakilan; moderator "Tandai dijawab". Pengelompokan ulang tiap ±5 pertanyaan baru atau via tombol.
- Gagal panggil Claude → tampilkan daftar mentah urut waktu (tidak boleh blank).

### N2 — Naskah MC (Claude) · di-pause
- Status 22 Okt: **di-pause** sesuai annotation Figma; tidak dikerjakan sampai diputuskan lagi.
- Dibuat dari rundown + nama pembicara per transisi; mode teleprompter (ukuran huruf, gulir otomatis, tulis ulang).
- Mengikuti sesi aktif/berikutnya dari state acara (bukan tombol "Lanjut" P08).
- Naskah di-generate & dicek manusia **sebelum hari-H**, disimpan statis; regenerasi hari-H opsional. Peringatan "Selalu cek nama & jam".

### N3 — Kenalan (kartu tetangga)
- **BT05** daftar tamu yang sudah check-in (terbaru di atas), cari nama/IG. Tap → **T11** (lihat).
- Tamu bisa membuat/mengubah kartunya sendiri (peran, maks. 3 "Potensi skill", maks. 3 "Potensi asbun", toggle tampilkan IG) dan melepasnya kapan saja. Sejak v0.2 kartu **tidak lagi diisi saat konfirmasi** (T02b lama "Kenalan dikit" dihapus dari F1) — diisi di T11 saat hari-H (lihat G19).
- Tanpa chat.

### N4 — Kulkas polaroid → kolase
- **BT06** kamera dengan frame polaroid (nama + tanggal); 1 jepret = 1 foto. **BT07** konfirmasi + "Foto lagi" / "Kembali ke jeda".
- Foto dikompres di perangkat (≤ 400 KB); bisa dihapus pemiliknya sampai acara ditutup.
- **T15** kolase otomatis dari semua foto.

## 8. Data & privasi

| Entitas | Field | Catatan |
|---|---|---|
| Event | id, nama, tanggal, csvImportedAt | Dibuat di PE02; `csvImportedAt` terisi → unggah CSV dikunci |
| Guest | id, eventId, token, nama, ig, wa, dmTemplate?, inviteStatus (belum/diundang), invitedAt, rsvp (belum/hadir/nggak), followConfirmed, keyNo, reminderSentAt, source (csv/manual) | WA wajib diisi tamu saat konfirmasi (boleh terisi dari CSV) |
| Ticket | ticketId, guestId, shortCode, qrSig, status (aktif/dipakai), checkedInAt, checkedInBy, method (scan/manual) | QR = ticketId + tanda tangan, tanpa data pribadi |
| Profile card | guestId, peran, skills[≤3], asbun[≤3], showIg | Opsional; diisi di T11 |
| Session | id, eventId, urutan, judul, ruang, tipe, jadwal, durasi, pembicara, PIC, status, startedAt, endedAt, titik[] | Diatur di PE04; urutan = jam mulai |
| Event state | mode, activeSession, nextSession, updatedAt | 1 baris per event |
| Question | id, guestId, sessionId, teks, clusterId, answered | |
| Photo | id, guestId, url, createdAt, deleted | |
| Feedback | guestId, rating, favoritePart, improvement?, inviteAgain | |
| Script | sessionId, teks, generatedAt, reviewed | |

- Hanya data minimal (nama, IG, WA). Tidak ada email/alamat. WA hanya dipakai untuk pengingat H-1 (perlu dicek dari sisi privasi — G16).
- **Hapus otomatis 8 Desember 2026** (H+30): data tamu, foto, pertanyaan, feedback per orang. Rekap agregat boleh disimpan tanpa identitas.
- **Sebelum Test Day hanya CSV dummy.** Jangan memasukkan data asli/password ke percakapan Claude.
- Token di URL → jangan dibagikan; halaman tamu `noindex`.

## 9. Kebutuhan non-fungsional

| Area | Kebutuhan |
|---|---|
| Platform | Web mobile (target 390×844), jalan di Safari iOS & Chrome Android terbaru, tanpa install. Bisa "Add to Home Screen" (opsional). |
| Bahasa | Semua copy tamu Bahasa Indonesia santai (lihat design.md). |
| Brand | Ink #101010, Orange Splash #F95B00, Amber #FFA101; logo tanpa efek. Light sebagai tampilan utama + Dark, font Switzer (text style Clean/*; detail di design.md & All Case Flow). |
| Realtime | Perubahan mode sampai ke HP tamu ≤ 3 dtk (target ≤ 1 dtk) di jaringan normal; fallback polling 5–10 dtk. |
| Offline | QR, rundown, mode terakhir ter-cache; check-in panitia diantrikan & disinkron; daftar manual PDF. |
| Performa | First load < 3 dtk di 4G; bundle halaman tamu kecil; foto dikompres. |
| Keandalan | Idempoten untuk check-in & submit; tidak ada layar kosong saat Claude/API gagal. |
| Aksesibilitas | Kontras teks ≥ 4.5:1, target sentuh ≥ 44px, mendukung reduced motion. |
| Keamanan | Token acak, PIN panitia di server, rate-limit PIN (5× salah → kunci 5 menit). |
| Kapasitas | 20 tamu + panitia (desain aman sampai 50). |

## 10. Stack (terbuka)

Belum diputuskan. Syarat apa pun pilihannya: (1) gratis atau sudah dimiliki studio — **tidak beli/langganan baru**, (2) mendukung realtime/pub-sub atau polling cepat, (3) bisa caching offline (service worker), (4) hosting dengan URL publik, (5) bisa memanggil Claude untuk N1/N2/P11 (atau proses dijalankan manual oleh panitia lewat Claude lalu hasilnya ditempel), (6) ≥ 70% pekerjaan dibuat dengan Claude.

Keputusan dibutuhkan paling lambat **Selasa 20 Okt** (lihat §12).

## 11. Kesiapan Test Day & submission

**Skenario penguji (2 Nov) → jalur di produk kita:**

| Tugas penguji | Jalur | Perhatian |
|---|---|---|
| Tamu: buka link konfirmasi | T01 → T02 → T03 | Link harus jelas dari pesan DM; penguji wajib isi nomor WA |
| Tamu: check-in | T05 tunjukkan tiket → panitia P05 → BT02 tiket sobek | Butuh 1 orang tim/PIC memegang HP panitia di pintu; penguji tamu cukup menunjukkan tiket |
| Tamu: lihat agenda | BT03 → tile Rundown (BT04) | Tile harus jelas tappable |
| Tamu: isi feedback | BT12 → T14 → T15 | Panitia harus menutup acara, atau link langsung T14 |
| Panitia: pindah ke bagian berikutnya | BP02 Selesaikan → BP03 → BP01 Mulai | Butuh 2 aksi; lihat risiko R2 |
| Panitia: cek siapa yang hadir | BP01 stat "18/20 check-in" → P03 | Stat harus tappable ke P03 |

**Submission (Jumat 30 Okt, 17.00 — setelahnya produk dibekukan):** link produk, video demo ≤ 60 dtk, satu halaman cara pakai (tamu + panitia + rencana cadangan sinyal mati).

**Pitch (3 Nov, 7 menit):** buka konsep → juri scan undangan di HP sendiri → juri tekan "Mulai Talkshow" dan melihat semua HP berpindah → kirim pertanyaan → tunjukkan P10 terkelompok → cara pakai + rencana cadangan offline. Semua anggota tim bicara.

## 12. Milestone

| Tanggal | Target |
|---|---|
| Min 18 Okt | PRD & design.md disepakati |
| Sel 20 Okt | Keputusan stack · gap Figma ditutup (§13) · design token final |
| Kam 22 Okt | Desain F1 lengkap di All Case Flow (deliverables F1) — review tim |
| Jum 23 Okt | F1 + F2 berjalan end-to-end dengan data dummy · Sharing #2 |
| Sen 26 Okt | F3 + F4 realtime (mode JEDA/SESI) · offline cache |
| Rab 28 Okt | F5 + N1 + N2 (Claude) · N3/N4 jika sempat · "NGODE" day |
| Kam 29 Okt | Uji internal 5 orang dengan skenario Test Day, perbaikan bug, polishing motion |
| Jum 30 Okt 12.00 | Freeze fitur; rekam video, tulis halaman cara pakai |
| Jum 30 Okt 17.00 | **Submit** |

Prioritas jika waktu kurang: F1–F5 > N1 > N4 > N3 > N2 (N2 di-pause).

## 13. Gap & pertanyaan terbuka (dari review Figma)

| # | Temuan | Usulan |
|---|---|---|
| G1 | ✔︎ T05 & S01 masih memakai tab bar Konsep A | Selesai di Flow v0.2: T05 Kunciku, S01 = banner offline di atas Jeda |
| G2 | ✔︎ Navigasi panitia di Konsep B belum didefinisikan | Selesai di v0.2: tab bar **Kontrol · Tamu · Scan · Tanya** |
| G3 | ~~T14 tanpa rating~~ — salah baca, T14 sudah punya rating bintang | Tidak perlu tindakan |
| G4 | ✔︎ Caption & copy merujuk P08 / kode screen di UI | Selesai di v0.2 (copy BP01–BP04 tanpa kode screen) |
| G5 | Brief: pengenalan kantor di dalam talkshow; Figma: sesi 03 terpisah | Konfirmasi ke PIC; rundown dibuat bisa diedit (PE04) |
| G6 | State hasil scan: Valid / Sudah dipakai / Tidak dikenal | Didesain di P06 (Clean v0.5, C5) |
| G7 | Tamu walk-in / belum konfirmasi saat datang | Panitia tambah tamu cepat dari P03/P07 (pra-acara: P04f) |
| G8 | Copy BT06 "bisa dihapus" tapi tidak ada UI hapus foto | Tambah "Foto saya" + hapus |
| G9 | ✔︎ T11 hanya mode edit | Selesai di v0.2: T11b (lihat) + entry di BT05 |
| G10 | Status amber di P06 bentrok dengan aksen panitia (Amber) | Token status terpisah |
| G11 | ~~QR pintu sebagai aset cetak~~ | Tidak perlu lagi: QR ada di tiket tiap tamu |
| G12 | Pertanyaan tampil nama atau anonim? | Putuskan; default tampil nama + opsi anonim |
| G13 | ✔︎ Font: Switzer | Terpasang; semua layar pakai text style Clean/* |
| G14 | F1 punya daftar event (PE01) & Buat event (PE02), padahal multi-acara sebelumnya out of scope | Setuju UI multi-event, tapi build & uji 1 event (HMD); event lain cukup data dummy |
| G15 | Belum didesain: **Edit nama & tanggal event** (sheet "Ubah event", sama seperti Buat event) dan **Hapus event** (konfirmasi, semua data ikut terhapus) | Desain sebelum handoff |
| G16 | Nomor WA wajib di T02 | Perlu dicek dari sisi privasi; copy sudah menjelaskan tujuannya (pengingat H-1) |
| G17 | "Kirim ke semua" tetap manual — panitia tap kirim ~17 chat WA | Konfirmasi panitia sanggup; uji alur balik-ke-app otomatis lanjut tamu berikutnya |
| G18 | DM bisa masuk folder "Permintaan pesan" untuk tamu yang belum follow @potarastudio | Putuskan perlu copy pengingat "follow dulu" atau follow-up panitia |
| G19 | T02b lama "Kenalan dikit" (skill/asbun) hilang dari F1 | Pastikan kartu tetangga cukup diisi di T11 (N3), atau tambahkan lagi setelah T03 |
| G20 | Header T03 "Terkonfirmasi · link ini juga dikirim lewat WA" — tidak ada pengiriman WA otomatis saat konfirmasi | Ubah copy, atau jelaskan link baru dikirim lewat WA saat H-1 |
| G21 | Status "Diundang" diset saat panitia balik ke app (P04d), bukan bukti DM terkirim | Diterima; ada Undo 5 dtk + bisa ↻ Undang lagi |

## 14. Risiko & mitigasi

| # | Risiko | Mitigasi |
|---|---|---|
| R1 | Tim tanpa developer → implementasi realtime/offline tersendat | Putuskan stack paling sederhana 20 Okt; build dengan Claude per modul kecil; fallback polling |
| R2 | Penguji panitia mencari tombol "Berikutnya" sementara Konsep B butuh Selesai → Mulai | BP03 primer "Selesai & mulai {berikutnya}" (sudah di Figma v0.2); label tombol selalu menyebut nama sesi |
| R3 | Antrean di pintu kalau banyak tamu datang bersamaan | Scan panitia ±2 dtk per tamu; bisa 2 HP panitia sekaligus; kamera tetap aktif antar-scan; cadangan P07 |
| R4 | Sinyal di kantor baru lemah | Cache, antrian sinkron, PDF manual, uji di lokasi saat gladi |
| R5 | Teks Claude salah nama/jam | Naskah di-review sebelum hari-H; jam & nama diambil dari data, bukan digenerate |
| R6 | Tombol Mulai kepencet | Toast Batalkan 5 dtk; Selesai pakai konfirmasi |
| R7 | Lupa freeze → skor Test Day 0 | Freeze 30 Okt 17.00, tag versi, tidak ada deploy setelahnya |
| R8 | Undangan DM IG tidak terbaca (masuk "Permintaan pesan") atau app IG tidak terbuka | Fallback `instagram.com/{ig}`, template tetap tersalin, filter "Belum jawab" + Undang lagi; pertimbangkan copy follow dulu (G18) |
| R9 | CSV salah tapi sudah tersimpan (tidak bisa unggah ulang) | P04a wajib cek sebelum simpan; perbaikan lewat P04e/P04f |
