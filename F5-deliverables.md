# F5 · Tutup acara & feedback — Deliverables

24 Okt 2026 · @Pota Design · v1 (desain ready untuk dev)

## Ringkasan

F5 adalah penutup acara (**WAJIB**). Setelah sesi terakhir, panitia tekan **"Tutup acara & buka buku tamu"** → semua HP tamu realtime pindah ke **BT12 "Makasih udah mampir"** (ringkasan + preview kolase). Tamu isi **buku tamu ±1 menit** (rating, bagian paling seru, satu hal diperbaiki, mau diundang lagi), lalu lihat **kolase kulkas** (masonry 2 kolom) dan bisa buka detail foto, simpan foto, atau simpan kolase 9:16 buat story. Tamu yang udah pulang tetap bisa isi lewat link di pesan terima kasih WA. Panitia lihat **rekap**: rata-rata rating, jumlah pengisi, bagian paling seru, ringkasan 3 poin dari Claude, dan unduh CSV.

Section F5 punya **2 lane**: Tamu (10 layar) dan Panitia (6 layar), plus 12 kartu kasus.

- **Figma, section F5:** [F5 · Tutup acara & feedback](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4671-4888) (`4671:4888`)
- **Section lengkap:** [Screen Flow · All Case](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4655-2704)
- **Komponen:** frame `Clean v0.5 / Components` (`4587:276`)
- **PRD:** `prd.md` v0.2 §5 (alur pasca), §7 F5, §8 (data, hapus H+30), §9
- **design.md:** "Kolase akhir: galeri gaya Pinterest" (T15/T15b), §2.4–2.5 (layout, radius), §7 kosakata
- **HANDOFF:** Phase 6 (bagian ini menggantikannya)
- **Font:** Switzer. Layar di section di-scale 0,5×, ukuran asli = 2× (frame 390×844)

## Flow F5

```
PANITIA  BP00 Kontrol acara, semua sesi selesai = BP04 "Jeda terakhir"
           └─ "Tutup acara & buka buku tamu" → BP04b sheet "Tutup acara sekarang?"
                 ├─ "Belum, kembali" → BP04
                 └─ "Ya, tutup acara" → event.mode = closed
                        ⚡ realtime ≤ 3 dtk → semua HP tamu ke BT12
           BP04 ── "Lihat rekap" ──▶ P11 Rekap buku tamu ── "Unduh CSV" ──▶ [SELESAI] rekap buat evaluasi
                 ├─ Claude gagal → P11b (angka + daftar jawaban tetap tampil, "Coba lagi")
                 ├─ Belum ada yang ngisi → P11c (empty state, CSV nonaktif)
                 └─ ≥ 8 Des 2026 (H+30) → P11d (rekap tanpa nama, CSV nonaktif)
           ⚡ Feedback masuk → P11 update < 10 dtk

TAMU     BT12 Acara selesai
           ├─ "Isi buku tamu" ──▶ T14 Buku tamu
           │     ├─ Rating kosong → T14c (Kirim nonaktif + hint)
           │     ├─ Gagal kirim → T14b (Banner + "Coba lagi", isian tetap)
           │     └─ "Kirim ke buku tamu" ──▶ T15 Kolase
           ├─ "Lihat kolase lengkap" ──▶ T15 (buku tamu bisa diisi nanti)
           ├─ Udah pernah isi → T14d (Toast lalu langsung T15)
           └─ Tamu udah pulang → link WA terima kasih → T14
         T15 Kolase kulkas
           ├─ Tap foto ──▶ T15b Detail foto ── "Tutup" ──▶ T15 · [SELESAI] tamu follow @potarastudio
           ├─ "Simpan kolase" → T15c sheet 9:16 → "Simpan" / "Bagikan" → T15e share sheet HP
           └─ Belum ada foto → T15d empty state
```

## Daftar layar

| Kode | Layar | Lane | Jenis | Node |
| --- | --- | --- | --- | --- |
| BT12 | Acara selesai | Tamu | Utama | `4671:4995` |
| T14 | Buku tamu | Tamu | Utama | `4832:7782` |
| T14b | Buku tamu gagal kirim | Tamu | Gagal | `4748:9672` |
| T14c | Rating belum diisi | Tamu | Gagal | `4835:6168` |
| T14d | Udah pernah isi | Tamu | Kasus lain | `4835:6237` |
| T15 | Kolase kulkas | Tamu | Utama | `4840:7851` |
| T15b | Detail foto | Tamu | Utama | `4671:5165` |
| T15c | Simpan kolase (9:16) | Tamu | Kasus lain | `4840:8242` |
| T15d | Kolase kosong | Tamu | Kasus lain | `4840:8456` |
| T15e | Bagikan kolase (share sheet HP) | Tamu | Kasus lain | `4906:9199` |
| BP04 | Semua sesi selesai | Panitia | Utama | `4675:19010` |
| BP04b | Konfirmasi tutup acara | Panitia | Kasus lain | `4748:9937` |
| P11 | Rekap buku tamu | Panitia | Utama | `4675:19071` |
| P11b | Claude gagal ngeringkas | Panitia | Gagal | `4748:10018` |
| P11c | Belum ada feedback | Panitia | Kasus lain | `4748:10086` |
| P11d | Data terhapus otomatis | Panitia | Kasus lain | `4829:6199` |

Chip penutup: "Acara beres. Tamu bisa follow @potarastudio" (`4671:5277`) dan "Rekap dipakai buat evaluasi acara" (`4671:5298`).

### Kartu kasus

| Kasus | Perilaku | Layar |
| --- | --- | --- |
| Tap "Lihat kolase lengkap" | Langsung ke T15, buku tamu bisa diisi nanti | — |
| Tamu udah pulang | Buka link WA terima kasih → T14 | — |
| Rating belum diisi | Tombol Kirim nonaktif | T14c |
| Gagal kirim | Pesan error + Coba lagi, isian tetap ada | T14b |
| Udah pernah isi | Toast lalu langsung ke kolase (T15) | T14d |
| Simpan kolase | Gambar 9:16 buat story | T15c (+ T15e) |
| Belum ada foto | Empty state kolase | T15d |
| Tutup detail | Balik ke kolase (T15) | — |
| Tutup acara kepencet | Konfirmasi dulu sebelum semua HP pindah | BP04b |
| Claude gagal ngeringkas | Tetap tampil angka & daftar jawaban | P11b |
| Belum ada yang ngisi | Empty state "Belum ada feedback" | P11c |
| 8 Des 2026 (H+30) | Data per orang dihapus otomatis, rekap tanpa nama tetap ada | P11d |

Realtime di Figma: **⚡ Tutup acara → semua HP** dan **⚡ Feedback masuk (< 10 dtk)**.

## Hubungan dengan kode sekarang

- `Event.mode` udah punya `"closed"` (F2 v2), tapi **belum ada aksi tutup acara**. N4 udah menolak upload & hapus foto kalau `closed`.
- **BP04 di Figma = BP00 Kontrol acara** (kode F2 v2, carousel kartu sesi) dalam keadaan **semua sesi selesai**. Jadi BP04 dibangun sebagai state di `kontrol/`, bukan route baru.
- Komponen yang udah ada dan dipakai F5: `Button`, `IconButton`, `Card`, `StatTile`, `Chip`/`Pill`, `Segmented`, `Field`, `Banner`/`TextAction`, `HeroState`, `Sheet`, `Toast`, `Avatar`, `Badge`, `Screen`/`ScreenHeader`, `TabBar`, `Polaroid`, `PhotoStrip`, route proxy foto N4 (`guestPhotoUrl`/`crewPhotoUrl`), `LiveRefresh`.
- F3/F4 (BT03 dll.) dan N1 (pertanyaan) **belum dibangun**. Angka "pertanyaan" di BT12/BP04 belum ada sumbernya.

## Detail per layar

Ukuran di bawah sudah dikali 2 (ukuran asli 390×844). Angka yang nggak disebut: ambil dari Figma (`get_design_context` per node).

### BT12 · Acara selesai

- Latar `--bg`, **tanpa back** (layar akar setelah acara ditutup).
- Eyebrow "**{jam tutup} · {x} dari {n} bagian selesai**" (contoh "17.02 · 4 dari 4 bagian selesai").
- Judul t-title "**Makasih udah mampir ke rumah baru!**".
- 3 `StatTile` sejajar: ikon `Camera` "**{n} foto kolase**", ikon `ChatCircle` "**{n} pertanyaan**", ikon `Users` "**{n} tamu**".
- Card "**Kolase kulkas**" + chevron kanan (tap → T15): 4 thumbnail kotak (radius 12) foto terbaru, caption "Dibuat otomatis dari {n} foto {m} tamu." (t-label, `--label-2`).
- Aksi bawah: lg primary "**Isi buku tamu**" (ikon `BookOpen`) → T14; lg secondary "**Lihat kolase lengkap**" (ikon `Image`) → T15.

### T14 · Buku tamu

- Back (IconButton `CaretLeft`) → BT12. Eyebrow "**±1 menit**", judul "**Gimana rasanya mampir?**".
- 4 Card berurutan:
  1. "**Nilai acaranya**": 5 bintang (`Star` fill, warna `--accent`; kosong = outline `--label-3`). **Wajib.**
  2. "**Bagian paling seru**": Chip satu pilihan, terpilih = isi gelap (Ink). Opsi = sesi di rundown: Open space · Talkshow · Tur kantor · Networking.
  3. "**Satu hal yang bisa kami perbaiki**": textarea, placeholder "**Tulis di sini (opsional)**".
  4. "**Mau diundang lagi?**": `Segmented` "**Mau dong**" / "**Nanti dulu**".
- Aksi bawah: lg primary "**Kirim ke buku tamu**" (ikon `PaperPlaneTilt`). Scroll-edge fade di atas tombol.

### T14b · Buku tamu gagal kirim

- Sama T14 + `Banner` danger di bawah judul: ikon `WifiSlash`, "**Gagal kirim, sinyalnya lemah**" / "**Jawabanmu tetap tersimpan. Coba lagi ya.**".
- Isian tetap terisi. Tombol bawah jadi "**Coba lagi**" (ikon `ArrowClockwise`).

### T14c · Rating belum diisi

- Sama T14, 5 bintang kosong + hint merah di bawahnya (t-label, `--danger-text`): "**Kasih bintang dulu ya, rating wajib diisi**".
- Tombol "Kirim ke buku tamu" tampil nonaktif.

### T14d · Udah pernah isi

- Layar T15 + `Toast` (ikon `Check`) "**Kamu sudah isi buku tamu. Terima kasih!**" di atas tombol bawah.

### T15 · Kolase kulkas

- Back → BT12. Kanan atas IconButton `DownloadSimple`.
- Eyebrow "**Terima kasih sudah mampir, {nama depan}**", judul "**Kolase kulkas**", meta "**{n} foto dari {m} tamu · 8 Nov 2026**".
- Baris Chip filter (scroll horizontal, bleed ke kanan): "**Semua**" · "**Fotoku**" · satu per sesi. Aktif = isi gelap.
- **Masonry 2 kolom** (design.md): lebar kolom 175, jarak antar kolom 8, antar pin 12; tinggi foto ikut rasio asli; radius foto ±16. Di bawah tiap foto: avatar inisial 20 + "**{nama} · {sesi}**" (t-label, `--label-2`). Foto milik sendiri diberi label kaca "**Fotoku**" di pojok kiri atas. Urutan terbaru di atas, lazy-load pakai thumbnail.
- Aksi bawah mengambang: lg primary "**Simpan kolase**" (ikon `DownloadSimple`, lebar 294) + IconButton bulat secondary 54 ikon bagikan (`Export`).

### T15b · Detail foto

- T15 di belakang di-blur + diredupkan. IconButton glass `X` kanan atas → T15.
- Kartu mengambang (`--card`, radius 40, padding 12): foto besar radius 22 (rasio asli); baris avatar + "**{Nama lengkap}**" (+ " · **fotomu**" kalau milik sendiri) + "**{sesi} · {jam}**".
- Aksi di kartu: lg secondary "**Simpan foto**" (ikon `DownloadSimple`) + Button destructive iconOnly ikon `Trash` (**cuma foto sendiri**).
- Di bawah kartu: "**Geser ke samping untuk foto lain**" (t-label, `--label-3`). Geser kiri/kanan = foto lain di filter aktif.

### T15c · Simpan kolase (9:16)

- `Sheet` di atas T15: judul "**Simpan kolase**", sub "**Ukuran 9:16, pas buat story**".
- Preview 9:16 (radius 16): header "**potara · HMD**" + "**Kulkas polaroid · 8.11.26**", di bawahnya masonry mini (foto + nama · sesi).
- 2 tombol lg sejajar: secondary "**Bagikan**" (ikon `ShareNetwork`) → T15e; primary "**Simpan**" (ikon `DownloadSimple`).

### T15d · Kolase kosong

- Meta "**Belum ada foto · 8 Nov 2026**". Chip filter disembunyikan. IconButton unduh & bagikan nonaktif.
- State tengah: ikon `Image` dalam lingkaran `--accent-soft`, "**Kulkasnya masih kosong**" (t-headline), "**Foto pertama bisa dari kamu. Jepret momen di sela acara, langsung nempel di sini.**".
- Aksi bawah: lg primary "**Foto buat kolase**" (ikon `Camera`) + IconButton bagikan nonaktif.

### T15e · Bagikan kolase

- **Bukan UI buatan kita**: share sheet bawaan HP lewat Web Share API (`navigator.share({ files })`). Tampilan beda di iOS & Android.
- File "**kolase-hmd.png**", judul "Gambar 9:16 · potara HMD".

### BP04 · Semua sesi selesai (state BP00)

- Header: eyebrow "**HMD · Minggu, 8 Nov**", judul "**Kontrol acara**", Badge crew "**Panitia**".
- Card hero: label "**Layar tamu sekarang**", judul "**Jeda terakhir**", body "**Closing selesai {jam}. Tamu masih bisa foto & lihat peserta.**", lg primary "**Tutup acara & buka buku tamu**" (ikon `BookOpen`).
- 3 `StatTile`: `Users` "**{x}/{n} Check-in**", `Camera` "**{n} Foto**", `ChatCircle` "**{n} Pertanyaan**".
- Card "**Rundown**" + "**{x} dari {n} selesai**": progress bersegmen (1 segmen per sesi), baris sesi dengan ikon cek di lingkaran `--success-soft`, judul, "Selesai", jam mulai.
- `TabBar · Panitia` di bawah (Kontrol · Tamu · Tanya + Scan).

### BP04b · Konfirmasi tutup acara

- `Sheet` di atas BP04: ikon `BookOpen` dalam lingkaran `--accent-soft` 64, judul "**Tutup acara sekarang?**", body "**Semua HP tamu ({n}) langsung pindah ke buku tamu dan kolase. Layar acara nggak bisa dibuka lagi.**".
- Baris info (`--card-2`, radius 12): ikon cek + "**Semua sesi udah selesai · {x}/{n}**".
- lg primary "**Ya, tutup acara**" (ikon `BookOpen`) + lg secondary "**Belum, kembali**".

### P11 · Rekap buku tamu

- Back → BP00. Eyebrow "**{x} dari {n} tamu mengisi**", judul "**Rekap buku tamu**".
- 3 `StatTile`: `Star` "**{rata2}**" / "Rata-rata" (1 desimal, koma), `BookOpen` "**{x}/{n}**" / "Mengisi", `Users` "**{p}%**" / "Mau diundang".
- Card "**Bagian paling seru**": bar horizontal per sesi, urut terbanyak; bar teratas Ink, sisanya abu; angka di kanan.
- Card "**Ringkasan Claude**" (ikon `Sparkle` `--accent`): 3 poin bullet.
- Footer: caption "**Data tamu terhapus otomatis 8 Des 2026**" + lg primary "**Unduh CSV**" (ikon `DownloadSimple`).

### P11b · Claude gagal ngeringkas

- Card ringkasan diganti `Banner` warning: ikon `Sparkle`, "**Ringkasan belum bisa dibuat**" / "**Angka & semua jawaban tetap lengkap di bawah.**", TextAction kanan "**Coba lagi**".
- Card baru "**Satu hal yang bisa diperbaiki · {n} jawaban**": daftar jawaban (t-body) + "**Tamu #{nn}**" (t-label, `--label-3`).

### P11c · Belum ada feedback

- Eyebrow "**0 dari {n} tamu mengisi**", 3 StatTile nilainya "**–**".
- State tengah: ikon `BookOpen`, "**Belum ada feedback**", "**Buku tamu kebuka otomatis setelah acara ditutup. Jawaban tamu muncul di sini.**".
- "Unduh CSV" nonaktif.

### P11d · Data terhapus otomatis

- Angka & bar & ringkasan tetap tampil.
- `Banner` warning (ikon `Info`): "**Data per orang udah dihapus 8 Des**" / "**Rekap tanpa nama tetap ada. Jawaban per tamu & CSV nggak bisa dibuka lagi.**".
- Footer "**Data per orang dihapus 8 Des 2026 · CSV nonaktif**", "Unduh CSV" nonaktif.

## Copy per layar (sesuai Figma)

| Layar | Copy | Tombol |
| --- | --- | --- |
| BT12 | "17.02 · 4 dari 4 bagian selesai" · **"Makasih udah mampir ke rumah baru!"** · "48 foto kolase" · "12 pertanyaan" · "20 tamu" · "Kolase kulkas" · "Dibuat otomatis dari 48 foto 20 tamu." | lg primary "Isi buku tamu" (BookOpen), lg secondary "Lihat kolase lengkap" (Image) |
| T14 | "±1 menit" · **"Gimana rasanya mampir?"** · "Nilai acaranya" · "Bagian paling seru" · "Satu hal yang bisa kami perbaiki" · "Tulis di sini (opsional)" · "Mau diundang lagi?" · "Mau dong" / "Nanti dulu" | lg primary "Kirim ke buku tamu" (PaperPlaneTilt) |
| T14b | **"Gagal kirim, sinyalnya lemah"** · "Jawabanmu tetap tersimpan. Coba lagi ya." | lg primary "Coba lagi" (ArrowClockwise) |
| T14c | "Kasih bintang dulu ya, rating wajib diisi" | "Kirim ke buku tamu" nonaktif |
| T14d | Toast "Kamu sudah isi buku tamu. Terima kasih!" | sama T15 |
| T15 | "Terima kasih sudah mampir, Rara" · **"Kolase kulkas"** · "48 foto dari 20 tamu · 8 Nov 2026" · Chip "Semua / Fotoku / {sesi}" · label "Fotoku" · "Rara · Talkshow" | lg primary "Simpan kolase" (DownloadSimple), IconButton bagikan, IconButton unduh (header) |
| T15b | "Rara Wening · fotomu" · "Talkshow · 14.27" · "Geser ke samping untuk foto lain" | lg secondary "Simpan foto", destructive iconOnly Trash, IconButton X |
| T15c | **"Simpan kolase"** · "Ukuran 9:16, pas buat story" · "potara · HMD" · "Kulkas polaroid · 8.11.26" | lg secondary "Bagikan" (ShareNetwork), lg primary "Simpan" (DownloadSimple) |
| T15d | "Belum ada foto · 8 Nov 2026" · **"Kulkasnya masih kosong"** · "Foto pertama bisa dari kamu. Jepret momen di sela acara, langsung nempel di sini." | lg primary "Foto buat kolase" (Camera) |
| T15e | "kolase-hmd.png" · "Gambar 9:16 · potara HMD" | share sheet HP |
| BP04 | "HMD · Minggu, 8 Nov" · **"Kontrol acara"** · "Layar tamu sekarang" · **"Jeda terakhir"** · "Closing selesai 16.58. Tamu masih bisa foto & lihat peserta." · "Check-in" · "Foto" · "Pertanyaan" · "Rundown" · "4 dari 4 selesai" · "Selesai" | lg primary "Tutup acara & buka buku tamu" (BookOpen) |
| BP04b | **"Tutup acara sekarang?"** · "Semua HP tamu (20) langsung pindah ke buku tamu dan kolase. Layar acara nggak bisa dibuka lagi." · "Semua sesi udah selesai · 4/4" | lg primary "Ya, tutup acara" (BookOpen), lg secondary "Belum, kembali" |
| P11 | "15 dari 18 tamu mengisi" · **"Rekap buku tamu"** · "Rata-rata" · "Mengisi" · "Mau diundang" · "Bagian paling seru" · "Ringkasan Claude" · "Data tamu terhapus otomatis 8 Des 2026" | lg primary "Unduh CSV" (DownloadSimple) |
| P11b | **"Ringkasan belum bisa dibuat"** · "Angka & semua jawaban tetap lengkap di bawah." · "Satu hal yang bisa diperbaiki · 15 jawaban" · "Tamu #04" | TextAction "Coba lagi", lg primary "Unduh CSV" |
| P11c | "0 dari 18 tamu mengisi" · **"Belum ada feedback"** · "Buku tamu kebuka otomatis setelah acara ditutup. Jawaban tamu muncul di sini." | "Unduh CSV" nonaktif |
| P11d | **"Data per orang udah dihapus 8 Des"** · "Rekap tanpa nama tetap ada. Jawaban per tamu & CSV nggak bisa dibuka lagi." · "Data per orang dihapus 8 Des 2026 · CSV nonaktif" | "Unduh CSV" nonaktif |

## Penerapan design system

| Elemen | Pakai | Catatan |
| --- | --- | --- |
| Tombol bawah & tombol di sheet | `Button` lg primary / secondary | Primary oranye (v0.5) |
| Hapus foto (T15b) | `Button` destructive `iconOnly` + `label` | aria-label "Hapus foto" |
| Back, X, unduh, bagikan | `IconButton` (glass di atas foto/blur) | — |
| Stat 3 kolom (BT12, BP04, P11) | `StatTile` | Nilai "–" untuk P11c |
| Card bagian | `Card` + `CardLabel` | — |
| Bagian paling seru, filter T15 | `Chip` | Terpilih = isi gelap |
| Mau diundang lagi | `Segmented` | — |
| Textarea perbaikan | `Field` (varian multiline) | Tambah varian kalau belum ada |
| Banner T14b / P11b / P11d | `Banner` danger / warning + `TextAction` | — |
| Empty state T15d / P11c | `HeroState` | — |
| BP04b, T15c | `Sheet` (bawah, grabber) | Lihat temuan soal Dialog vs Sheet |
| Toast T14d | `Toast` (tanpa undo ring) | — |
| Rating bintang | **baru: `StarRating`** di `components/ui` | 5 tombol, `radiogroup`, aria "Nilai {n} dari 5" |
| Masonry + pin foto | **baru: `Masonry` + `PhotoPin`** di `components/ui` | Dipakai T15, T15c (mini), galeri panitia |
| Bar "paling seru" | **baru: `BarList`** di `components/ui` | Bar teratas Ink |
| Daftar jawaban P11b | `ListRow` sederhana / custom | — |
| Kartu detail T15b | **custom di `components/f5`** | Swipe + blur latar |
| Thumbnail BT12 | `PhotoStrip` (tanpa +N) atau grid custom | — |

**Text style** (skala section 0,5×): 6,5 → t-label (13), 7,5 → t-body (15), 8,5 → t-headline (17), 16 → t-title (32).

## Temuan dari review

| Temuan | Layar | Saran |
| --- | --- | --- |
| **Hapus foto nggak mungkin kepake.** T15b nampilin tombol Hapus, tapi T15b cuma bisa dibuka setelah acara ditutup, dan aturan PRD/N4 bilang hapus cuma boleh **sampai acara ditutup** (kode N4 udah nolak hapus kalau `closed`) | T15b | Usul: hapus foto sendiri boleh **sampai 8 Des 2026** (H+30). Atau sembunyikan Hapus setelah acara ditutup (Figma perlu diubah) |
| **T15d ngajak foto, padahal upload ditutup.** CTA "Foto buat kolase" muncul di kolase kosong setelah acara ditutup, tapi N4 nolak upload kalau `closed` | T15d | Usul: izinkan upload sampai **23.59 hari-H** (tamu masih di lokasi), atau ganti CTA jadi "Kembali" / sembunyikan |
| Angka tamu nggak konsisten: BT12/BP04 "20 tamu", "20/20" tapi P11 "15 dari **18**" | P11, P11c | Tetapkan pembagi = tamu yang **udah check-in** (sama dengan siapa yang bisa isi buku tamu) |
| Nggak ada **tombol ke P11** di BP04, dan nggak ada layar BP04 **setelah** acara ditutup | BP04 | Usul: setelah `closed`, kartu hero jadi "Acara udah ditutup · {jam}" + lg primary "Lihat rekap buku tamu" (BookOpen), stat tile tambah "Mengisi {x}/{n}" |
| BP04 di Figma pakai **TabBar** + kartu hero, sedangkan BP00 F2 v2 (kode) carousel kartu sesi **tanpa TabBar** + tombol "Scan tiket" | BP04 | Usul: tetap pola BP00 v2; kartu "Jeda terakhir" jadi kartu terakhir carousel (atau ganti carousel saat semua selesai). TabBar ikut keputusan F3 |
| BP04b pakai **Sheet**, konfirmasi BP00a/BP00b di kode pakai **Dialog** tengah | BP04b | Ikut Figma (Sheet) karena aksinya besar & nggak bisa dibatalin; atau samakan ke Dialog |
| Tombol nonaktif nggak bisa di-tap, jadi hint T14c kapan munculnya? | T14c | Tombol `aria-disabled` (tetap bisa di-tap) → tap pertama munculin hint + fokus ke bintang |
| "Mau diundang lagi?" udah **terpilih "Mau dong"** dari awal | T14, T14b, T14c | Bikin angka 87% bias. Usul: belum terpilih (opsional), persen dihitung dari yang jawab |
| Opsi "Networking" vs sesi rundown "**Closing & networking**" | T14, T15, P11 | Ambil dari rundown biar sinkron. Kalau mau label pendek, tambah `shortTitle` di sesi (opsional) |
| T14b & T14c **nggak ada back**, T14 ada | T14b, T14c | Samakan: ada back → BT12 |
| T15 ada **dua** tombol unduh (IconButton header + "Simpan kolase") | T15 | Hapus IconButton header, atau jadikan header = bagikan |
| PRD T15 minta **"Follow @potarastudio"**, tapi nggak ada tombolnya (cuma chip akhir) | T15 | Tambah TextAction/Button sm "Follow @potarastudio" di bawah meta atau di akhir masonry |
| Kolase 9:16 **muat berapa foto?** 48 foto nggak muat di 1080×1920 | T15c | Usul: maks 12 foto, ikut filter aktif (Semua = 12 terbaru, Fotoku = fotomu) |
| Simpan gambar di **iPhone**: `<a download>` masuk ke Files, bukan Foto | T15c, T15b | "Simpan" di iOS pakai share sheet (pilih "Simpan Gambar"), Android = download. Kalau share nggak ada (IG webview) → buka gambar di tab baru + toast "Tekan lama gambarnya buat simpan" |
| Link **WA terima kasih** buat tamu yang udah pulang: siapa yang kirim & dari mana? Belum ada layarnya | — | Usul: pakai pola P04b (WA manual, "Kirim ke semua"), template "Makasih udah mampir ke HMD! Isi buku tamu & lihat kolasenya di sini: {link}" — atau di luar scope F5 |
| Tamu yang **nggak datang** buka link setelah acara ditutup? | BT12, T14 | Usul: tamu belum check-in nggak bisa isi buku tamu; lihat layar "Acara udah selesai" sederhana + follow IG |
| "Pertanyaan" (BT12, BP04) sumbernya N1, **belum dibangun** | BT12, BP04 | Tampilkan 0 dulu (atau sembunyikan tile) sampai N1 jadi |
| "{n} foto dari {m} tamu": m = tamu yang punya foto, bukan total tamu | T15, BT12 | Pastikan copy BT12 "Dibuat otomatis dari 48 foto **dari** 20 tamu." |
| P11 normal **nggak nampilin daftar jawaban** "perbaiki", cuma P11b | P11 | Usul: card daftar jawaban selalu ada di bawah ringkasan (collapse kalau > 5) |
| "Tamu #04": nomornya dari mana? | P11b | Nomor urut jawaban (bukan nomor kunci), biar tetap anonim di layar |

## Keputusan & asumsi

| Keputusan | Kenapa | Perlu dicek |
| --- | --- | --- |
| Tutup acara = `mode: "closed"` + `closedAt`, **sekali jalan** (nggak ada buka lagi kecuali tombol dev) | Copy BP04b "Layar acara nggak bisa dibuka lagi" | — |
| Tombol "Tutup acara" cuma muncul saat **semua sesi selesai** | Sesuai BP04 | Perlu jalur darurat kalau sesi terakhir lupa diselesaikan? |
| Setelah `closed`, semua halaman tamu (`/t/[token]`, `acara/`, `foto/`) → BT12 dalam ≤ 3 dtk (rev → SSE) | ⚡ Tutup acara → semua HP | — |
| Buku tamu cuma untuk tamu **udah check-in**, 1 isian per tamu, nggak bisa diubah | T14d | Boleh ubah jawaban? Usul: nggak |
| Rating 1–5 **wajib**; paling seru (1 pilihan), perbaikan (≤ 280 huruf), mau diundang lagi **opsional** | T14c cuma nandain rating | — |
| Kirim idempoten per `clientId` (UUID dari HP); draft disimpan di `localStorage` per token | T14b "isian tetap ada" | Retry otomatis saat `online`? Usul: ya + tetap ada tombol |
| Link WA terima kasih = `/t/[token]/buku-tamu` | Tamu udah pulang langsung ke T14 | — |
| Ringkasan Claude: dibuat di server, API key di env, timeout 15 dtk, **cache** di store; dibuat ulang tiap ada ≥ 3 jawaban baru atau tombol "Coba lagi"; minimal 3 jawaban | Hemat panggilan, P11 tetap cepat | Model & kuota API dari hackathon? |
| Data ke Claude **tanpa nama** (cuma rating, sesi, teks perbaikan, mau diundang) | Privasi | — |
| CSV: `nama, ig, rating, paling_seru, perbaikan, mau_diundang, waktu_isi`, UTF-8 BOM (biar Excel rapi) | Unduh CSV P11 | Tambah WA? Usul: nggak |
| Rekap P11 realtime lewat `rev` → SSE (< 10 dtk) | PRD F5 | — |
| Kolase 9:16 digambar di **HP** (canvas 1080×1920) dari foto lewat route proxy (same-origin, canvas aman) | Gratis, tanpa server render | Maks 12 foto (lihat temuan) |
| Detail foto T15b pakai **foto full**, masonry pakai thumbnail | Ringan | — |
| P11d: mulai **8 Des 2026 00.00 WIB**, data per orang (nama/IG/WA tamu, isian per orang, foto) dihapus; **agregat** (rata-rata, jumlah, distribusi, % diundang, ringkasan) disimpan sebelum hapus | PRD §8 | Pemicu: dicek tiap request (lazy) + Vercel Cron harian? Usul: lazy dulu, cron di Phase 8 |
| Waktu pakai `serverNow()` / `hmd_now` yang udah ada, biar P11d bisa diuji | Sama dengan F2 | — |

## Next step

- [ ] Review F5 & putuskan poin "Keputusan & asumsi" (hapus foto setelah ditutup, upload setelah ditutup, pembagi tamu, default "Mau dong", jumlah foto 9:16)
- [ ] Putuskan temuan desain (tombol ke P11 & BP04 setelah ditutup, Sheet vs Dialog, TabBar, back T14b/T14c, follow IG, unduh dobel)
- [ ] Pastikan ada API key Claude (env `ANTHROPIC_API_KEY`) di Vercel
- [ ] Handoff ke dev pakai `F5-prompt-claude-code.md`
- [ ] Update test-case pitching setelah F5 jalan
