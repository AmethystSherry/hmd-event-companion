# N4 · Foto buat kolase polaroid — Deliverables

24 Okt 2026 · @Pota Design · v1 (desain ready untuk dev)

## Ringkasan

N4 adalah fitur nilai tambah buat tamu: pas **Jeda**, tamu tap "Foto buat kolase" → kamera dengan bingkai polaroid (nama + tanggal) → sekali jepret = 1 foto, dikompres di HP, langsung nempel di kolase bareng. Kolase lengkap baru dibuka di akhir acara (F5 · T15).

Section N4 cuma punya **1 lane (Tamu)**: 5 layar (2 utama + 3 case) dan 3 kartu kasus.

- **Figma, section N4:** [N4 · Foto buat kolase polaroid](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4670-4981) (`4670:4981`)
- **Section lengkap:** [Screen Flow · All Case](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4655-2704)
- **Komponen:** frame `Clean v0.5 / Components` (`4587:276`)
- **PRD:** `prd.md` v0.2 §7 N4 + §8 (entitas Photo) + §9 (foto dikompres)
- **design.md:** §5 (Izin kamera ditolak, Error foto), §6 (motion "Foto ditempel"), §7 (kosakata "kulkas polaroid")
- **Font:** Switzer. Layar di section di-scale 0,5×, ukuran asli = 2× (frame 390×844)

## Flow N4

```
TAMU  (dari F3) BT03 Jeda ── tap "Foto buat kolase" ──▶ BT06 Kamera kolase
        ├─ Izin kamera ditolak → BT06b (cara nyalain izin + "Coba lagi")
        └─ Jepret → foto dikompres di HP → upload
              ├─ Berhasil → BT07 "Nempel di kulkas!" + strip 4 foto terbaru + "+N"
              │     ├─ Tap "+N" sebelum acara selesai → BT07c toast "Kolase lengkap dibuka pas acara selesai (± 17.00)"
              │     ├─ "Foto lagi" → BT06
              │     └─ "Kembali ke jeda" → layar acara (BT03)
              └─ Gagal / offline → BT07b "Fotomu lagi antre" (foto aman di HP, dikirim otomatis)
                    ├─ "Coba kirim sekarang" → kirim ulang → BT07
                    └─ "Kembali ke jeda" → antrean tetap jalan di belakang
        ──▶ F5 · T15 Kolase kulkas (dibuka pas acara ditutup)
```

## Daftar layar

| Kode | Layar | Jenis | Node | Tema |
| --- | --- | --- | --- | --- |
| BT06 | Kamera kolase | Utama | `4675:18966` | Gelap tetap (kamera) |
| BT07 | Foto masuk kolase | Utama | `4675:18986` | Ikut tema |
| BT06b | Izin kamera ditolak | Gagal | `4748:9466` | Gelap tetap (kamera) |
| BT07b | Gagal upload (diantre) | Gagal | `4748:9511` | Ikut tema |
| BT07c | Tap +N sebelum acara selesai | Kasus lain | `4906:18010` | Ikut tema |

### Kartu kasus

| Kasus | Perilaku | Layar |
| --- | --- | --- |
| Izin kamera ditolak | Info cara nyalain izin kamera + "Coba lagi" | BT06b |
| Gagal upload | Foto diantre di HP, dikirim lagi pas sinyal balik | BT07b |
| Tap +N sebelum acara selesai | Toast "Kolase lengkap dibuka pas acara selesai", tetap di BT07 | BT07c |
| Berulang (chip) | "Foto lagi" → BT06, atau "Kembali ke jeda" | — |

Annotation di tile "+30" (BT07c): *"Semua kolase foto dari Foto saya dan Foto tamu nanti akan bisa diakses setelah acara selesai."*

## Detail per layar

Ukuran di bawah sudah dikali 2 (ukuran asli 390×844).

### BT06 · Kamera kolase

- **Latar** `#0A0A0A`, tetap gelap di light & dark (sama seperti viewfinder P05).
- **Toolbar:** `IconButton` varian `glass` kiri ikon `X` (tutup → layar acara), kanan ikon `Lightning` (flash/senter). Tengah: pill glass "● Kulkas polaroid" (titik oranye 6px).
- **Polaroid** (lebar 328, putih, radius 6, padding 14 atas/kiri/kanan, 18 bawah):
  - Viewfinder 300×360 (**rasio 5:6**), isi = preview kamera live. Placeholder saat loading: gradient gelap `#594D42 → #1F1C1A`.
  - Caption di bawah viewfinder, kiri "**{nama depan} · rumah baru**" (Medium, `#0F0F0F`), kanan "**8.11.26**" (Regular, `#666`). Ukuran t-label (13). Warna polaroid tetap (benda fisik), tidak ikut dark mode.
- Teks di bawah polaroid: "Fotomu langsung nempel di kolase bersama." (t-label, putih 60%).
- **Bar bawah** (tinggi 84, padding samping 40): kiri thumbnail 48×48 radius 12 border putih 2px (foto terakhir); tengah tombol jepret 80 (lingkaran putih + ring); kanan tombol glass 48 ikon `CameraRotate` (ganti kamera depan/belakang).
- HomeIndicator putih.

### BT07 · Foto masuk kolase

- Latar `--bg`. Konten di tengah atas, gap 12:
  - **Polaroid kecil** miring **+4°** (acak ±4° per foto, design.md §6), putih, padding 12/12/16, foto 170×200, caption "{nama depan} · rumah baru", shadow `0 6px 15px rgba(0,0,0,.07)`. Animasi masuk: jatuh & "nempel" 450 ms spring; reduced motion → fade 150 ms.
  - Ikon `Check` dalam lingkaran 44 `--success-soft`.
  - Judul **"Nempel di kulkas!"** (t-title 32, Semibold).
  - Body "Fotomu sekarang bagian dari kolase bareng **{n}** foto tamu lain." (t-body 15, `--label-2`, center, lebar 300).
  - **Strip foto**: 4 thumbnail 52×52 radius 12 gap 8 (foto terbaru) + tile `--card` "+{sisa}" (t-label, `--label-2`).
- **Aksi bawah** (2 tombol lg, `Screen bottom` + fade scroll-edge): primary "**Foto lagi**" (ikon `Camera`) + secondary "**Kembali ke jeda**".

### BT06b · Izin kamera ditolak

- Sama dengan BT06, tapi viewfinder diganti latar `--card-2` + ikon `CameraSlash` 40 + "Kamera belum diizinkan" (t-body Medium, `--label-2`).
- Teks bawah polaroid & bar jepret **disembunyikan**.
- Card `--card` radius 20 padding 16: judul "**Cara nyalain izin kamera**" (t-body Medium) + 3 langkah bernomor (bulatan 22 `--accent-soft`, angka `--accent-text`):
  1. "Tap ikon aA / gembok di address bar"
  2. "Pilih Izin situs › Kamera › Izinkan"
  3. "Balik ke sini, lalu tap Coba lagi"
- Aksi bawah: lg **secondary** "**Coba lagi**" (ikon `ArrowClockwise`) → minta izin lagi.

### BT07b · Gagal upload (diantre)

- Layout sama BT07, tapi:
  - Polaroid opacity 70%, shadow lebih tebal (`0 12px 30px rgba(0,0,0,.12)`).
  - Ikon `CloudArrowUp` dalam lingkaran `--warning-soft`.
  - Judul "**Fotomu lagi antre**".
  - Body "Sinyalnya lemah. Fotomu aman di HP dan dikirim otomatis begitu sinyal balik."
  - Pill `--card` ikon `Hourglass` + "**{k} foto menunggu sinyal**".
  - Strip foto tetap tampil.
- Aksi bawah: primary "**Coba kirim sekarang**" (ikon `ArrowClockwise`) + secondary "**Kembali ke jeda**".

### BT07c · Tap +N sebelum acara selesai

- BT07 + tile "+N" dapat border oranye (`--accent`) sebagai state ditekan.
- **Toast** gelap di atas tombol bawah: ikon `Info` + "**Kolase lengkap dibuka pas acara selesai (± 17.00)**". Pakai komponen `Toast` yang ada; jam diambil dari jam selesai event.

## Copy per layar (sesuai Figma)

| Layar | Copy | Tombol |
| --- | --- | --- |
| BT06 | Pill "Kulkas polaroid" · caption "{nama} · rumah baru" / "8.11.26" · "Fotomu langsung nempel di kolase bersama." | IconButton X, IconButton Lightning, shutter, ganti kamera |
| BT07 | **"Nempel di kulkas!"** · "Fotomu sekarang bagian dari kolase bareng 34 foto tamu lain." · tile "+30" | lg primary "Foto lagi" (Camera), lg secondary "Kembali ke jeda" |
| BT06b | "Kamera belum diizinkan" · **"Cara nyalain izin kamera"** · 3 langkah (lihat atas) | lg secondary "Coba lagi" (ArrowClockwise) |
| BT07b | **"Fotomu lagi antre"** · "Sinyalnya lemah. Fotomu aman di HP dan dikirim otomatis begitu sinyal balik." · "1 foto menunggu sinyal" | lg primary "Coba kirim sekarang" (ArrowClockwise), lg secondary "Kembali ke jeda" |
| BT07c | Toast "Kolase lengkap dibuka pas acara selesai (± 17.00)" | sama BT07 |

## Penerapan design system

| Elemen | Pakai | Catatan |
| --- | --- | --- |
| Tombol bawah | `Button` lg primary / secondary | Primary oranye (v0.5). Semua dari `Clean/Button` |
| X, Lightning | `IconButton` varian `glass` | Sama seperti di kamera scan |
| Toast BT07c | `Toast` | Tanpa undo ring |
| StatusBar, HomeIndicator | `Screen` | — |
| Pill "Kulkas polaroid" | **custom** (pill glass + dot) | Belum ada komponen; bisa jadi varian `Pill` glass |
| Polaroid (frame + caption) | **baru: `Polaroid`** | Dipakai lagi di T15/T15b (F5). Bikin sekali di `components/ui` |
| Shutter + bar kamera | **custom di `components/n4`** | Khusus layar ini |
| Strip foto + tile "+N" | **baru: `PhotoStrip`** | Bisa dipakai di F5 juga |
| Card langkah izin | `Card` + `NumberedRow` | Cek apakah `NumberedRow` muat bulatan 22 |
| Pill antrean BT07b | `Pill` / `Badge` netral + ikon | — |

Warna hardcode yang disengaja tetap di light & dark: latar kamera `#0A0A0A`, polaroid putih + caption `#0F0F0F` / `#666`, gradient placeholder thumbnail (nanti diganti foto asli).

**Text style** (skala band 0,5×): 6,5 → t-label (13), 7,5 → t-body (15), 8,5 → t-headline (17), 16 → t-title (32).

## Temuan dari review

| Temuan | Layar | Saran |
| --- | --- | --- |
| **Instagram in-app browser**: link tamu dibuka dari DM IG, dan `getUserMedia` sering nggak jalan di webview IG (terutama iOS). Langkah "aA / gembok" juga nggak ada di webview IG | BT06, BT06b | Tambah jalur cadangan `<input type="file" accept="image/*" capture>` (buka kamera bawaan HP), dan copy "Buka di Safari/Chrome" kalau terdeteksi in-app browser |
| "kolase **bersama**" (BT06) vs "kolase **bareng**" (BT07) | BT06, BT07 | Satu kata: "bareng" |
| Tombol Lightning (flash) masih tampil di BT06b | BT06b | Sembunyikan / nonaktif kalau kamera belum jalan |
| Flash: iPhone Safari nggak support senter lewat web | BT06 | Tampilkan tombol cuma kalau `track.getCapabilities().torch` ada |
| Thumbnail kiri di bar kamera: perilaku tap belum jelas | BT06 | Usul: foto terakhirmu; tap → BT07. Kalau belum ada foto → sembunyikan |
| Belum ada state **0 foto tamu lain** / strip < 4 foto | BT07 | Usul copy: "Kamu yang pertama nempel di kulkas!" + strip sesuai jumlah, tanpa "+N" |
| "Kembali ke jeda" padahal sesi bisa udah mulai pas tamu lagi foto | BT07, BT07b | Usul label "Kembali ke acara" (sama dengan T03b), atau label ikut mode |
| Nggak ada preview / ulang jepret ("1 jepret = 1 foto, langsung") | BT06 → BT07 | Oke sesuai cerita. Hapus foto sendiri ada di F5 (T15b); pastikan tamu tahu (mis. caption kecil di BT07) |
| Tanggal "8.11.26" beda gaya dengan konvensi tanggal lain | BT06 | Oke sebagai gaya polaroid; ambil dari tanggal event, jangan hardcode |
| Strip BT07 nampilin foto tamu lain sebelum kolase dibuka | BT07 | Konfirmasi ini memang boleh (sebagai teaser). Kalau nggak, strip cuma fotomu + blur |

## Keputusan & asumsi

| Keputusan | Kenapa | Perlu dicek |
| --- | --- | --- |
| Hanya tamu yang **udah check-in** yang bisa foto | Kolase isinya tamu yang hadir | — |
| Akses dari tombol "Foto buat kolase" di BT03 Jeda | Sesuai section ("Kapan: Pas Jeda") | BT03 belum dibangun (F3). Sementara tombol ditaruh di placeholder `/t/[token]/acara` |
| Kalau sesi mulai saat tamu di kamera → **nggak dipaksa pindah** | Jangan putus momen foto | Setelah BT07, "Kembali ke jeda" ke layar acara (bisa Sesi) |
| Kamera default **depan** (selfie), preview di-mirror, hasil simpan **tidak** mirror | Foto kolase biasanya selfie/wefie | Atau default belakang? |
| Yang disimpan = foto mentah crop 5:6, **frame polaroid digambar UI** | Kolase F5 & story 9:16 bisa atur sendiri gayanya | Atau "bakar" frame + nama ke foto? |
| Kompres di HP: sisi panjang 1280 px, JPEG, turunkan quality sampai **≤ 400 KB**; + thumbnail ±320 px (≤ 40 KB) | PRD §7 N4, §9; strip & masonry ringan | — |
| Upload ditunggu ≤ 5 dtk → BT07; lewat / offline → BT07b + antrean IndexedDB, retry tiap 5 dtk & saat `online` | Sama pola antrean check-in F2 | — |
| Idempoten per `clientId` (UUID dari HP) | Retry jaringan nggak bikin foto dobel | — |
| Simpan foto di **Supabase Storage** (bucket privat), lokal di `.data/photos/` | Store sekarang 1 baris JSON, nggak boleh isi gambar | Kuota free 1 GB, cukup (±20 tamu) |
| Foto dicatat dengan `sessionId` terakhir (sesi yang lagi/terakhir jalan) | T15 punya filter per sesi (HANDOFF Phase 6) | — |
| Batas **20 foto per tamu** | Jaga kuota & spam | Angka oke? |
| "{n} foto tamu lain" = foto aktif milik tamu lain; "+N" = total − 4 | Sesuai copy | — |
| Hapus foto sendiri: API dibuat sekarang, UI di F5 (T15b) | PRD: bisa dihapus sampai acara ditutup | — |
| Tile "Foto" di BP00 (panitia) = jumlah foto, realtime | Stat tile udah ada di F2 | — |
| Hapus otomatis 8 Des 2026 (H+30) ikut foto | PRD §8 | Belum ada job; catat untuk Phase 8 |

## Next step

- [ ] Review N4 & putuskan poin "Keputusan & asumsi" (kamera default, frame dibakar atau tidak, batas foto, strip foto tamu lain)
- [ ] Putuskan perbaikan temuan review (in-app browser IG, bersama/bareng, state 0 foto, label "Kembali ke jeda")
- [ ] Handoff ke dev pakai `N4-prompt-claude-code.md`
- [ ] Setelah F3 jadi, pindahkan tombol "Foto buat kolase" ke BT03 asli
