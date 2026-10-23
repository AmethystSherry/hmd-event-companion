# F2 · Check-in di pintu — Deliverables

22 Okt 2026 · @Pota Design · v1

## Ringkasan

F2 mencakup momen dari tamu nunjukin tiket di pintu sampai tiket "sobek" di HP-nya. Di All Case Flow ada 2 lane (Tamu & Panitia): 7 layar utama, 6 layar case, dan 14 kartu kasus lain/aksi. Hari ini F2 udah dirapikan ke design system Clean v0.5. Tombol dan status custom diganti `Clean/Button` dan `Clean/Badge`, dan 74 warna hex sekarang pakai variabel **Potara Clean / Color**. Card "Pintu masuk" di BP00 juga dapat copy baru. Siap direview tim dan lanjut ke handoff dev.

- **Figma, band F2:** [F2 · Check-in di pintu](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4667-4654) (`4667:4654`)
- **Section lengkap (semua fitur):** [Screen Flow · All Case](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4655-2704)
- **Komponen:** frame `Clean v0.5 / Components` (`4587:276`) di page DOKSLI SAPI
- **Backup sebelum revisi hari ini** (di ujung kanan page DOKSLI SAPI): `4824:5502` (F2 utuh) dan `4820:5449` (BP00 lama)
- **PRD:** `prd.md` v0.2 §7 F2 (belum ditulis ulang; selisihnya ada di [Keputusan & asumsi](#keputusan--asumsi))
- **Font:** Switzer semua. Layar di band di-scale 0,5×, jadi ukuran asli = 2× dari yang terlihat (frame 390×844)

## Flow F2

```
TAMU     (dari F1) T03 Tiket + countdown ── hari-H ──▶ T05 Tiket hari-H (QR, "Belum masuk")
           → discan panitia → T05a "Tiket valid!", tiket mulai sobek (animasi)
           → BT02 "Selamat datang di rumah baru, Rara!" + cap "MASUK 13.04 · tamu ke-9"
           → otomatis 3 dtk / "Masuk sekarang" ──▶ F3 + F4 layar acara (Jeda atau Sesi yang aktif)
           Buka tiket lagi setelah masuk → T03b (QR nonaktif, tiket jadi bukti)

PANITIA  (dari F1) PE03b Home event ── hari-H ──▶ BP00 Kontrol acara (card Pintu masuk)
           → "Scan tiket" → P05 Scan tiket (kamera)
               ├─ QR valid → P06 sheet Valid (tutup 2 dtk, kamera tetap nyala) → scan berikutnya
               ├─ Tiket udah dipakai → P06b "Tiket sudah dipakai" (hitungan nggak nambah)
               ├─ QR bukan tiket acara ini → P06c "Tiket tidak dikenal"
               ├─ Sinyal lemah → P05b check-in diantre, terkirim otomatis
               └─ "Cari nama" → P07 Cari nama · check-in manual (tap ✓)
                    ├─ Kamera ditolak / error → P07b langsung ke Cari nama + banner
                    └─ Nggak ketemu / walk-in → P07c sheet Tambah tamu cepat
           ──▶ F3 Kontrol acara (BP01): mulai sesi pertama
```

## Daftar layar

Total 13 layar: 7 utama + 6 case.

| Kode | Layar | Lane | Jenis | Node |
| --- | --- | --- | --- | --- |
| T05 | Tiket hari-H (QR + "Kecerahan maks", badge Belum masuk) | Tamu | Utama | `4807:729` |
| T05a | Discan, tiket mulai sobek ("Tiket valid!") | Tamu | Utama | `4807:742` |
| BT02 | Tiket sobek · selamat datang (cap masuk, auto 3 dtk) | Tamu | Utama | `4807:756` |
| T03b | Tiket dibuka lagi setelah masuk (QR nonaktif) | Tamu | Kasus lain | `4807:991` |
| BP00 | Home hari-H · Kontrol acara (card Pintu masuk, stat, rundown) | Panitia | Utama | `4814:707` |
| P05 | Scan tiket (kamera + Cari nama) | Panitia | Utama | `4807:775` |
| P05b | Sinyal lemah · antre sinkron | Panitia | Kasus lain | `4807:1236` |
| P06 | Hasil · Valid (sheet) | Panitia | Utama | `4807:805` |
| P06b | Hasil · Sudah dipakai (sheet) | Panitia | Gagal | `4807:1028` |
| P06c | Hasil · Tidak dikenal (sheet) | Panitia | Gagal | `4807:1079` |
| P07 | Cari nama · check-in manual | Panitia | Utama | `4807:851` |
| P07b | Kamera error → Cari nama (banner warning) | Panitia | Gagal | `4807:1129` |
| P07c | Walk-in · tambah tamu cepat (sheet) | Panitia | Kasus lain | `4807:1319` |

### Kartu kasus tanpa layar sendiri

| Kasus | Perilaku | Lane |
| --- | --- | --- |
| HP mati / lupa tiket | Tamu sebut nama ke panitia, dicari lewat P07 | Tamu |
| Lagi offline | Tiket & QR tetap tampil dari cache | Tamu |
| QR susah kebaca | Tap "Kecerahan maks" di pojok kanan atas | Tamu |
| HP tamu offline pas discan | Check-in tetap tercatat; tiket sobek begitu HP online lagi | Tamu |
| Datang pas sesi lagi jalan | Setelah BT02 langsung ke layar Sesi, bukan Jeda | Tamu |
| Dibuka sebelum hari-H | Masih Home event persiapan (PE03b), tombol Scan belum ada | Panitia |
| Tap kartu Check-in | Buka P07, kelihatan siapa aja yang udah masuk | Panitia |
| Panitia lain lagi scan juga | Angka check-in update realtime di semua HP panitia | Panitia |
| Scan berikutnya | Sheet nutup sendiri 2 dtk, kamera tetap nyala | Panitia |
| 2 HP panitia scan tiket yang sama | Yang pertama menang, HP kedua dapat "Sudah dipakai" | Panitia |
| Tap ✓ di baris tamu (aksi) | Status jadi "Udah masuk", tiket di HP tamu ikut sobek | Panitia |
| Ternyata udah masuk | Badge "Udah masuk", nggak ada tombol ✓ | Panitia |
| RSVP-nya "Nggak bisa", tapi datang | Tetap bisa check-in, RSVP ikut jadi Hadir | Panitia |
| Salah tap ✓ (gagal) | Tap Batalkan di toast (5 dtk), status balik "Belum masuk" | Panitia |

## Copy per layar (sesuai Figma sekarang)

| Layar | Copy utama | Tombol / badge |
| --- | --- | --- |
| T05 | "Hari-H · pintu udah dibuka" · **"Tunjukkan QR ke panitia"** · di bawah QR "Tunjukkan ke panitia di pintu" | Badge Neutral "Kecerahan maks", Badge Neutral "Belum masuk" (di tiket) |
| T05a | "Hari-H · pintu dibuka 13.00" · **"Tiket valid!"** | Badge Success "Valid" |
| BT02 | "Masuk 13.04 · tamu ke-9 dari 20" · **"Selamat datang di rumah baru, Rara!"** · "Otomatis lanjut ke layar Jeda dalam 3 detik" · cap "MASUK 13.04 / Tamu ke-9 dari 20" | Badge Success "Sudah masuk", lg primary "Masuk sekarang" |
| T03b | "Tiket kamu · udah dipakai" · **"Kamu udah di dalam"** · baris "QR nonaktif / Discan panitia 13.04 · nggak bisa dipakai lagi" · "QR udah nggak aktif. Tiket ini jadi bukti kamu hadir." | lg primary "Kembali ke acara" |
| BP00 | "Kontrol acara · Minggu, 8 Nov 2026" · **"House Moving Day"** · card: "Pintu masuk · buka sejak 13.00" / **"9 tamu udah masuk"** / "11 lagi belum datang" · stat Check-in 9/20, Foto 0, Pertanyaan 0 · Rundown (4 sesi, "Belum mulai") | Badge Crew "Hari-H · Live", lg primary "Scan tiket", tab bar panitia |
| P05 | "Pintu masuk · 9 dari 20 sudah masuk" · **"Scan tiket"** · "Arahkan ke QR di tiket tamu" | Badge Crew "Hari-H", lg secondary "Cari nama" (ikon search) |
| P05b | sama P05 + strip "Sinyal lemah · 2 check-in nunggu, terkirim otomatis" | sama P05 |
| P06 | Sheet: avatar RW · **"Rara Wening"** · "Kunci #014 · @rarawening" · ✓ · "Tiket di HP tamu sobek otomatis · tutup dalam 2 detik" | Badge Success "Valid · tamu ke-9", Badge Neutral "Masuk 13.04", lg primary "Scan berikutnya" |
| P06b | Sheet: ikon jam · **"Tiket sudah dipakai"** · "Rara Wening sudah masuk 13.04 lewat scan. Hitungan tamu tidak bertambah." | lg primary "Scan berikutnya", lg secondary "Lihat detail tamu" |
| P06c | Sheet: ikon × · **"Tiket tidak dikenal"** · "QR ini bukan tiket House Moving Day. Minta tamu buka tiket dari link WA-nya, lalu scan lagi." | lg primary "Scan lagi" |
| P07 | "Hari-H · 9 dari 20 udah masuk" · **"Cari nama"** · placeholder "Cari nama atau @instagram" · filter "Semua 20 / Belum masuk 11 / Udah masuk 9" · baris: avatar inisial, nama, @ig, status (+ "RSVP: Nggak bisa") | IconButton back, sm secondary "Tambah tamu", Badge Success "Udah masuk" / Neutral "Belum masuk", sm primary icon-only ✓ (aria "Check-in") |
| P07b | P07 + banner warning "Kamera nggak bisa dipakai" / "Langsung pindah ke cari nama. Cocokkan nama + IG tamu, lalu check-in." | sama P07 |
| P07c | hasil kosong "“budi” nggak ada di daftar" / "Tamu walk-in? Tambahkan cepat di bawah." · Sheet **"Tambah tamu cepat"** / "Walk-in · nggak ada di daftar, langsung tercatat masuk" · field Nama, Username Instagram · info "Statusnya langsung "Udah masuk" dan ikut kehitung di jumlah tamu." | lg primary "Tambah & check-in", lg secondary "Batal" |

## Update hari ini (22 Okt, malam)

### Card "Pintu masuk" di BP00

Judul lama "Pintu udah dibuka" cuma ngulang eyebrow. Sub "Tamu lagi check-in · Talkshow 14.00" juga nggak selalu benar, dan infonya udah ada di card Rundown. Sekarang card-nya fokus ke angka kehadiran:

| Bagian | Sebelum | Sesudah |
| --- | --- | --- |
| Eyebrow | Pintu masuk · dibuka 13.00 | Pintu masuk · buka sejak 13.00 |
| Judul | Pintu udah dibuka | **9 tamu udah masuk** |
| Sub | Tamu lagi check-in · Talkshow 14.00 | 11 lagi belum datang |

Copy-nya diusulkan ganti-ganti ngikutin kondisi. Ini belum dibikin layarnya di Figma:

| Kondisi | Eyebrow | Judul | Sub |
| --- | --- | --- | --- |
| Sebelum 13.00 | Pintu masuk | Buka 13.00 | 25 menit lagi · 20 tamu terdaftar |
| Pintu dibuka | Pintu masuk · buka sejak 13.00 | {n} tamu udah masuk | {sisa} lagi belum datang |
| Sesi udah jalan | Pintu masuk · masih dibuka | {n} tamu udah masuk | Yang telat tetap bisa masuk |
| Semua udah datang | Pintu masuk | Semua tamu udah masuk | {n} dari {n} · scan tetap bisa dipakai |

Stat tile "9/20 Check-in" sekarang jadi dobel sama judul card. Masih ada di Figma, menunggu keputusan (lihat Next step).

### Penerapan design system di layar F2

| Perubahan | Layar |
| --- | --- |
| "Tambah tamu" (pill custom) → `Clean/Button` Small · Secondary + ikon user-plus | P07, P07b, P07c |
| Tombol ✓ di baris tamu (6) → `Clean/Button` Small · Primary · Icon only, label tersembunyi "Check-in" | P07, P07b |
| Status "Udah masuk" (4) → `Clean/Badge` Success; "Belum masuk" (6) → `Clean/Badge` Neutral | P07, P07b |
| Kotak "Cari nama / check-in manual" → `Clean/Button` Large · Secondary + ikon search | P05, P05b, P06, P06b, P06c |
| Kotak "9 / 20 sudah masuk" di bawah kamera **dihapus** (dobel sama header) | P05, P05b, P06, P06b, P06c |
| 74 fill hex → variabel `label`, `label-2`, `label-3`, `bg`, `card`, `card-2`, `cta`, `on-cta`, `success-*`, `danger-*` | semua layar F2 |

Hasil audit: semua tombol di F2 udah pakai `Clean/Button` / `Clean/IconButton`, badge pakai `Clean/Badge`, tiket pakai `Clean/Ticket`, `Clean/Ticket · Sobek`, dan `Clean/Ticket · Potongan`, stat pakai `Clean/StatTile`, tab bar pakai `Clean/TabBar · Panitia`.

### Elemen yang belum punya komponen di Figma

Di kode, sebagian elemen ini udah ada (`Badge`, `Chip`, `SearchField`, `Field`, `Sheet`, `Banner`, `Toast`, `ListRow`/`Avatar`, lihat CLAUDE.md). Dev pakai komponen kode itu, jangan bikin versi baru per layar.

| Elemen | Layar | Yang dibutuhin di Figma |
| --- | --- | --- |
| Badge merah "RSVP: Nggak bisa" | P07, P07b | `Clean/Badge` tipe Danger (sekarang custom, warna udah pakai `danger-*`) |
| Search field | P07, P07b, P07c | SearchField |
| Filter chip | P07, P07b | Chip aktif/nonaktif |
| Baris tamu (avatar + nama + @ig + status + ✓) | P07, P07b | `Clean/ListRow` dengan slot status & aksi, Avatar |
| Bottom sheet + grabber + backdrop | P06, P06b, P06c, P07c | Sheet |
| Field input | P07c | Field |
| Banner warning / strip sinyal lemah | P07b, P05b | Banner (warning/info) |
| Viewfinder kamera | P05, P06x, P05b | Pola layar, cukup di kode |
| Baris rundown + progress | BP00 | Bagian F3 |
| **Text style** | semua | Semua 149 teks F2 belum pakai text style `Clean/*`, karena layar di band di-scale 0,5×. Pemetaan untuk dev: 6,5 → Clean/Label (13), 7,5 → Clean/Body (15), 8,5 → Clean/Headline (17), 6 → Clean/Caption (12), 12 → Clean/Card Title (24), 16 → Clean/Title (32) |

## Keputusan & asumsi

Ini yang perlu dicek dan disetujui tim sebelum handoff ke dev. Beberapa poin beda sama prd.md §7 F2.

| Keputusan | Kenapa | Perlu dicek |
| --- | --- | --- |
| Panitia yang scan, tamu cuma nunjukin tiket | Keputusan 18 Okt (QR pintu BT01 dihapus) | — |
| Hari-H otomatis: T03 → T05 di tamu, PE03b → BP00 di panitia | Satu link, satu halaman, dua mode | Jam berapa mulai "hari-H"? Usul: 00.00 WIB 8 Nov |
| Hasil scan pakai sheet yang tutup sendiri 2 dtk, kamera tetap nyala | Antrean di pintu (R3) | — |
| Tiket sobek realtime di HP tamu, lalu otomatis ke layar acara 3 dtk | Momen "selamat datang" | — |
| **"Kecerahan maks" di web** | Browser nggak bisa ngatur brightness layar HP | Ganti jadi mode QR layar penuh latar putih + Wake Lock? |
| **Walk-in** lewat P07c (nama + IG, langsung masuk) | Ada tamu yang nggak di daftar | Belum ada di PRD. Walk-in ikut nambah pembagi "dari 20"? |
| RSVP "Nggak bisa" tapi datang → tetap check-in, RSVP jadi Hadir | Jangan nolak tamu di pintu | Belum ada di PRD |
| Salah tap ✓ → toast Batalkan 5 dtk | Check-in manual rawan salah tap | Belum ada di PRD |
| Pembagi "9 dari 20" | Sekarang = semua tamu di daftar (termasuk yang RSVP Nggak bisa) | Ganti jadi tamu RSVP Hadir + walk-in? |
| Cari nama pakai nama / @IG | Sesuai Figma | PRD juga minta **kode pendek** (HMD-014-7F3K). Tambah ke placeholder? |
| "Unduh daftar manual (PDF)" | Ada di PRD & HANDOFF (P07d) | **Nggak ada di band F2.** Tetap dibangun atau di-drop? |
| Validasi offline di HP panitia | PRD: cek tanda tangan lokal | Secret HMAC nggak boleh ada di browser. Usul: unduh daftar ticketId + status ke HP panitia (setelah PIN), validasi lokal pakai daftar itu, sinkron saat online |
| Haptic + bunyi pas Valid | PRD F2 langkah 3 | `navigator.vibrate` nggak jalan di iPhone. Bunyi aja di iOS |

### Usulan copy yang belum diterapkan

Hasil review copy F2, belum diubah di Figma. Dev ikut Figma sekarang. Kalau disetujui, ubah di Figma dulu.

| Layar | Sekarang | Usulan |
| --- | --- | --- |
| Semua | "sudah/tidak" campur "udah/nggak" | Satu gaya: udah/nggak |
| T05 | Header statis "pintu udah dibuka" | Ikut jam: sebelum 13.00 "Pintu dibuka 13.00 · 25 menit lagi" |
| T05 | Teks di bawah QR dobel sama header | Hapus "Tunjukkan ke panitia di pintu" |
| T05a | "Tiket valid!" | "Kuncinya cocok!" |
| BT02 | "Otomatis lanjut ke layar Jeda dalam 3 detik" | Countdown di tombol: "Masuk sekarang · 3" ("Jeda" itu istilah internal) |
| BT02 | Header + cap sama-sama "tamu ke-9" | Cukup di cap |
| P06 | Badge "Valid · tamu ke-9" | "✓ Boleh masuk" |
| P06 | "Tiket di HP tamu sobek otomatis · tutup dalam 2 detik" | Countdown di tombol: "Scan berikutnya · 2" |
| P06b | "Tiket sudah dipakai / … Hitungan tamu tidak bertambah." | "Tiket ini udah dipakai" / "Rara masuk 13.04, discan oleh {panitia}. Kalau orangnya beda, cek lewat Cari nama." |
| P06c | "Tiket tidak dikenal" | "Ini bukan tiket acara ini" + tombol "Cari nama" |
| P07 | Header "9 dari 20 udah masuk" dobel sama filter | Hapus dari header |
| P07b | "Langsung pindah ke cari nama…" | "Check-in lewat nama dulu ya. Cocokkan nama + IG, lalu tap ✓." + link "Buka Pengaturan" kalau izin ditolak |
| P07c | "Langsung tercatat masuk" ditulis 2× | Cukup sekali; Nama terisi dari pencarian; IG "(opsional)" |
| T03b | "QR nonaktif" ditulis 3× | Cukup sekali |
| Cerita · F2 | "Sinyal lemah? … semua tetap online" | "… scan tetap jalan" |

## Next step

- [ ] Review flow F2 dan kasih komentar langsung di Figma
- [ ] Putuskan poin di tabel "Keputusan & asumsi" (terutama walk-in, pembagi "dari 20", PDF daftar manual, kecerahan di web)
- [ ] Putuskan usulan copy, lalu terapkan di Figma
- [ ] Stat tile "Check-in" di BP00: hapus atau ganti isi (dobel sama card Pintu masuk)
- [ ] Buat 3 varian card Pintu masuk (sebelum buka, sesi jalan, semua datang)
- [ ] Putuskan komponen Figma baru: Badge Danger, SearchField, Chip, Sheet, Field, Banner, ListRow + slot
- [ ] Putuskan apakah layar flow dibuat 1× (390) supaya text style bisa dipasang
- [ ] Update prd.md §7 F2 sesuai keputusan di atas
- [ ] Handoff ke dev pakai `F2-prompt-claude-code.md`
