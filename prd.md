# PRD — HMD Event Companion · Konsep B "Satu Layar, Dua Mode"

**Tim B** (Gema · Gilang · Alfin · Fawaz) · Potara Hackathon · v0.1 · 18 Okt 2026
Sumber: Buku Panduan Potara Hackathon, Screen Spec v0.1 (15 Okt), Figma "DOKSLI SAPI" (frame B00, section BA/BB/BC + screen Konsep A yang dipakai ulang).
Status: draft untuk disepakati tim. Stack teknis sengaja dibiarkan terbuka (lihat §10).

> Rahasia sampai Test Day (2 Nov). Jangan dibagikan di Sharing Jumat — yang boleh dibagi hanya cara kerja dengan Claude.

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
| **Tamu** | Link unik per tamu (token), tanpa login, tanpa install | Konfirmasi, tahu harus ke mana & kapan, check-in cepat, ikut acara, kasih feedback |
| **Panitia** | 1 PIN acara 6 digit (P01) | Import & kirim undangan, check-in tamu (cadangan), pantau kehadiran, kontrol sesi |
| **MC / Moderator** | PIN yang sama | Naskah MC per bagian (P09), daftar pertanyaan terkelompok (P10) |

Asumsi hari-H: 1–2 HP panitia aktif bersamaan, 1 orang pemegang "Kontrol acara".

## 4. Lingkup

### In scope (wajib — semuanya harus ada)

| Kode | Fitur | Screen Konsep B |
|---|---|---|
| F1 | Undangan online + reminder H-1 | T01 T02 T03 T04 · P01 P03 P04 |
| F2 | Check-in di lokasi < 30 dtk (QR tiket per tamu / cari nama) | T05 Tiket → panitia P05 P06 → BT02 Tiket sobek · cadangan P07 |
| F3 | Rundown untuk panitia: sesi berjalan, timer, PIC, berikutnya | BP01 BP02 BP03 BP04 |
| F4 | Live agenda untuk tamu: sekarang, berikutnya, pembicara | BT03 BT04 BT08 BT10 BT11 · S01 |
| F5 | Feedback setelah acara + ucapan terima kasih | BT12 → T14 T15 · P11 |

### In scope (nilai tambah)

| Kode | Fitur | Screen |
|---|---|---|
| N1 | Pertanyaan talkshow dikelompokkan Claude | BT08 BT09 → P10 |
| N2 | Naskah MC mengikuti rundown (Claude) | P09 (dibuka dari BP02) |
| N3 | Kenalan antartamu (kartu tetangga) | BT05 → T11 |
| N4 | Kulkas polaroid → kolase bersama | BT06 BT07 → T15 |

### Out of scope
Akun/login tamu, chat antartamu (sengaja: ketemu langsung), pembayaran, aplikasi native, multi-acara, pengiriman WA otomatis via API (kirim manual sesuai brief), galeri penuh saat hari-H (T12/T13 Konsep A tidak dipakai), layar proyektor.

## 5. Alur utama

### 5.1 Tamu
```
[Pra-acara]  WA dari panitia → T01 Undangan → T02 Konfirmasi → T03 Tiket (QR unik per tamu)
             H-1: WA pengingat → T04 (countdown + "Buka tiketku")
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
[Persiapan]  P01 PIN → P04 Import CSV → kirim WA per tamu → pantau P03
             H-1: kirim pengingat dari P04 ("Pengingat H-1 →")
[Hari-H]     BP01 Kontrol (JEDA) → [Mulai X] → BP02 Sesi berjalan (toast Batalkan 5 dtk)
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

**Rundown default (dummy, bisa diubah panitia):**

| # | Bagian | Jadwal | Tipe | PIC |
|---|---|---|---|---|
| 01 | Pintu dibuka & open space | 13.00 | info | TBD |
| 02 | Talkshow (guest star menyusul) | 14.00 | talkshow | TBD |
| 03 | Tur kantor | 14.45 | info (titik tur) | TBD |
| 04 | Closing & networking | 15.30 | info | TBD |

> Catatan: brief menyebut "pengenalan kantor **di dalam** talkshow". Figma menjadikannya sesi 03 terpisah. Model data mendukung keduanya — perlu konfirmasi ke PIC acara (lihat §13).

## 7. Kebutuhan fungsional & kriteria terima

### F1 — Undangan online & reminder H-1
- **P04** import CSV kolom `nama, ig, wa(opsional)`; validasi baris (kosong, duplikat IG, format WA) dan ringkasan "20 baris · 0 error · 3 tanpa nomor WA".
- Tiap tamu dapat **link unik bertoken** (tidak bisa ditebak, ≥ 16 karakter acak).
- Template pesan dengan variabel `{nama}` `{link}`; tombol **Kirim WA** membuka `wa.me` dengan pesan terisi; tanpa nomor → **Salin link** (untuk DM IG). "Salin semua link" tersedia.
- Status kirim per tamu ditandai manual (Terkirim / Belum).
- **T01** menampilkan nama, tanggal, jam, lokasi, 4 bagian acara, syarat follow @potarastudio.
- **T02** nama terisi dari CSV, IG wajib, WA opsional, checkbox "sudah follow", pilihan Hadir / Tidak bisa datang; teks privasi (hapus 30 hari).
- **T02b Kenalan dikit (opsional, bisa dilewati)**: tamu memilih/menambah **Potensi skill** (hal yang dia jago, maks. 3) dan **Potensi asbun** (topik obrolan santai, maks. 3). Keduanya tampil sebagai chip di kartu tetangga (T11/T11b) supaya tamu lain punya bahan buat nyapa. Bisa diubah lagi di T11.
- **T03** tiket digital bergaya tiket fisik (sobekan samping, garis perforasi, potongan bawah berisi QR): nama, nomor kunci, tanggal, jam, lokasi, syarat follow, QR unik + kode pendek. "Simpan ke kalender" (.ics). Tiket & QR harus tetap tampil offline (di-cache).
- **T04** H-1: countdown, barang bawaan, tombol "Buka tiketku". Template pesan H-1 terpisah di P04.
- **P03** status realtime: Diundang / Konfirmasi / Tidak hadir / Belum jawab / Hadir (+ jam).
- ✅ Diterima jika: CSV dummy 20 baris ter-import tanpa error, link tamu membuka T01 dengan nama yang benar, konfirmasi langsung terlihat di P03.

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

### N2 — Naskah MC (Claude)
- Dibuat dari rundown + nama pembicara per transisi; mode teleprompter (ukuran huruf, gulir otomatis, tulis ulang).
- Mengikuti sesi aktif/berikutnya dari state acara (bukan tombol "Lanjut" P08).
- Naskah di-generate & dicek manusia **sebelum hari-H**, disimpan statis; regenerasi hari-H opsional. Peringatan "Selalu cek nama & jam".

### N3 — Kenalan (kartu tetangga)
- **BT05** daftar tamu yang sudah check-in (terbaru di atas), cari nama/IG. Tap → **T11** (lihat).
- Tamu bisa membuat/mengubah kartunya sendiri (peran, maks. 3 topik "tanya aku soal", toggle tampilkan IG) dan melepasnya kapan saja.
- Tanpa chat.

### N4 — Kulkas polaroid → kolase
- **BT06** kamera dengan frame polaroid (nama + tanggal); 1 jepret = 1 foto. **BT07** konfirmasi + "Foto lagi" / "Kembali ke jeda".
- Foto dikompres di perangkat (≤ 400 KB); bisa dihapus pemiliknya sampai acara ditutup.
- **T15** kolase otomatis dari semua foto.

## 8. Data & privasi

| Entitas | Field | Catatan |
|---|---|---|
| Guest | id, token, nama, ig, wa?, rsvp, followConfirmed, keyNo | WA opsional |
| Ticket | ticketId, guestId, shortCode, qrSig, status (aktif/dipakai), checkedInAt, checkedInBy, method (scan/manual) | QR = ticketId + tanda tangan, tanpa data pribadi |
| Profile card | guestId, peran, skills[≤3], asbun[≤3], showIg | Opsional; diisi di T02b atau T11 |
| Session | id, urutan, judul, ruang, tipe, jadwal, durasi, pembicara, PIC, status, startedAt, endedAt, titik[] | |
| Event state | mode, activeSession, nextSession, updatedAt | 1 baris |
| Question | id, guestId, sessionId, teks, clusterId, answered | |
| Photo | id, guestId, url, createdAt, deleted | |
| Feedback | guestId, rating, favoritePart, improvement?, inviteAgain | |
| Script | sessionId, teks, generatedAt, reviewed | |

- Hanya data minimal (nama, IG, WA opsional). Tidak ada email/alamat.
- **Hapus otomatis 8 Desember 2026** (H+30): data tamu, foto, pertanyaan, feedback per orang. Rekap agregat boleh disimpan tanpa identitas.
- **Sebelum Test Day hanya CSV dummy.** Jangan memasukkan data asli/password ke percakapan Claude.
- Token di URL → jangan dibagikan; halaman tamu `noindex`.

## 9. Kebutuhan non-fungsional

| Area | Kebutuhan |
|---|---|
| Platform | Web mobile (target 390×844), jalan di Safari iOS & Chrome Android terbaru, tanpa install. Bisa "Add to Home Screen" (opsional). |
| Bahasa | Semua copy tamu Bahasa Indonesia santai (lihat design.md). |
| Brand | Ink #101010, Orange Splash #F95B00, Amber #FFA101; logo tanpa efek. Dark theme, font Switzer + JetBrains Mono. |
| Realtime | Perubahan mode sampai ke HP tamu ≤ 3 dtk (target ≤ 1 dtk) di jaringan normal; fallback polling 5–10 dtk. |
| Offline | QR, rundown, mode terakhir ter-cache; check-in panitia diantrikan & disinkron; daftar manual PDF. |
| Performa | First load < 3 dtk di 4G; bundle halaman tamu kecil; foto dikompres. |
| Keandalan | Idempoten untuk check-in & submit; tidak ada layar kosong saat Claude/API gagal. |
| Aksesibilitas | Kontras teks ≥ 4.5:1, target sentuh ≥ 44px, mendukung reduced motion. |
| Keamanan | Token acak, PIN panitia di server, rate-limit PIN. |
| Kapasitas | 20 tamu + panitia (desain aman sampai 50). |

## 10. Stack (terbuka)

Belum diputuskan. Syarat apa pun pilihannya: (1) gratis atau sudah dimiliki studio — **tidak beli/langganan baru**, (2) mendukung realtime/pub-sub atau polling cepat, (3) bisa caching offline (service worker), (4) hosting dengan URL publik, (5) bisa memanggil Claude untuk N1/N2/P11 (atau proses dijalankan manual oleh panitia lewat Claude lalu hasilnya ditempel), (6) ≥ 70% pekerjaan dibuat dengan Claude.

Keputusan dibutuhkan paling lambat **Selasa 20 Okt** (lihat §12).

## 11. Kesiapan Test Day & submission

**Skenario penguji (2 Nov) → jalur di produk kita:**

| Tugas penguji | Jalur | Perhatian |
|---|---|---|
| Tamu: buka link konfirmasi | T01 → T02 → T03 | Link harus jelas dari pesan |
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
| Jum 23 Okt | F1 + F2 berjalan end-to-end dengan data dummy · Sharing #2 |
| Sen 26 Okt | F3 + F4 realtime (mode JEDA/SESI) · offline cache |
| Rab 28 Okt | F5 + N1 + N2 (Claude) · N3/N4 jika sempat · "NGODE" day |
| Kam 29 Okt | Uji internal 5 orang dengan skenario Test Day, perbaikan bug, polishing motion |
| Jum 30 Okt 12.00 | Freeze fitur; rekam video, tulis halaman cara pakai |
| Jum 30 Okt 17.00 | **Submit** |

Prioritas jika waktu kurang: F1–F5 > N1 > N2 > N4 > N3.

## 13. Gap & pertanyaan terbuka (dari review Figma)

| # | Temuan | Usulan |
|---|---|---|
| G1 | ✔︎ T05 & S01 masih memakai tab bar Konsep A | Selesai di Flow v0.2: T05 Kunciku, S01 = banner offline di atas Jeda |
| G2 | ✔︎ Navigasi panitia di Konsep B belum didefinisikan | Selesai di v0.2: tab bar **Kontrol · Tamu · Scan · Tanya** |
| G3 | ~~T14 tanpa rating~~ — salah baca, T14 sudah punya rating bintang | Tidak perlu tindakan |
| G4 | ✔︎ Caption & copy merujuk P08 / kode screen di UI | Selesai di v0.2 (copy BP01–BP04 tanpa kode screen) |
| G5 | Brief: pengenalan kantor di dalam talkshow; Figma: sesi 03 terpisah | Konfirmasi ke PIC; rundown dibuat bisa diedit |
| G6 | State hasil scan: Valid / Sudah dipakai / Tidak dikenal | Didesain di P06 (Clean v0.5, C5) |
| G7 | Tamu walk-in / belum konfirmasi saat datang | Panitia tambah tamu cepat dari P03/P07 |
| G8 | Copy BT06 "bisa dihapus" tapi tidak ada UI hapus foto | Tambah "Foto saya" + hapus |
| G9 | ✔︎ T11 hanya mode edit | Selesai di v0.2: T11b (lihat) + entry di BT05 |
| G10 | Status amber di P06 bentrok dengan aksen panitia (Amber) | Token status terpisah |
| G11 | ~~QR pintu sebagai aset cetak~~ | Tidak perlu lagi: QR ada di tiket tiap tamu |
| G12 | Pertanyaan tampil nama atau anonim? | Putuskan; default tampil nama + opsi anonim |
| G13 | Font: **Switzer** (diputuskan 18 Okt), belum terpasang di Figma; logo final belum ada | Install Switzer, ganti via text style saat DS |

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
