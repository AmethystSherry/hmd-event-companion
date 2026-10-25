# N4 · Foto buat kolase polaroid — Deliverables

25 Okt 2026 · @Pota Design · **v2** (hasil foto jadi sheet di atas home, layar baru BT07d Galeri & BT07e Foto pertama)

## Ringkasan

N4 adalah fitur nilai tambah buat tamu. Dari home (**Jeda atau Sesi**), tamu tap tombol kamera (FAB) → kamera dengan bingkai polaroid (nama + tanggal). Sekali jepret = 1 foto, langsung dikompres di HP. Abis jepret, kamera nutup dan **sheet "Nempel di kulkas!" muncul di atas home**. Fotomu sendiri bisa dilihat & dihapus dari **Galeri** (pintasan di home) sampai acara ditutup. Kolase lengkap (foto saya + foto tamu) dibuka di akhir acara (F5 · T15).

Section N4 punya 1 lane (Tamu): **8 layar** (BT03 sebagai titik mulai, 2 utama, 5 case) dan 6 kartu kasus.

- **Figma, section N4:** [N4 · Foto buat kolase polaroid](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4670-4981) (`4670:4981`)
- **Komponen:** frame `Clean v0.5 / Components` (`4587:276`)
- **PRD:** `prd.md` v0.2 §7 N4 + §8 (Photo) + §9
- **Status kode:** N4 v1 udah dibangun 24 Okt (lihat "Aturan N4 di kode" di CLAUDE.md). Dokumen ini = acuan untuk update ke v2.
- **Font:** Switzer. Layar di section di-scale 0,5×, ukuran asli = 2× (frame 390×844)

## Flow N4 (v2)

```
TAMU  BT03 Home (Jeda / Sesi)
        ├─ Tap FAB kamera ──▶ BT06 Kamera kolase
        │     ├─ Izin kamera ditolak → BT06b ("Coba lagi" / "Pakai kamera HP")
        │     └─ Jepret → kompres → upload → kamera nutup, balik ke home + sheet:
        │           ├─ Terkirim            → BT07  sheet "Nempel di kulkas!" (strip 4 foto tamu + "+N")
        │           ├─ Foto pertama di event → BT07e sheet "Kamu yang pertama!" (strip cuma fotomu, tanpa +N)
        │           ├─ Gagal / offline     → BT07b sheet "Fotomu lagi antre" (dikirim otomatis pas sinyal balik)
        │           └─ Tap "+N"            → BT07c toast "Kolase lengkap kebuka pas acara selesai (± 17.00)"
        │         Sheet: "Foto lagi" → BT06 · "Selesai" → sheet nutup, tetap di home (Jeda / Sesi)
        ├─ Tap pintasan "Galeri" ──▶ BT07d sheet Galeri foto
        │     ├─ Tab "Foto saya · n": grid polaroid + 🗑 hapus + tile "Foto lagi" → BT06
        │     └─ Tab "Foto tamu" 🔒: kekunci sampai acara selesai
        └─ Sesi mulai pas lagi foto → nggak dipaksa pindah; "Selesai" → balik ke layar Sesi yang lagi jalan
        ──▶ F5 · T15 Kolase kulkas (dibuka pas acara ditutup)
```

## Daftar layar

| Kode | Layar | Jenis | Node | Status v2 |
| --- | --- | --- | --- | --- |
| BT03 | Jeda (home tamu) + FAB kamera | Titik mulai | `5027:5661` | **baru di section** (F4, udah ada di kode) |
| BT06 | Kamera kolase | Utama | `5030:13770` | berubah (copy) |
| BT07 | Nempel di kulkas (**sheet**) | Utama | `5030:13821` | **dirombak** |
| BT06b | Izin kamera ditolak | Gagal | `5030:13790` | berubah (2 tombol) |
| BT07b | Fotomu lagi antre (sheet) | Gagal | `5030:13898` | **dirombak** |
| BT07c | Tap +30 sebelum acara selesai (sheet + toast) | Kasus lain | `5030:13979` | **dirombak** |
| BT07d | Galeri · Foto saya (sheet) | Kasus lain | `5030:14132` | **baru** |
| BT07e | Foto pertama di kulkas (sheet) | Kasus lain | `5030:14060` | **baru** |

Node v1 (`4675:18966`, `4675:18986`, `4748:9466`, `4748:9511`, `4906:18010`) udah nggak dipakai.

### Kartu kasus

| Kasus | Perilaku | Layar |
| --- | --- | --- |
| Tap Galeri di home | Foto saya bisa dihapus sampai acara ditutup. Foto tamu kebuka pas acara selesai | BT07d |
| Izin kamera ditolak | Cara nyalain izin, atau Pakai kamera HP (browser IG) | BT06b |
| Gagal upload | Foto diantre di HP, dikirim lagi pas sinyal balik | BT07b |
| Tap +30 sebelum acara selesai | Toast: kolase lengkap (foto saya + tamu) kebuka pas acara selesai | BT07c |
| Foto pertama di kulkas | "Kamu yang pertama!", strip cuma fotomu, tanpa +N | BT07e |
| Sesi mulai pas lagi foto | Nggak dipaksa pindah. Selesai → balik ke layar Sesi yang lagi jalan | — |
| Berulang (chip) | Foto lagi → BT06. Selesai → sheet nutup, balik ke BT03 / layar sesi | — |

## Yang berubah dari v1 (24 Okt → 25 Okt)

| Bagian | v1 (yang udah di kode) | v2 (Figma sekarang) |
| --- | --- | --- |
| Kapan | Pas Jeda | **Pas Jeda atau Sesi** (FAB kamera di home, udah ada dari F4) |
| BT07 / BT07b / BT07c | Layar penuh di `/foto` | **Bottom sheet di atas home** (`acara/`) + backdrop; kamera nutup setelah jepret |
| Ikon status | Lingkaran ✓ / awan di bawah polaroid | **Badge bulat di pojok kanan atas polaroid** (✓ hijau = terkirim, ⌛ abu = antre) + **magnet oranye** di tengah atas polaroid |
| Polaroid BT07 | Miring +4° | Miring **−4°** (tetap acak ±4°) |
| Tombol kedua | "Kembali ke acara" (v1 Figma: "Kembali ke jeda") | **"Selesai"** → sheet nutup |
| Copy BT07 | "Fotomu sekarang bagian dari kolase bareng {n} foto tamu lain." | **"Fotomu udah nempel bareng {n} foto tamu lain."** |
| Copy BT07b | "{k} foto menunggu sinyal" | **"{k} foto nunggu sinyal"** |
| Toast BT07c | "Kolase lengkap dibuka pas acara selesai" | **"Kolase lengkap kebuka pas acara selesai (± 17.00)"** |
| 0 foto tamu lain | Kode: teks "Kamu yang pertama nempel di kulkas!", tanpa strip | **BT07e**: judul "Kamu yang pertama!", body baru, **strip cuma fotomu**, tanpa +N |
| Galeri | `/t/[token]/galeri` placeholder | **BT07d sheet Galeri foto** (Foto saya + hapus, Foto tamu terkunci) |
| BT06b | secondary "Coba lagi" + TextAction "Pakai kamera bawaan HP" | **lg primary "Coba lagi" + lg secondary "Pakai kamera HP"** (ikon Camera); Lightning disembunyikan |
| BT06b langkah | "Pilih Izin situs › …", "Balik ke sini, lalu tap Coba lagi" | **"Izin situs › Kamera › Izinkan"**, **"Balik ke sini, tap Coba lagi"** |
| BT06 caption | "Fotomu langsung nempel di kolase bareng." | **"Jepret sekali, langsung nempel di kulkas bareng."** |

## Detail per layar

Ukuran sudah dikali 2 (frame asli 390×844).

### BT03 · Home (titik mulai)

Udah ada dari F4 (`AcaraScreen`). Yang dipakai N4: **FAB kamera** (Button primary icon-only 54, kanan atas panel) → BT06, dan pintasan **Galeri** → BT07d. Di Figma badge status tertulis **"Sedang jeda"**, di kode "Lagi jeda" (lihat Temuan).

### BT06 · Kamera kolase

Sama dengan v1, kecuali:

- Caption di bawah polaroid: **"Jepret sekali, langsung nempel di kulkas bareng."** (t-label, putih 60%).
- Thumbnail kiri = foto terakhirmu (foto asli, bukan gradient).
- Setelah jepret: kamera **nutup**, tamu balik ke home dengan sheet BT07 / BT07b / BT07e.

### BT07 · Nempel di kulkas (sheet)

Di atas home (BT03 tetap kelihatan di belakang) + backdrop `rgba(16,16,16,.45)`.

- **Sheet** `--card`, radius atas 28, padding 12 atas / 20 samping / 34 bawah, handle 36×5 `--separator`.
- **Polaroid** (padding 18 atas+bawah area): putih, radius 4, padding 10/10/14, foto **150×170**, caption "{nama depan} · rumah baru" (t-caption 12, `#0F0F0F`), shadow `0 8px 10px rgba(0,0,0,.12)`, miring **−4°** (acak ±4° per foto).
  - **Magnet** oranye 16 di tengah atas (asset dari Figma).
  - **Badge status** 30 di pojok kanan atas: `--success-text` + border 3px `--card` + ikon Check putih.
  - Animasi masuk: jatuh & nempel 450 ms spring (reduced motion → fade 150 ms).
- Judul **"Nempel di kulkas!"** (t-card-title 24, Semibold, center).
- Body **"Fotomu udah nempel bareng {n} foto tamu lain."** (t-body 15, `--label-2`, center).
- **Strip** (padding 18 atas+bawah): 4 thumbnail 52 radius 12 gap 8 (foto tamu lain terbaru) + tile `--card-2` "+{sisa}" (t-label, `--label-2`).
- Aksi: lg primary **"Foto lagi"** (Camera) + lg secondary **"Selesai"**.

### BT07b · Fotomu lagi antre (sheet)

Sama dengan BT07, tapi:

- Badge status **abu** (`--label-3`/netral) + ikon `Hourglass`.
- Judul **"Fotomu lagi antre"**. Body "Sinyalnya lemah. Fotomu aman di HP dan dikirim otomatis begitu sinyal balik."
- Pill `--card-2` ikon Hourglass + **"{k} foto nunggu sinyal"** di atas strip.
- Aksi: lg primary **"Coba kirim sekarang"** (ArrowClockwise) + lg secondary **"Selesai"**.
- Begitu terkirim (sheet masih kebuka) → berubah jadi BT07.

### BT07c · Tap +30 sebelum acara selesai

BT07 + tile "+N" border `--accent` (state ditekan) + **Toast** gelap di atas tombol: ikon Info + **"Kolase lengkap kebuka pas acara selesai (± {jam selesai})"**.

### BT07e · Foto pertama di kulkas (sheet)

Dipakai kalau **belum ada foto tamu lain** di event.

- Polaroid + magnet + badge ✓ hijau (sama BT07).
- Judul **"Kamu yang pertama!"**. Body **"Kulkasnya masih sepi. Ajak yang lain ikut foto, ya."**
- Strip: **cuma fotomu** (thumbnail kecil, maks 4), tanpa tile "+N".
- Aksi: lg primary "Foto lagi" + lg secondary "Selesai".

### BT07d · Galeri · Foto saya (sheet)

Dari pintasan **Galeri** di home. Sheet lebih tinggi (mulai ±y 195).

- Header kiri: **"Galeri foto"** (t-card-title 24) + **"Kolase lengkap kebuka pas acara selesai (± 17.00)"** (t-label, `--label-2`).
- **Segmented** 2 tab: **"Foto saya · {n}"** (aktif) / ikon `LockSimple` + **"Foto tamu"** (nonaktif, `--label-3`).
- **Grid 2 kolom** (lebar slot 168, gap 14 horizontal / 18 vertikal):
  - Polaroid putih radius 4, padding 8/8/10, foto 152×170, miring kecil berganti (+2°, −2°, +1,5°…), shadow `0 6px 7px rgba(0,0,0,.1)`.
  - Caption: kiri **"{nama depan} · {jam}"** (jam foto, mis. "Rara · 13.12"), kanan ikon `Trash` 16 (hapus).
  - Tile terakhir **"Foto lagi"**: `--card-2`, border 1.5px dashed `--accent`, radius 8, ikon Camera 28 + teks t-label `--accent-text` → BT06.
- Scroll di dalam sheet kalau foto banyak.

### BT06b · Izin kamera ditolak

Sama dengan v1, kecuali:

- Toolbar cuma **X** (Lightning disembunyikan).
- Langkah: 1 "Tap ikon aA / gembok di address bar" · 2 **"Izin situs › Kamera › Izinkan"** · 3 **"Balik ke sini, tap Coba lagi"**.
- Aksi: lg **primary "Coba lagi"** (ArrowClockwise) + lg **secondary "Pakai kamera HP"** (Camera) → input file `capture`.

## Copy per layar (sesuai Figma v2)

| Layar | Copy | Tombol |
| --- | --- | --- |
| BT06 | Pill "Kulkas polaroid" · "{nama} · rumah baru" / "8.11.26" · "Jepret sekali, langsung nempel di kulkas bareng." | X, Lightning, shutter, ganti kamera |
| BT07 | **"Nempel di kulkas!"** · "Fotomu udah nempel bareng 34 foto tamu lain." · "+30" | lg primary "Foto lagi", lg secondary "Selesai" |
| BT07b | **"Fotomu lagi antre"** · "Sinyalnya lemah. Fotomu aman di HP dan dikirim otomatis begitu sinyal balik." · "1 foto nunggu sinyal" | lg primary "Coba kirim sekarang", lg secondary "Selesai" |
| BT07c | Toast "Kolase lengkap kebuka pas acara selesai (± 17.00)" | sama BT07 |
| BT07e | **"Kamu yang pertama!"** · "Kulkasnya masih sepi. Ajak yang lain ikut foto, ya." | lg primary "Foto lagi", lg secondary "Selesai" |
| BT07d | **"Galeri foto"** · "Kolase lengkap kebuka pas acara selesai (± 17.00)" · tab "Foto saya · 3" / "Foto tamu" · caption "Rara · 13.12" · tile "Foto lagi" | ikon Trash per foto |
| BT06b | "Kamera belum diizinkan" · **"Cara nyalain izin kamera"** · 3 langkah | lg primary "Coba lagi", lg secondary "Pakai kamera HP" |

## Penerapan design system

| Elemen | Pakai | Catatan |
| --- | --- | --- |
| Sheet hasil & galeri | `Sheet` (yang ada) | Backdrop 45%, handle; pushState seperti sheet F4 |
| Tombol | `Button` lg primary / secondary | — |
| Polaroid + magnet + badge status | `Polaroid` (yang ada) → **tambah prop** `magnet`, `status: "sent" \| "queued"`, `caption` kanan opsional (ikon hapus) | Jangan bikin komponen polaroid kedua |
| Strip + "+N" | `PhotoStrip` (yang ada) | Varian tanpa "+N" untuk BT07e |
| Tab Foto saya / Foto tamu | `Segmented` | Perlu opsi ikon + disabled per item (Lock) |
| Tile "Foto lagi" | **custom** di `components/n4` | Bisa jadi varian `AddChip`/Dropzone kecil |
| Toast BT07c | `Toast` | — |
| Pill antrean | `Pill` + ikon Hourglass | — |
| Hapus foto | `Dialog` konfirmasi (sama dengan T15b F5) | — |

Warna hardcode yang tetap di light & dark: latar kamera `#0A0A0A`, polaroid putih + caption `#0F0F0F`, backdrop sheet.

**Text style** (skala 0,5×): 6 → t-caption (12), 6,5 → t-label (13), 7,5 → t-body (15), 8,5 → t-headline (17), 12 → t-card-title (24), 16 → t-title (32).

## Temuan dari review v2

| Temuan | Layar | Saran |
| --- | --- | --- |
| Badge home di Figma "Sedang jeda", kode F4 "Lagi jeda" | BT03 | Samakan. Usul ikut Figma terbaru, tapi cek band F3/F4 dulu |
| Belum ada state "lagi ngirim" setelah kamera nutup (cuma terkirim ✓ / antre ⌛) | BT07 | Tetap tunggu ≤ 5 dtk di kamera (shutter loading), baru tutup ke sheet yang statusnya udah pasti |
| Tab "Foto tamu" terkunci: perilaku tap belum ada | BT07d | Usul: toast sama dengan BT07c |
| Tap polaroid di Galeri: perilaku belum ada | BT07d | Usul: buka detail foto (reuse T15b F5), atau nggak ngapa-ngapain |
| Ikon 🗑 16 terlalu kecil buat target tap | BT07d | Area tap min 44 (padding transparan), ikon tetap 16 |
| Tile "Foto lagi" pas udah 20 foto (batas) | BT07d | Sembunyikan tile + teks kecil "Maks 20 foto" |
| Galeri kosong (belum pernah foto) | BT07d | Belum didesain. Usul: tile "Foto lagi" aja + teks "Belum ada foto. Jepret yang pertama!" |
| Strip BT07e kecil (1 foto) — kurang info | BT07e | Oke, sesuai desain |
| Copy campur "dibuka" (cerita) & "kebuka" (layar) | semua | Layar pakai "kebuka" (ikut Figma) |

## Keputusan & asumsi

Yang udah diputuskan di v1 dan tetap berlaku ada di "Aturan N4 di kode" (CLAUDE.md): kamera depan, crop 5:6, kompres ≤ 400 KB, maks 20 foto, Supabase Storage `hmd-photos`, antrean IndexedDB, idempoten per id. Tambahan v2:

| Keputusan | Kenapa | Perlu dicek |
| --- | --- | --- |
| Hasil foto = sheet di **`acara/`** (`?sheet=foto&id=…`), bukan layar di `/foto` | Desain: kamera nutup, sheet di atas home | — |
| `/foto` sekarang cuma kamera (BT06/BT06b) | Lebih sederhana | — |
| "Selesai" = tutup sheet, tetap di home (mode apa pun) | Kasus "Sesi mulai pas lagi foto" | — |
| Galeri = sheet di `acara/` (`?sheet=galeri`); `/galeri` di-redirect ke situ | Desain BT07d | — |
| Tab "Foto tamu" baru kebuka setelah acara ditutup (lalu pindah ke T15) | Sesuai kartu kasus | Setelah ditutup tamu udah dialihkan ke `selesai/`, jadi tab ini praktis selalu terkunci |
| Hapus dari Galeri → Dialog konfirmasi → `DELETE` yang udah ada | Hapus permanen | — |
| BT07e muncul kalau `others === 0` (strip = fotomu) | Desain | — |

## Next step

- [ ] Putuskan temuan v2 (state ngirim, tap Foto tamu terkunci, tap polaroid di Galeri, galeri kosong, "Sedang/Lagi jeda")
- [ ] Kirim **Prompt E** di `N4-prompt-claude-code.md` (N4 v1 udah ada di kode)
- [ ] Update test case pitching kalau alur foto berubah
