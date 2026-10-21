# design.md — HMD Event Companion · Konsep B "Satu Layar, Dua Mode"

**Tim B** · v0.5 (Clean · iOS · dark + light · Phosphor) · 18 Okt 2026 · pasangan dari `prd.md`
Figma: [Fawwaz-Exploration › DOKSLI SAPI](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4533-746) — kolom kanan x=4000: B00 (overview), BA, BB, BC. Screen Konsep A (section A, D, E, F, G) dipakai ulang untuk pra/pasca acara.

Figma: **B3 · iOS (Dark)** x=12600 dan **B4 · iOS Light** x=16700 di page DOKSLI SAPI. Variable collection "Potara iOS / Color" (Dark/Light), text style `iOS/*`, komponen ikon `Phosphor/*`.

---

## 1. Prinsip desain

1. **HP ngikutin acara, bukan sebaliknya.** Tamu tidak pernah mencari menu di hari-H. Layar berganti sendiri saat panitia menekan Mulai/Selesai.
2. **Satu layar, satu pertanyaan.** JEDA menjawab "berikutnya apa & ngapain sekarang". SESI menjawab "lagi apa & siapa". Tidak ada yang lain.
3. **Perhatian ke ruangan.** UI minim; tanpa chat, tanpa feed. Fitur interaksi (kamera, peserta) mendorong ketemu langsung.
4. **Rumah baru, bukan aplikasi event.** Metafora pindahan muncul di copy & detail: kunci, tetangga, kulkas polaroid, buku tamu.
5. **Selalu ada jalan pulang.** Setiap jalur punya cadangan (kunci offline, cari nama, daftar PDF) dan tidak ada layar kosong.
6. **Terasa seperti app iOS.** Ukuran, ritme, material, dan gerak mengikuti Apple HIG (iOS 26). Kalau ragu, tanya diri: "Apple bakal bikin begini nggak?"

## 2A. Arah visual v0.5: "Clean" (dari referensi, 18 Okt)

Referensi: app workout "Push", dashboard progres 22%, dan "Journey". Ketiganya punya pola yang sama: **monokrom, lapang, kartu putih tanpa garis, angka besar, warna hanya sebagai sinyal.** Bagian ini **mengganti** nilai di §2 dan §3 kalau bertentangan.

### Prinsip
1. **Monokrom dulu, warna belakangan.** UI dibangun dari hitam, putih, dan abu-abu. Oranye Potara hanya muncul sebagai *sinyal*: badge Live, sesi yang sedang berjalan, progress, countdown kecil. Satu layar maksimal satu-dua titik oranye.
2. **Tombol utama = Ink.** CTA berbentuk capsule hitam (#101010) dengan teks putih di light mode, dan capsule paper dengan teks Ink di dark mode. Ini tetap warna brand Potara (Ink), dan jauh lebih tenang daripada tombol oranye besar. Berlaku untuk tamu dan panitia.
3. **Kartu tanpa garis.** Kartu putih di atas latar abu-abu hangat, dipisahkan oleh shadow yang sangat halus. Tidak ada border.
4. **Hierarki 3 tingkat per kartu:** label kecil abu-abu → angka/judul besar tebal → keterangan kecil. Contoh: "Selanjutnya" → "Talkshow" → "Mulai 14.00 · Ruang 02".
5. **Lega.** Padding kartu 20, jarak antarkartu 12, jarak antarbagian 24. Lebih baik layar lebih panjang daripada sesak.
6. **Ikon kecil abu-abu, bukan dekorasi.** Phosphor Regular 18–20, warna `label-2`. Ikon berwarna hanya di dalam pill status.

### Token warna v0.5 (light = tampilan utama, dark = varian)

| Token | Light | Dark |
|---|---|---|
| `bg` | #F3F2F0 | #0B0B0B |
| `card` | #FFFFFF | #171717 |
| `card-2` (pill, tile dalam kartu) | #F3F2F0 | #232323 |
| `label` | #101010 | #F5F1EA |
| `label-2` | #6F6B65 | #9C978F |
| `label-3` | #B5B1AB | #5C5954 |
| `separator` | Ink 7% | Paper 8% |
| `cta` / `on-cta` | #101010 / #FFFFFF | #F5F1EA / #101010 |
| `accent` (Orange Splash) | #F95B00 | #F95B00 |
| `accent-soft` / `accent-text` | oranye 10% / #C94A00 | oranye 16% / #FF7A2E |
| `crew-soft` / `crew-text` | amber 14% / #9A5C00 | amber 16% / #FFB733 |
| `success-soft` / `success-text` | hijau 12% / #1A7F45 | hijau 16% / #4CD08A |
| `warning-soft` / `warning-text` | kuning #FFD60A 22% / #7A5A00 | kuning 18% / #FFD60A |
| `danger-soft` / `danger-text` | merah 10% / #C42B30 | merah 16% / #FF6B6F |

Shadow kartu (light, diperhalus 21 Okt): `0 1 2 rgba(0,0,0,.03), 0 2 8 rgba(0,0,0,.03)`. Glass/tab bar: `0 2 12 rgba(0,0,0,.06)`. Dark: tanpa shadow, kartu dibedakan lewat warna saja.

Button Secondary (21 Okt, 1:1 referensi, dicek per piksel): pill radius 999 · fill `secondary-fill` #EFEFEF · border 1 px `secondary-stroke` #C8C8C8 (layer "Border", stroke inside) · highlight putih 1,5 px tepat di dalam border (layer "Highlight", stroke inside 2,5 px di bawah Border) · shadow `0 1 1 rgba(0,0,0,.14)` + `0 2.5 5 -1 rgba(0,0,0,.10)` · label Switzer Semibold 17. Dark: #2C2C2E / #4A4A4D / #3C3C3F.
Button Primary (21 Okt, 1:1 referensi "Think", dicek per piksel): pill radius 999 · fill gradient vertikal #3B3B3B → #383838 (50%) → #333333 (75%) → #2E2E2E (88%) → #363636 · rim gradient stroke inside 3,5 px #5E5E5E (atas) → #242424 (sisi) → #525252 (bawah) (layer "Rim") · border gelap 1,75 px #151515 (layer "Border") · shadow `0 1.5 4 rgba(0,0,0,.25)` · label & ikon #F5F5F5, Switzer Medium 17. Warna tetap (tidak ikut mode), jadi sama di Light & Dark.
Toggle (21 Okt, 1:1 referensi, dicek per piksel): track 51×31 pill, fill `toggle-track` #D8DBE3 (off; dark #3A3A3C) / `accent` (on), inner shadow `0 0.8 2 rgba(0,0,0,.28)` + `0 0 1.4 rgba(0,0,0,.10)`, garis cahaya luar putih 0,35 px. Knob 26,5 px: rim gradient #FFFFFF → #E7E8EA → #C8CBCF, face 88% (geser 4,5% ke atas) gradient #FAFAFA → #EEEEEE → #E8E8E8, shadow `0 0.9 1 rgba(0,0,0,.5)` + `0 3.5 5 rgba(0,0,0,.18)`.
Tab bar panitia (21 Okt, 1:1 referensi, biru → hitam): lebar 358, kiri = bar pill gelap #2C2C2C (padding 4, inner highlight putih 12%, shadow `0 4 14 rgba(0,0,0,.18)`) berisi Kontrol · Tamu · Tanya; tab aktif = pill #545454 tinggi 49 dengan ikon + label putih (Body Emph), tab non-aktif = ikon putih saja; kanan = tombol Scan bulat 57 px hitam (gradient #0C0C0C → #1F1F1F, ring putih 1,5 px, shadow `0 4 14 rgba(0,0,0,.22)`), terpisah dari bar. Di layar scan (P05/P06) tidak ada tab aktif di bar.
Button destruktif / Hapus (21 Okt, 1:1 referensi): komponen `Clean/Button · Destructive`, lingkaran 54 px, fill #F54847, inner highlight putih atas `inset 0 1.9 2.7 rgba(255,255,255,.35)`, glow merah `0 0 2.7 rgba(245,72,71,.35)`, ikon ember putih #F6F6F6 34 px (`Custom/Fill/bucket`), tanpa label. Dipakai di T15b (Hapus foto).
Segmented control (21 Okt, 1:1 referensi): tinggi 54 (sama dengan button), track pill #F1F1F3, stroke 0,6 px #E2E2E4, shadow `0 3.2 14 rgba(0,0,0,.08)` (untuk tinggi 40), padding 13% tinggi; segmen aktif pill #232325 dengan shadow `0 1.6 7 rgba(0,0,0,.28)`, teks putih; segmen non-aktif tanpa fill, teks #5B5B5D; label Switzer Medium. Lebar segmen tetap sama rata (FILL).
Icon button putih (21 Okt): `Clean/IconButton` pakai styling Button Secondary (fill `secondary-fill`, layer Border 1 px + Highlight 2,5 px, shadow sama), ikon saja. Varian kaca di kamera (BT06) tetap transparan, Border/Highlight disembunyikan.
Logo (21 Okt): komponen `Potara/Logo mark` (vektor, digambar ulang dari referensi): 4 bagian panah ke tengah dengan lubang X, atas & kanan #F95B00, bawah & kiri #FFA101. Ukuran 32 di header P01/P01b/P01c dan T01e; semua placeholder "potara" lama sudah diganti.

### Bentuk & ukuran
- Kartu radius **24**, padding **20**. Tile statistik radius 22, padding 16.
- Pill/chip: tinggi 32, capsule, `card-2`, ikon 16 + Footnote Semibold.
- Tombol utama: tinggi **54**, capsule, Headline 17 Semibold, ikon 18 di kiri label.
- Tab bar: capsule kaca kecil **di tengah** (lebar menyesuaikan, ±232), ikon saja 22, item aktif = pill `card-2`. Label tetap ada untuk aksesibilitas (aria-label), tidak ditampilkan.
- Avatar: lingkaran abu-abu `card-2` dengan inisial `label-2`. Tidak ada avatar warna-warni.
- Grafik/progress: abu-abu `card-2` untuk yang belum, Ink untuk yang selesai, oranye untuk yang sedang berjalan (seperti grid "Last 30 days" di referensi).

### Tipografi v0.5
- Angka besar (countdown, timer, statistik): 40–56 Bold, tracking -3%.
- Judul layar: 32 Bold, tracking -2%. Judul kartu: 24 Bold.
- Label kartu: 13 Regular `label-2`, sentence case.
- Tetap Switzer (Inter di Figma sampai Switzer terpasang).

### Pola layar
- **Header:** label kecil (tanggal/peran) + judul besar di kiri, satu tombol bulat atau badge di kanan.
- **Kartu hero:** satu per layar, berisi jawaban utama layar itu (JEDA: sesi berikutnya + countdown; SESI: sesi berjalan + progress; panitia: mode layar tamu + tombol Mulai).
- **Baris statistik:** 3 tile sejajar (ikon kecil di atas, angka, label).
- **Rundown:** 4 segmen capsule sebagai progress acara + list sederhana di kartu.
- **Overlay/sheet:** kartu putih mengambang di atas latar yang di-blur, seperti detail "3.2k reps" di referensi.

### Tiket (keputusan 18 Okt): undangan → tiket fisik digital
Check-in sekarang: **panitia yang men-scan QR unik di tiket tamu** (BT01 scan pintu dihapus). Tiket dibuat menyerupai tiket kertas sungguhan, lalu **sobek** saat panitia men-scan dan tiketnya valid.

**Anatomi `Clean/Ticket`** (lebar 358, kartu putih, radius 24, tanpa shadow, jadi terasa seperti kertas):
1. **Kepala**: ikon kunci dalam lingkaran `accent-soft`, judul "Kunci rumah baru" (Card Title), subjudul "House Moving Day · Potara Studio", badge status.
2. **Perforasi 1**: garis putus-putus 1 px (`separator`, dash 6/6) + dua lekukan setengah lingkaran 28 di kiri-kanan (diisi warna `bg`, jadi terlihat seperti potongan).
3. **Info**: grid 2 kolom berpasangan *label kecil `label-2` → nilai Body Emph*: Nama / Nomor kunci, Tanggal / Jam, lalu Lokasi selebar penuh. Di bawahnya kotak `card-2` radius 16: ikon cek + "Syarat hadir terpenuhi · follow @potarastudio".
4. **Perforasi 2** (garis sobek): sama seperti perforasi 1. Di sinilah tiket akan sobek.
5. **Potongan (stub)**: QR 168 di tengah + kode pendek `HMD-014-7F3K` (Label Emph, tracking lebar) + "Tunjukkan ke panitia". Tepi bawah bergerigi (deretan setengah lingkaran 28 berwarna `bg`).

**State**
| State | Tampilan |
|---|---|
| Aktif (T03, T05) | Utuh. Badge Neutral "Belum masuk" (T05) / Success "Terkonfirmasi" (T03) |
| Discan, valid | Badge berubah jadi Success "Valid", potongan mulai bergeser (frame transisi) |
| Sobek (BT02) | Kepala + info saja, tepi bawah bergerigi bekas sobekan, cap "Masuk 13.04 · tamu ke-9" (success, miring -6°). Potongan QR terlepas, jatuh, dan memudar |
| Sudah dipakai (dibuka ulang) | Sama seperti sobek, tanpa animasi. QR tidak tampil lagi |

**Animasi sobek** (owner: Fawaz). Total ±900 ms, dipicu event realtime `ticket.checked_in`:
1. 0–150 ms: haptic + badge berubah jadi "Valid".
2. 150–450 ms: garis perforasi 2 "terbuka" dari kiri ke kanan (mask bergerigi), potongan miring 4° ke kanan.
3. 450–900 ms: potongan jatuh ke bawah layar (translateY +420, rotate 14°, opacity → 0) dengan easing gravitasi `cubic-bezier(.55,0,1,.45)`. Kepala tiket naik sedikit, lalu cap "Masuk" muncul dengan scale 1.2 → 1 (spring).
4. Reduce motion: crossfade 200 ms dari tiket utuh ke tiket sobek.

**Panitia**
- **P05 Scan tiket**: viewfinder gelap besar dengan bingkai sudut, penghitung "9/20 masuk", tombol "Cari nama" (P07). Tab Scan aktif.
- **P06 Hasil scan**: sheet mengambang di atas kamera. Tiga varian: **Valid** (avatar, nama, "Kunci #014 · @rarawening", badge "Tamu ke-9", tombol "Scan berikutnya"), **Sudah dipakai** (kuning, "Masuk 13.04 lewat scan"), **Tidak dikenal** (merah, tombol "Cari nama").

### Kolase akhir: galeri gaya Pinterest (21 Okt)
- **T15 · Kolase kulkas**: header "Terima kasih sudah mampir, Rara" + judul + "48 foto dari 20 tamu"; chip filter (Semua, Fotoku, per sesi); **masonry 2 kolom** (lebar 175, jarak 8 antar kolom, 12 antar pin), tinggi foto bervariasi mengikuti rasio asli foto; di bawah tiap foto: avatar 20 + "Nama · sesi". Foto milik tamu sendiri diberi label kaca "Fotoku". Aksi mengambang: "Simpan kolase" + tombol bagikan.
- **T15b · Detail foto**: kartu mengambang di atas latar blur (foto besar radius 22, nama, sesi, jam), "Simpan foto", dan "Hapus" khusus foto sendiri (sampai acara ditutup). Geser kiri/kanan untuk foto lain, tombol tutup di kanan atas.
- Implementasi web: CSS columns atau masonry layout berbasis tinggi asli foto; lazy-load + thumbnail ±400 px; urutan default terbaru di atas.
- Figma: section **C9 · Kolase Pinterest** (light & dark) di dalam "Finalise Alfin". Foto masih placeholder gradasi; diganti foto contoh/asli nanti.

### Status di Figma (Clean v0.5)
- **C1 · Tamu (Light)** dan **C2 · Panitia (Light)** di x=21000, y=0 / 1230. Versi dark: **C3** dan **C4** (y=2460 / 3690). Semuanya memakai variable collection **"Potara Clean / Color"** (mode Light/Dark).
- 12 layar inti untuk alur Test Day: BT01 Scan, BT02 Berhasil, BT03 Jeda, BT08 Sesi, T01 Undangan, T03 Kunci, BT12 Selesai, T14 Buku tamu, BP01 Kontrol, BP02 Sesi berjalan, BP03 Konfirmasi (sheet), P03 Daftar tamu.
- Komponen (frame "Clean v0.5 / Components"): StatusBar, HomeIndicator, Pill, Badge (Live/Crew/Success/Neutral), Button (Primary/Secondary), IconButton, StatTile, TabItem, TabBar · Panitia, ListRow. Text style `Clean/*`, effect style `Clean/Card shadow` & `Clean/Glass`.
- **Tiket & check-in (18 Okt):** C5 · Tamu (T03 Tiket, T05 Tiket hari-H, T05a Discan/mulai sobek, BT02 Tiket sobek) dan C6 · Panitia (P05 Scan tiket, P06 Valid, P06b Sudah dipakai, P06c Tidak dikenal), y=4920 / 6150. Dark: C7 / C8 (y=7380 / 8610). Komponen: `Clean/Ticket`, `Clean/Ticket · Sobek`, `Clean/Ticket · Potongan`. QR di Figma adalah QR asli (berisi contoh URL tiket). BT01, BT02 lama, dan T03 lama di C1/C3 ditandai ⛔ (diganti C5).
- **Layar tambahan Clean (21 Okt):** C10 (T02, T04, BT04, BT05, T11b, T11), C11 (BT06, BT07, BT09, BT10, BT11, S01), C12 (P01, P04, P07, P09, P10, P11, BP04) di dalam "Finalise Alfin". Semua layar alur Konsep B kini punya versi Clean (light). Versi dark untuk C10–C12 belum dibuat.
- **Case states (21 Okt):** semua kartu "PERLU DIDESAIN" di *Screen Flow · All Case* sekarang **ADA LAYARNYA** + thumbnail. Layar baru (light) di "Finalise Alfin":
  - C13 Tamu: T01e Link tidak valid · T02c Form belum lengkap · T02d Gagal kirim · T03b Tiket dibuka lagi (QR nonaktif) · BT03b Countdown habis ("Sebentar lagi mulai") · BT08b Gagal kirim pertanyaan · T14b Buku tamu gagal kirim.
  - C14 Tamu: BT05b Cari nggak ketemu · BT05c Baru sedikit yang datang · BT06b Izin kamera ditolak · BT07b Gagal upload (diantre) · T15c Simpan kolase 9:16 · T15d Kolase kosong.
  - C15 Panitia: P01b PIN salah (sisa percobaan) · P01c Terkunci 5 menit · P04c CSV ada baris error · P07b Kamera error → Cari nama · P07c Walk-in (sheet tambah tamu cepat) · P07d Daftar manual (PDF) · BP02b Diubah panitia lain (toast).
  - C16 Panitia: BP02c Waktu sesi lewat (timer merah) · P10b Claude gagal (daftar mentah) · P10c Belum ada pertanyaan · P09b Naskah tersimpan · BP04b Konfirmasi tutup acara · P11b Claude gagal ngeringkas · P11c Belum ada feedback.
  - Kasus yang sudah punya layar ditautkan: Tap tile Rundown → BT04, Sinyal lemah → S01, Ubah kartu → T11, Hapus foto sendiri → T15b.
  - Pola state yang dipakai: **banner** (soft tone + ikon + "Coba lagi") untuk error yang bisa dipulihkan; **hero state** (lingkaran 88 + judul + body) untuk kosong/blokir; **toast** gelap untuk perubahan realtime; **sheet** untuk konfirmasi/aksi cepat. Isian user nggak pernah hilang saat gagal kirim.
  - Flow & mapping All Case tidak diubah: posisi kartu, tinggi kartu, panah tetap; kartu hanya melebar ke kanan (+42 px) untuk thumbnail.
- **Dari catatan review (Notes di T02, 20 Okt):** tambah **T02b · Kenalan dikit** setelah konfirmasi: chip **Potensi skill** (terpilih = Ink) dan **Potensi asbun** (terpilih = oranye lembut), masing-masing maks. 3, bisa "Lewati dulu". Chip ini tampil di kartu tetangga: T11b (lihat) dan T11 (edit) sudah diperbarui. Di screen flow, T02b disisipkan antara T02 dan T03.
- **Screen flow v2 (21 Okt):** section "Screen Flow · Konsep B (Clean v0.5) · v2" di kanan "Finalise Alfin". 7 lajur, 41 layar tanpa placeholder: Tamu sebelum acara · Tamu masuk · Tamu mode Jeda · Tamu mode Sesi → selesai · Panitia persiapan · Panitia pintu · Panitia kontrol. Panah hitam = navigasi, oranye putus-putus = realtime antar-HP, abu-abu putus-putus = state sistem.
- Detail kecil: gradasi "scroll edge" di belakang tombol bawah/tab bar supaya konten memudar, bukan terpotong.
- Belum dibangun ulang dengan gaya Clean: T02, T04, T05, BT04–BT07, BT09–BT11, S01, T11/T11b, T15, P01, P04–P07, P09–P11, BP04. Polanya sama, tinggal disusun dari komponen yang sama.

## 2. Bahasa desain: iOS 26 (Apple HIG) + warna Potara

**Keputusan 18 Okt:** UI dirework mengikuti Apple Human Interface Guidelines, gaya **iOS 26 Liquid Glass** (tombol capsule, toolbar dan tab bar kaca mengambang, sudut konsentris). Warna tetap warna Potara dan font tetap **Switzer**. Produk tetap web app di browser, bukan app native. Jadi kita meniru *rasa* iOS (ukuran, ritme, material, gerak), bukan memakai komponen milik Apple. SF Symbols dan SF Pro tidak dipakai di produk.

Di Figma, Switzer belum terpasang. Sementara itu text style memakai **Inter** sebagai pengganti. Setelah Switzer di-install, cukup ganti family di text style `iOS/*` dan semua layar ikut berubah.

### 2.1 Warna: Dark & Light mode → peran semantik iOS

Dua mode, **Dark** (default, sesuai suasana acara) dan **Light**. Di Figma keduanya ada sebagai variable collection **"Potara iOS / Color"** dengan mode `Dark` / `Light`. Semua layar iOS v0.3 sudah di-bind ke token ini, jadi ganti mode cukup di panel Layer → Variable mode. Di web: `prefers-color-scheme` + CSS variables dengan nama yang sama.

| Token | Dark | Light | Pakai untuk |
|---|---|---|---|
| `bg` | #101010 Ink | #F5F1EA Paper | Latar layar |
| `bg-grouped` | #1C1B1A | #FFFFFF | Kartu, grup list, field |
| `bg-elevated` | #2A2826 | #EDE8E0 | Elemen di dalam kartu, avatar netral |
| `fill` | Paper 12% | Ink 6% | Tombol gray, search field, track segmented |
| `glass` | #1C1B1A 72% + blur | #FFFFFF 72% + blur | Tab bar, tombol bulat, toast |
| `glass-stroke` | Paper 10% | Ink 8% | Garis tepi kaca 0.5 |
| `separator` | Paper 12% | Ink 10% | Garis list 0.5 |
| `label` | #F5F1EA | #101010 | Teks utama, ikon utama |
| `label-2` | #A39E96 | #6B655E | Teks sekunder (7.2:1 / 5.1:1) |
| `label-3` | Paper 40% | Ink 30% | Placeholder, chevron, disabled |
| `icon-2` | #8F8A82 | #8A847C | Ikon tab tidak aktif |
| `hero` | #F5F1EA | #101010 | Kartu hero (selalu **kontras terbalik** dari latar): Selanjutnya, undangan, kunci QR, tombol "Selesaikan sesi" |
| `on-hero` / `on-hero-2` | #101010 / #5A554E | #F5F1EA / #A39E96 | Teks di atas kartu hero |
| `tint-on-hero` | #C94A00 | #F95B00 | Eyebrow/countdown oranye di atas kartu hero |
| `tint-guest` | #F95B00 | #F95B00 | Isi tombol & chip tamu (label tetap Ink) |
| `tint-guest-text` | #F95B00 | #C94A00 | Teks/ikon oranye di atas latar (light butuh lebih gelap: 4.7:1) |
| `tint-crew` | #FFA101 | #FFA101 | Isi tombol & chip panitia |
| `tint-crew-text` | #FFA101 | #9A5C00 | Teks/ikon amber di atas latar (5.4:1 di light) |
| `on-tint` | #101010 | #101010 | Label di atas tombol oranye/amber |
| `segment-selected` | #63605C | #FFFFFF | Pilihan aktif segmented control |
| `green` / `red` / `yellow` | #2FB36B / #E5484D / #FFD60A | sama | Status (selalu ditemani ikon) |

Aturan:
- **Satu tint per peran.** Oranye untuk semua layar tamu, amber untuk semua layar panitia.
- Label di atas tombol filled oranye/amber selalu **Ink** (5.9:1 / 9.4:1), di kedua mode.
- Elemen fisik tetap statis di kedua mode: polaroid putih, QR putih, viewfinder kamera gelap, layar check-in berhasil oranye (BT02).
- Backdrop sheet: hitam 45% di kedua mode.
- Logo Potara tanpa efek.

### 2.2 Material: Liquid Glass

| Material | Spesifikasi | Dipakai untuk |
|---|---|---|
| `glass` | `bg-grouped` 70% + background blur 24 + saturasi 180% + stroke dalam paper 10% 0.5 px + highlight atas paper 6% | Tab bar mengambang, tombol toolbar bulat (back/close), aksi bawah mengambang, toast, sheet |
| `glass-tinted` | tint 85% + blur 24 + highlight atas putih 25% | Tombol utama mengambang (mis. "Foto buat kolase") |
| `solid` (fallback) | `bg-grouped` 100% | Saat "Kurangi Transparansi" aktif atau `backdrop-filter` tidak didukung |

Kaca hanya untuk lapisan navigasi/kontrol yang mengambang di atas konten. Konten (kartu, list) tetap solid. Ini aturan Liquid Glass Apple: kaca tidak boleh menumpuk di atas kaca.

Web: `backdrop-filter: blur(24px) saturate(180%)` + `@supports` fallback ke solid.

### 2.3 Tipografi: ramp Dynamic Type iOS, font Switzer

| Text style | Size / line | Weight | Tracking | Contoh |
|---|---|---|---|---|
| `iOS/Display` *(brand)* | 64 / 64 | Bold | -2% | Countdown "12", timer panitia "26:41" (tabular nums) |
| `iOS/Large Title` | 34 / 41 | Bold | -1% | Judul layar: "Kontrol acara", "Kamu udah di dalam, Rara!" |
| `iOS/Title 1` | 28 / 34 | Bold | -1% | Judul kartu hero: "Talkshow", "Jeda" |
| `iOS/Title 2` | 22 / 28 | Bold | -0.5% | Judul sheet, angka statistik |
| `iOS/Title 3` | 20 / 25 | Semibold | -0.5% | Judul kartu sesi |
| `iOS/Headline` | 17 / 22 | Semibold | -0.5% | Label tombol, judul baris list, nav title |
| `iOS/Body` | 17 / 22 | Regular | -0.5% | Paragraf |
| `iOS/Callout` | 16 / 21 | Regular | -0.3% | Deskripsi kartu |
| `iOS/Subheadline` | 15 / 20 | Regular / Semibold | -0.2% | Subjudul baris, eyebrow kartu (Semibold + tint) |
| `iOS/Footnote` | 13 / 18 | Regular / Semibold | 0 | Section header, caption di bawah tombol |
| `iOS/Caption 1` | 12 / 16 | Medium | 0 | Label statistik, badge |
| `iOS/Caption 2` | 11 / 13 | Semibold | +0.5% | Label tab bar |

Aturan:
- **Tidak ada lagi label mono UPPERCASE** (JetBrains Mono). iOS memakai sentence case. Eyebrow seperti "SELANJUTNYA · RUANG 02" menjadi "Selanjutnya · Ruang 02" (Subheadline Semibold, warna tint). Section header memakai Footnote Semibold `label-2`.
- Angka yang berubah (countdown, timer, jumlah) memakai `font-variant-numeric: tabular-nums`.
- Dukung Dynamic Type: layout tidak boleh pecah sampai 130% (web: pakai `rem`, hormati ukuran teks sistem).

### 2.4 Layout, grid, safe area

- Kanvas **390×844**. Safe area atas **47** (status bar), bawah **34** (home indicator 134×5, 8 dari bawah).
- **Layout margin 16** kiri-kanan, lebar konten 358. Grid 8 pt. Skala spasi: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 44.
- Jarak antar grup/kartu: 20. Di dalam kartu: padding 16, jarak elemen 8–12.
- **Nav bar large title:** baris toolbar 44 (tombol bulat kaca kiri/kanan) + Large Title 34 di bawahnya. Dipakai di layar daftar/halaman turunan (Rundown acara, Peserta, Kartu tetangga, Daftar tamu, Kontrol acara, dst.).
- **Inline title** (Headline 17, rata tengah di toolbar) untuk form yang punya judul konten sendiri, contoh T02 Konfirmasi hadir.
- Layar mode tamu (Jeda/Sesi/Selesai) tidak memakai Large Title: kartu hero adalah judulnya.
- **Aksi bawah:** tombol utama mengambang di atas konten, 16 dari tepi, 12 di atas home indicator. Untuk panitia, berada tepat di atas tab bar.
- Target sentuh minimum **44×44**.

### 2.5 Radius konsentris

Sudut layar iPhone ±47. Radius elemen = radius wadah − jarak ke tepi wadah, supaya lengkungan sejajar.

| Elemen | Radius |
|---|---|
| Sheet mengambang (inset 8 dari tepi layar) | 40 |
| Kartu hero & grup list (margin 16) | 28 |
| Elemen di dalam kartu (padding 16) | 12 |
| Tombol, chip, search field, segmented, tab bar | **capsule** (tinggi / 2) |
| Tombol toolbar bulat | lingkaran 44 |
| Ikon baris list (kotak 30) | 8 |
| Avatar | lingkaran |
| Polaroid | 6 (sengaja tidak iOS, ini objek fisik) |

### 2.6 Elevasi

Datar. Pemisahan lapisan lewat warna latar (`bg` → `bg-grouped` → `bg-elevated`), bukan shadow. Shadow hanya untuk elemen mengambang: kaca `0 8 24 rgba(0,0,0,.35)`.

### 2.7 Mode visual JEDA ⇄ SESI (tetap)

| Mode | Sinyal visual |
|---|---|
| **JEDA** | Nav bar logo + badge `Mode jeda`; kartu hero **paper** "Selanjutnya" berfungsi sebagai judul, dengan countdown Display oranye |
| **SESI** | Nav bar logo + badge `● Live`; kartu **gelap** ber-border tint 1.5 px dengan judul sesi dan progress |
| Check-in berhasil | Layar penuh oranye, satu-satunya layar full-tint |
| Panitia | Sama gelap, tint amber, tab bar kaca 4 item |

## 3. Komponen (spesifikasi iOS)

| Komponen | Spesifikasi | Dipakai di |
|---|---|---|
| `StatusBar` | 47 tinggi; jam 17 Semibold kiri; sinyal/wifi/baterai kanan | semua |
| `HomeIndicator` | 134×5, capsule, paper, 8 dari bawah | semua |
| `NavBar / Large` | baris toolbar 44 (logo atau tombol bulat kiri, aksi bulat kanan) + Large Title 34 + subjudul Subheadline `label-2` opsional | layar utama |
| `NavBar / Inline` | tombol bulat kaca 44 (chevron.left) · title Headline 17 tengah · aksi kanan | layar turunan (BT04, BT05, T11, P07, P09…) |
| `ToolbarButton` | lingkaran 44, `glass`, ikon 20 `label` | back, close, refresh, flash |
| `Button / Filled` | tinggi 50, capsule, latar tint, label Headline 17 Ink, ikon 20 opsional | aksi utama |
| `Button / Tinted` | latar tint 18%, label tint | aksi kedua yang tetap penting |
| `Button / Gray` | latar `fill`, label `label` | Batal, Kembali |
| `Button / Plain` | tanpa latar, label tint Headline | link seperti "Kamera nggak jalan?" |
| `Button / Small` | tinggi 34, capsule, Subheadline Semibold | aksi di dalam baris/kartu (Kirim WA, Check-in, Tandai dijawab) |
| `Badge` | tinggi 24, capsule, Caption 1 Semibold; varian Live (titik tint berdenyut), Jeda, Selesai, Panitia, Offline | toolbar kanan |
| `Card / Hero paper` | radius 28, padding 20, latar paper, eyebrow Subheadline Semibold tint, Title 1 ink | BT03, BT10, T01, T03 |
| `Card / Live` | radius 28, padding 20, `bg-grouped`, border tint 1.5, badge Live, Title 3, progress 6 capsule | BT08, BT09, BT11, BP02 |
| `Card` | radius 28, padding 16, `bg-grouped` | info, stat, composer |
| `List / Inset grouped` | radius 28, `bg-grouped`; baris min 44 (52 dengan subjudul, 60 dengan avatar); ikon 30 radius 8 atau avatar 36; separator inset; chevron 14 `label-3`; nilai di kanan `label-2` | rundown, peserta, daftar tamu, cluster |
| `SectionHeader` | Footnote Semibold `label-2`, inset 16 + 4, jarak 8 ke grup | semua list |
| `SearchField` | tinggi 44, capsule, latar `fill`, ikon magnifyingglass, placeholder `label-3` | BT05, P03, P07 |
| `TextField / Grouped` | baris 52 di dalam grup list, label di atas (Footnote) atau placeholder | T02, T11 |
| `Switch` | 51×31, on = tint, knob paper | T02, T11 |
| `SegmentedControl` | tinggi 36, capsule, track `fill`, pilihan aktif `bg-elevated` | T14 (opsi Mau dong / Nanti dulu) |
| `TabBar / Glass` | mengambang, tinggi 62, capsule, inset 16, `glass`; item aktif = pill paper 12% + ikon/label tint; label Caption 2 | panitia |
| `Sheet` | mengambang, inset 8, radius 40, grabber 36×5; judul Title 2; aksi Filled + Gray | BP03, P06 |
| `Toast / Banner` | capsule kaca di bawah status bar, ikon + Subheadline + aksi Plain "Batalkan" dengan ring 5 dtk | BP02, offline |
| `Stat` | di dalam `Card`: angka Title 2 + label Caption 1 `label-2` | BP01, BP04, P03, P11 |
| `Countdown` | angka Display tint + label Footnote | BT03, BT10, T04 |
| `Avatar` | lingkaran 36/44/52; inisial Subheadline Semibold; warna latar dari palet tint | list, kartu |
| `KeyCard (QR)` | Card hero paper, QR 220, nomor kunci Footnote Semibold, kecerahan maks | T03, T05 |
| `PolaroidFrame` | putih, radius 6, padding 12/12/40 | BT06, BT07, T15 |
| `PinPad` | tombol bulat 78 `fill`, angka Title 1, sesuai keypad Telepon iOS | P01 |

Ikon: **Phosphor Icons** (MIT, `@phosphor-icons/core` / `@phosphor-icons/react`). Weight **Regular** sebagai default (setara bobot SF Symbols regular), **Fill** untuk state aktif: tab terpilih, bintang yang dipilih, ikon play/stop di tombol. Ukuran 20 di toolbar, 24 di tab bar, 17–20 di dalam baris. Warna mengikuti token (`label`, `icon-2`, `tint-*-text`, `on-tint`). Di Figma: 42 komponen `Phosphor/Regular/*` dan `Phosphor/Fill/*` di frame "Phosphor icons" (page DOKSLI SAPI, di atas B3).

Pemetaan yang dipakai: caret-left (back), caret-right (chevron), x, magnifying-glass, list-bullets (Kontrol), users (Tamu), qr-code (Scan), chat-circle (Tanya), camera, camera-rotate, image, lightning, map-pin, map-trifold, calendar-blank, clock, key, lock-simple, coffee, hand-waving, wifi-slash, arrow-clockwise, arrow-counter-clockwise, paper-plane-tilt, book-open, star, download-simple, upload-simple, file-text, copy, play, stop, scroll, sparkle, check.

### Implementasi web supaya terasa iOS
- `viewport-fit=cover` + `env(safe-area-inset-*)`, `theme-color #101010`, manifest `display: standalone`.
- `-webkit-tap-highlight-color: transparent`. Feedback tekan = scale 0.97 + sorotan, durasi 120 ms.
- Scroll native dengan momentum. Nav bar large title mengecil menjadi inline saat scroll (sticky + blur).
- Transisi: masuk ke halaman detail geser dari kanan (push). Sheet muncul dari bawah dengan spring.

## 4. Inventaris screen Konsep B

**Figma iOS v0.3** (18 Okt): page DOKSLI SAPI, x=12600 — header "B3 · Peta alur" + lane B3.1–B3.9. Hasil rework iOS dari v0.2: status bar iOS, home indicator, margin 16, text style `iOS/*` di semua teks (label mono UPPERCASE → sentence case), tombol capsule (filled / tinted / gray), kartu radius 28, tab bar kaca mengambang dengan pill aktif, tombol toolbar bulat kaca 44, toolbar + Large Title di layar turunan, keypad PIN capsule, field radius 12 dengan fokus tint.

Polish lanjutan (18 Okt, sore): ikon diganti Phosphor; list jadi inset-grouped (BT04 rundown, BT05 peserta, P03 daftar tamu) dengan separator 0.5; search field 44 capsule; toast BP02 jadi capsule kaca; sheet BP03/P06 mengambang (inset 8, radius 40) dengan backdrop 45%; switch iOS 51×31 di T11; segmented control di T14; polaroid BT07 dikecilkan supaya tidak menabrak tombol.

**Light mode — B4 · iOS Light** (x=16700, lane B4.1–B4.9): salinan B3 dengan variable mode `Light`. B3 dikunci ke mode `Dark`. Ubah desain di B3 lalu salin ulang, atau ganti mode per frame.

Sisa: P07 list belum inset-grouped, checkbox T02 belum jadi switch/checkmark iOS, toast belum ada ring hitung mundur, layar state gagal (G6) belum dibuat.

**Figma Flow v0.2** (18 Okt): page DOKSLI SAPI, x=8000 — header "B2 · Peta alur" + lane B2.1–B2.9 (salinan; frame asli A/B tidak diubah). Yang sudah dikerjakan di v0.2: T05 Kunciku tanpa tab bar, S01 jadi Jeda-offline, T11b (lihat), entry "Pasang kartu" di BT05, tab bar panitia 4 item, BP03 "Selesai & mulai {berikutnya}", kode screen dihapus dari copy UI, caption P08 diperbarui, tier heading & radius kartu hero diseragamkan.

Status: ✅ siap di Figma · 🔁 perlu varian/penyesuaian untuk B · ➕ belum ada · ✔︎v0.2 sudah dikerjakan di Flow v0.2

### Tamu
| ID | Screen | Status | Catatan |
|---|---|---|---|
| T01 | Undangan | ✅ | |
| T02 | Konfirmasi hadir | ✅ | + state "Tidak bisa datang" (terima kasih) ➕ |
| T03 | Kunci rumah baru (QR) | ✅ | |
| T04 | Pengingat H-1 | ✅ | |
| T05 | Kunciku (cadangan check-in) | ✔︎v0.2 | Tanpa tab bar, tombol "Kembali ke scan QR" |
| BT01 | Scan check-in | ✅ | + state gagal ➕ (G6) |
| BT02 | Check-in berhasil | ✅ | |
| BT03 | Jeda | ✅ | |
| BT04 | Jeda · Rundown | ✅ | |
| BT05 | Jeda · Peserta | ✔︎v0.2 | Entry "Pasang kartu tetanggamu" ditambah · empty state ➕ |
| T11 / T11b | Kartu tetanggaku (edit) / Kartu tetangga (lihat) | ✔︎v0.2 | T11b dibuka dari tap nama di BT05 |
| BT06 | Kamera kolase | ✅ | + izin kamera ditolak ➕ |
| BT07 | Foto masuk kolase | ✅ | + "Foto saya" & hapus ➕ (G8) |
| BT08 | Sesi · Talkshow | ✅ | |
| BT09 | Sesi · Pertanyaan terkirim | ✅ | + gagal kirim ➕ |
| BT10 | Jeda berikutnya (loop) | ✅ | |
| BT11 | Sesi · Tur kantor / Closing | ✅ | Closing pakai pola sama — buat 1 contoh ➕ |
| S01 | Jeda — sinyal lemah | ✔︎v0.2 | Banner offline di atas BT03; varian di atas BT08 ➕ |
| BT12 | Acara selesai | ✅ | |
| T14 | Buku tamu | ✅ | Rating bintang sudah ada; caption diperbarui ke BP04 |
| T15 | Terima kasih + kolase | ✅ | + format simpan 9:16 |

### Panitia
| ID | Screen | Status | Catatan |
|---|---|---|---|
| P01 | Masuk PIN | ✅ | + PIN salah ➕ |
| P03 | Daftar tamu | ✔︎v0.2 | Tab bar B · tambah tamu walk-in ➕ |
| P04 | Import CSV & kirim undangan | ✅ | + CSV error state ➕ · + template H-1 ➕ |
| BP01 | Kontrol acara (Jeda) | ✔︎v0.2 | Tab bar B · kolom PIC per sesi ➕ |
| BP02 | Sesi berjalan | ✔︎v0.2 | Tab bar B, copy tanpa kode screen · timer lewat ➕ |
| BP03 | Konfirmasi selesai | ✔︎v0.2 | Primer "Selesai & mulai Tur kantor", sekunder "Selesai aja" |
| BP04 | Semua sesi selesai | ✔︎v0.2 | Tab bar B, copy tanpa kode screen |
| P05 | Scan QR | 🔁 | Tab bar B |
| P06 | Hasil scan | 🔁 | Ganti warna warning (G10) |
| P07 | Cari nama (offline) | ✅ | |
| P09 | Naskah MC | ✔︎v0.2 | Caption diperbarui |
| P10 | Pertanyaan dikelompokkan | ✔︎v0.2 | Tab bar B · state Claude gagal ➕ |
| P11 | Rekap feedback | ✅ | |
| — | Poster QR pintu (A5) | ➕ | Aset cetak untuk lokasi & Test Day (G11) |

Tidak dipakai di Konsep B: T06, T07, T08, T09, T10, T12, T13, P02, P08.

### Navigasi panitia (✔︎v0.2, G2)
Tab bar bawah 4 item, aksen amber: **Kontrol** (BP01–BP04) · **Tamu** (P03, P07) · **Scan** (P05/P06) · **Tanya** (P10). Naskah MC (P09) dibuka dari BP02. Persiapan (P04) dari Tamu → "Kirim undangan". Rekap (P11) muncul di Kontrol setelah acara ditutup.

## 5. State yang wajib didesain

| State | Di mana | Isi |
|---|---|---|
| Loading | semua layar data | Skeleton bentuk kartu, bukan spinner penuh |
| Kosong | BT05 (belum ada peserta), kolase 0 foto, P10 0 pertanyaan, P11 belum ada feedback | Kalimat ajakan, contoh: "Belum ada pertanyaan. Biasanya mulai masuk 5 menit setelah talkshow mulai." |
| Offline | tamu & panitia | `OfflineBanner` + jam data terakhir; aksi diantrikan dengan label "menunggu sinkron" |
| Error | kirim pertanyaan, upload foto, submit feedback | Pesan + "Coba lagi"; isian tidak hilang |
| Link tidak valid | T01 dengan token salah | "Link-nya nggak kebaca. Minta link baru ke panitia ya." |
| Belum waktunya | buka link hari-H sebelum 13.00 | T05/T04 dengan countdown |
| Countdown lewat | BT03/BT10 | "Sebentar lagi mulai" |
| Timer lewat | BP02 | Angka danger "+03:12 lewat" |
| Konflik panitia | BP* | Toast "Diubah oleh panitia lain" + state terbaru |
| Izin kamera ditolak | BT01, BT06 | Instruksi singkat + jalur cadangan |

## 6. Motion & micro-interaction (owner: Fawaz)

| Momen | Deskripsi | Durasi (usulan) |
|---|---|---|
| **JEDA → SESI** | Kartu hero paper *morph* (matched geometry) menjadi kartu Live gelap, large title berganti nama sesi, badge Live muncul | spring response 0.45, damping 0.85 |
| **SESI → JEDA** | Kebalikannya; kartu sesi berikutnya naik, countdown mulai | spring response 0.4, damping 0.85 |
| Push / sheet | Halaman detail geser dari kanan; sheet naik dari bawah dengan spring | spring response 0.35, damping 0.9 |
| Tekan | Tombol & baris: scale 0.97 + sorotan kaca | 120 ms |
| Kunci jadi (T03) | Kunci berayun masuk + bunyi "klik" (bunyi opsional, hanya setelah interaksi) | 800ms |
| Check-in berhasil (BT02) | Pintu terbuka / kunci diputar, lalu progress 3 dtk ke JEDA | 3s total |
| Foto ditempel (BT07) | Polaroid jatuh & "nempel" dengan magnet, sedikit miring acak ±4° | 450ms, spring |
| Pertanyaan terkirim (BT09) | Kartu teks terbang mengecil ke atas lalu muncul sebagai `QuestionSentCard` | 400ms |
| Undo toast (BP02) | Ring hitung mundur 5 dtk di tombol Batalkan | 5s linear |
| Countdown | Angka berganti dengan flip halus tiap menit | 250ms |
| LIVE dot | Pulse | 1.6s loop |

Aturan: hormati `prefers-reduced-motion` (ganti jadi fade 150ms). Animasi tidak boleh menunda informasi — teks sudah terbaca sebelum animasi selesai. Haptic ringan (`navigator.vibrate(30)`) saat mode berganti di Android.

## 7. Copy & nada

- Bahasa Indonesia santai, akrab, singkat: "Kamu udah di dalam, Rara!", "Nempel di kulkas!", "Lagi jeda, santai dulu".
- Sapa dengan nama depan. Kata ganti "kamu" untuk tamu, "kami/kita" untuk Potara.
- Kosakata metafora konsisten: **kunci** (tiket QR), **tetangga** (tamu lain), **kulkas polaroid** (galeri), **buku tamu** (feedback), **rumah baru** (kantor).
- Panitia lebih lugas & informatif: "Mulai Talkshow", "Selesaikan sesi", "1 tap → semua HP tamu pindah ke layar sesi".
- Tombol menyebut aksinya + objek: "Mulai Talkshow", bukan "Lanjut".
- Jam format 24 jam dengan titik: 13.00, 14.45. Tanggal: "Minggu, 8 November 2026" / "MIN · 8 NOV".
- Semua nama, tanggal, jam dicek ulang dengan brief (guest star = "menyusul" sampai dikonfirmasi).

## 8. Aksesibilitas

- Kontras: teks body ≥ 4.5:1 (token di §2.1 sudah dicek; orange di atas ink 5.9:1 aman).
- Target sentuh ≥ 44×44 pt; tombol utama 50 pt capsule.
- "Kurangi Transparansi" → material kaca menjadi solid. "Kurangi Gerakan" → spring menjadi fade 150 ms.
- Perubahan mode diumumkan untuk pembaca layar (`aria-live="polite"`: "Sesi dimulai: Talkshow").
- Status tidak hanya dengan warna (ikon + teks pada P06, RundownRow).
- Ukuran huruf mengikuti setting sistem sampai 130% tanpa layout rusak.
- QR & countdown punya teks alternatif (nomor kunci, "12 menit lagi").

## 9. To-do desain sampai 20 Okt

1. Sisa gap di Figma (lihat `prd.md` §13): G6 state gagal BT01, G7 walk-in, G8 hapus foto, G10 warna warning, G11 poster QR pintu. (G1, G2, G4, G9 selesai di Flow v0.2.)
2. Lanjutkan rework iOS v0.3 ke semua layar, lalu jadikan komponen §3 + variabel/text style §2 sebagai design system.
3. Install Switzer di Figma, lalu ganti family di text style `iOS/*`; logo final menyusul.
4. Prototipe klik Figma untuk alur Test Day (tamu & panitia) — dipakai untuk uji internal dan bahan video demo.
5. Spesifikasi motion JEDA ⇄ SESI (Fawaz) dalam bentuk video pendek + nilai durasi/easing.
6. Desain halaman **cara pakai** 1 halaman (tamu · panitia · rencana cadangan sinyal mati).

## 10. Checklist handoff ke build

- [ ] Semua screen B punya ID di nama frame (BT01…, BP01…) sama dengan kode/route.
- [ ] Token diekspor (variabel Figma → CSS variables / JSON).
- [ ] Setiap screen punya state §5 yang relevan.
- [ ] Copy final ditulis di Figma (bukan lorem), sudah dicek nama/jam.
- [ ] Aset: logo SVG, poster QR pintu, ikon, frame polaroid, ilustrasi (jika ada).
- [ ] Nilai motion terdokumentasi.
- [ ] Data dummy konsisten (20 tamu, nama sama di semua layar, mis. Rara Wening #014).
