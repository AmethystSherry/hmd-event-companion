# Prompt Claude Code — N4 Foto buat kolase polaroid

Cara pakai:

1. Pastikan F2 v2 udah di-commit. Taruh `N4-deliverables.md` dan file ini di root repo (sejajar `F2-deliverables.md`).
2. Buka Claude Code di repo itu, kirim **Prompt A**. Tunggu ringkasan + rencananya, jawab pertanyaan keputusannya.
3. Kirim **Prompt B** (data, storage, API + tes). Cek tesnya, commit.
4. Kirim **Prompt C** (5 layar N4 + kamera + antrean offline). Uji di HP asli (HTTPS), commit.
5. Kalau ada keputusan tim yang berubah, pakai **Prompt D**.

Prompt ini menggantikan bagian "N4 Kulkas polaroid" di Phase 7 `HANDOFF-CLAUDE-CODE.md`. Kalau Figma MCP tersedia, Claude Code bisa ambil ukuran & screenshot langsung dari node di bawah.

---

## Prompt A — Baca dulu, jangan nulis kode

```text
Kita lanjut ke N4 · Foto buat kolase polaroid (HMD Event Companion, Konsep B). F1 dan F2 v2 udah di kode.

Sumber kebenaran (urutan prioritas kalau bertentangan):
1. Figma section N4: file xYZlQ3GjRHHtYcod8rTIZJ, node 4670:4981 ("N4 · Foto buat kolase polaroid", page DOKSLI SAPI).
   Layar: BT06 4675:18966, BT07 4675:18986, BT06b 4748:9466, BT07b 4748:9511, BT07c 4906:18010.
   Komponen: frame "Clean v0.5 / Components" (4587:276).
2. N4-deliverables.md → 5 layar, detail ukuran (sudah 2×), copy, kartu kasus, temuan, keputusan & asumsi.
3. prd.md v0.2 → §7 N4, §8 (Photo: id, guestId, url, createdAt, deleted), §9 (foto dikompres, offline).
4. design.md → §5 (Izin kamera ditolak, Error foto), §6 motion "Foto ditempel" (450 ms spring, miring acak ±4°).
5. CLAUDE.md → stack, store (getStore/mutateStore, Supabase 1 baris JSON), aturan design system. Ikuti persis.

Tugas sekarang (TANPA menulis kode):
1. Petakan yang bisa dipakai ulang: akses tamu by token + status check-in (lib/server), Viewfinder (kamera F2),
   lib/offline/doorDb (IndexedDB) + pola antrean useDoor, LiveRefresh/rev, Toast, Button, IconButton glass,
   Screen (bottom + scroll-edge), Card, NumberedRow, Pill/Badge, StatTile "Foto" di BP00, sw.js,
   route /t/[token]/acara (placeholder Sesi/Jeda) dan /panitia/event/[id]/foto (placeholder).
2. Tabel layar N4: kode | route/komponen yang diusulkan | komponen UI | yang perlu dibuat baru.
   Usulan awal: satu client app di /t/[token]/foto (BT06/BT06b/BT07/BT07b/BT07c pindah pakai state/pushState,
   seperti DoorApp), komponen di components/n4/, komponen baru reusable `Polaroid` + `PhotoStrip` di components/ui.
3. Rencana penyimpanan foto: store sekarang 1 baris JSON, jadi file gambar NGGAK boleh masuk store.
   Usul: Supabase Storage bucket privat (service role, hanya dari server) + lokal .data/photos/ (gitignore).
   Metadata Photo di store. Cara HP baca gambar: route proxy dengan cek token/sesi panitia, atau signed URL
   berumur pendek. Pilih 1 + alasan (perhatikan batas body Vercel 4,5 MB & Hobby).
4. Rencana kamera: getUserMedia (default kamera depan, preview mirror, hasil tidak mirror), crop 5:6 dari
   viewfinder, flash hanya kalau track.getCapabilities().torch ada, ganti kamera depan/belakang.
   Jalur cadangan untuk Instagram in-app browser / getUserMedia nggak ada: <input type="file" accept="image/*" capture>.
5. Rencana kompres (canvas → JPEG, sisi panjang 1280, quality turun bertahap sampai ≤ 400 KB, + thumbnail ±320 px),
   antrean offline (IndexedDB, clientId UUID, retry 5 dtk + event online, idempoten), dan cara jumlah foto
   sampai realtime ke BP00 (rev → SSE).
6. Daftar hal di N4-deliverables.md "Keputusan & asumsi" + "Temuan dari review" yang butuh jawabanku.
Ringkas ≤ 15 poin + rencana file yang disentuh. Tunggu konfirmasiku.
```

---

## Prompt B — Data, storage, dan API (pakai tes)

```text
Prompt B: bangun logika N4 di lib/ + API, BELUM layar. Ikuti struktur yang ada (lib/data store murni + tes,
getStore()/mutateStore(fn) tanpa efek samping, lib/server untuk akses & secret).

1. Data (prd §8 + N4-deliverables):
   - Photo: id (= clientId dari HP), eventId, guestId, path, thumbPath, width, height, bytes, sessionId
     (sesi yang lagi jalan, atau terakhir selesai; null kalau belum ada), tilt (derajat acak -4..4, dibuat
     sekali saat simpan), createdAt, deleted, deletedAt.
   - Store lama tanpa photos tetap terbaca (opsional/default []). Naikkan kunci globalThis store dev kalau
     method store bertambah (lihat CLAUDE.md).
2. Fungsi murni store (tes Vitest):
   - addPhoto(guestId, meta, now): hanya tamu dengan tiket "dipakai"; idempoten per id (kirim ulang → hasil
     sama, rev nggak naik dua kali); tolak kalau tamu udah punya 20 foto aktif (konstanta, gampang diganti).
   - deletePhoto(guestId, photoId, now): hanya pemilik, hanya sebelum acara ditutup (pakai state acara yang
     ada; kalau "acara ditutup" belum ada di model, sediakan flag yang nanti diisi F5). UI-nya nanti di F5.
   - photoSummary(eventId, guestId): { mine: n, others: n, total: n, latest: 4 foto terbaru (aktif) }.
3. Storage (lib/server/photos):
   - Supabase Storage bucket privat (mis. `hmd-photos`), path {eventId}/{guestId}/{id}.jpg dan _thumb.jpg.
     Lokal (tanpa SUPABASE_*): simpan di .data/photos/. Tambahkan cara bikin bucket di supabase/schema.sql
     atau README langkah manual.
   - Nggak ada URL publik; baca lewat cara yang disetujui di Prompt A.
4. API:
   - POST /api/tamu/foto (multipart: token, clientId, file, thumb): validasi token + sudah check-in,
     mime image/jpeg|webp, file ≤ 500 KB, thumb ≤ 60 KB, cek magic bytes (jangan percaya mime saja).
     Upload dulu ke storage, baru addPhoto. Idempoten per clientId. Rate-limit sederhana per tamu.
   - GET gambar (full & thumb) dengan cek akses: tamu acara ini atau sesi panitia.
   - GET ringkasan foto untuk tamu (photoSummary) — atau ikut data halaman server, sesuaikan pola F2.
   - DELETE foto sendiri (dipakai F5).
   - Tiap perubahan menaikkan rev → /api/live → BP00 tile "Foto {n}" ikut update.
5. Data dummy di /dev/states: tombol "Isi 34 foto dummy" (gambar kecil generate di server/gradient, bukan foto
   orang) dan "Reset foto".

Definition of Done
- [ ] Tes: tambah foto, kirim ulang clientId sama 2×, tamu belum check-in ditolak, batas 20, hapus milik
      sendiri, hapus milik orang lain ditolak, hapus setelah acara ditutup ditolak, photoSummary benar
- [ ] File > 500 KB / bukan gambar ditolak; secret & service role nggak pernah sampai browser
- [ ] npm test, lint, typecheck lulus
Laporkan file yang diubah + ringkas hasil tes.
```

---

## Prompt C — Bangun layar N4

```text
Prompt C: bangun 5 layar N4 sesuai Figma 4670:4981 dan N4-deliverables.md ("Detail per layar", "Copy per layar",
"Penerapan design system"). Copy PERSIS seperti tabel copy. Ukuran di deliverables sudah 2× (frame 390×844).
Teks: 6,5 → t-label (13), 7,5 → t-body (15), 8,5 → t-headline (17), 16 → t-title (32).
Pakai komponen components/ui. Buat SEKALI komponen baru `Polaroid` (frame putih + foto + caption kiri/kanan +
tilt opsional) dan `PhotoStrip` (thumbnail + tile "+N" + state ditekan), tambahkan ke /dev/ui. Bar kamera &
shutter di components/n4/. Nggak ada warna hex di komponen kecuali pengecualian di deliverables (latar kamera
#0A0A0A, polaroid putih + caption). Tanya dulu kalau ragu.

Route & akses
- /t/[token]/foto: hanya tamu yang udah check-in (belum → redirect ke /t/[token]). Satu client app, pindah layar
  tanpa reload. Sementara (F3 belum ada) taruh Button lg primary "Foto buat kolase" (ikon Camera) di placeholder
  /t/[token]/acara, mode jeda. X dan "Kembali ke jeda" → /t/[token]/acara.

BT06 Kamera kolase (4675:18966)
- Kamera langsung minta izin saat layar dibuka. Default kamera depan (preview mirror, hasil nggak mirror),
  tombol CameraRotate ganti depan/belakang. Lightning = senter, tampil hanya kalau torch didukung.
- Viewfinder di dalam Polaroid, rasio 5:6; caption "{nama depan} · rumah baru" + tanggal event "d.m.yy" (8.11.26).
- Shutter: ambil frame video → crop 5:6 → kompres (≤ 400 KB, sisi panjang 1280) + thumbnail → simpan ke antrean
  IndexedDB DULU, lalu upload. Upload sukses ≤ 5 dtk → BT07; gagal/offline/lewat 5 dtk → BT07b.
- Thumbnail kiri = foto terakhirmu (tap → BT07); belum ada foto → sembunyikan.
- Cadangan: getUserMedia nggak ada / error bukan karena ditolak / terdeteksi Instagram in-app browser →
  tombol "Pakai kamera HP" (<input type="file" accept="image/*" capture="user">), hasil lewat crop+kompres yang sama.
- Matikan stream kamera saat keluar layar / tab tersembunyi; nyalakan lagi saat balik.

BT06b Izin kamera ditolak (4748:9466)
- NotAllowedError → viewfinder CameraSlash + "Kamera belum diizinkan", teks & bar jepret disembunyikan,
  Lightning disembunyikan. Card "Cara nyalain izin kamera" + 3 langkah bernomor. lg secondary "Coba lagi"
  (ArrowClockwise) → minta izin ulang (kalau tetap ditolak, tetap di BT06b).

BT07 Foto masuk kolase (4675:18986)
- Polaroid kecil dengan tilt dari data foto, animasi jatuh & nempel 450 ms spring (reduced motion → fade 150 ms).
- "Nempel di kulkas!" + "Fotomu sekarang bagian dari kolase bareng {others} foto tamu lain."
- PhotoStrip: 4 foto terbaru (thumb) + "+{total − 4}". Kurang dari 4 foto → tampilkan yang ada, tanpa "+N".
  others = 0 → body "Kamu yang pertama nempel di kulkas!" (usulan, tandai TODO copy).
- Jumlah & strip update realtime (rev).
- lg primary "Foto lagi" (Camera) → BT06; lg secondary "Kembali ke jeda" → /t/[token]/acara.

BT07b Gagal upload (4748:9511)
- Polaroid opacity 70%, ikon CloudArrowUp di lingkaran warning-soft, "Fotomu lagi antre", body sesuai copy,
  pill Hourglass "{k} foto menunggu sinyal" (k = isi antrean). Strip tetap tampil.
- Antrean: retry tiap 5 dtk + event online + saat tab terlihat; berhasil semua → otomatis pindah ke BT07.
  lg primary "Coba kirim sekarang" (ArrowClockwise) = retry langsung. "Kembali ke jeda" → antrean tetap jalan
  (taruh worker antrean di level layout tamu, bukan cuma di layar ini). Foto di antrean nggak hilang kalau tab ditutup.

BT07c Tap +N sebelum acara selesai (4906:18010)
- Tap tile "+N" sebelum acara ditutup → tile state ditekan (border accent) + Toast (ikon Info)
  "Kolase lengkap dibuka pas acara selesai (± {jam selesai event})", tetap di BT07. Setelah acara ditutup → link
  ke T15 (route F5, placeholder dulu).

Panitia
- BP00 StatTile "Foto" = jumlah foto aktif, realtime. Placeholder /panitia/event/[id]/foto boleh tetap placeholder
  (galeri F5), cukup tampilkan jumlah.

Teknis
- sw.js: cache kerangka /t/[token]/foto (network-first, navigasi saja) supaya bisa dibuka offline.
- /dev/states/n4: 5 layar bisa dipicu dengan data contoh + alat: "Isi 34 foto dummy", "Simulasi offline",
  "Simulasi izin ditolak", "Reset foto".
- Semua tombol Button lg (CTA bawah). IconButton glass untuk X/Lightning. aria-label: "Tutup kamera", "Senter",
  "Jepret", "Ganti kamera", "Foto terakhir".

Definition of Done
- [ ] 5 layar N4 di /dev/states/n4 cocok dengan Figma (bandingkan screenshot 390×844, light & dark)
- [ ] iPhone Safari + Android Chrome (HTTPS): jepret → BT07 < 5 dtk, file ≤ 400 KB, muncul di HP tamu lain
      & tile Foto BP00 tanpa reload
- [ ] Izin ditolak → BT06b → nyalain izin → "Coba lagi" jalan
- [ ] Buka link dari Instagram in-app browser: jalur "Pakai kamera HP" jalan
- [ ] Mode pesawat: jepret → BT07b, tutup tab, buka lagi online → foto terkirim sekali (nggak dobel)
- [ ] Tamu belum check-in nggak bisa buka /foto
- [ ] npm test, lint, typecheck, build lulus
Laporkan file yang diubah, screenshot tiap layar, dan cara aku uji di 2 HP.
```

---

## Prompt D — Susulan kalau keputusan tim berubah

```text
Prompt D: ada keputusan baru untuk N4 (lihat N4-deliverables.md versi terbaru + Figma 4670:4981). Kerjakan HANYA
yang aku sebut di bawah, jangan ubah layar lain:
- [isi, mis. "kamera default belakang", "frame polaroid dibakar ke foto", "batas 30 foto", "ganti 'Kembali ke jeda'
  jadi 'Kembali ke acara'", "strip cuma foto sendiri"]
Update tes yang terdampak + /dev/states/n4. Laporkan file yang diubah + screenshot 390×844.
```

---

## Belum termasuk (jangan dikerjakan dulu)

- T15 Kolase kulkas, T15b Detail foto (Simpan / Hapus), T15c kolase 9:16, T15d kolase kosong: F5. API hapus foto udah dibuat di Prompt B, UI-nya di F5.
- Isi layar BT03 Jeda (F3). Tombol "Foto buat kolase" cuma ditaruh sementara di placeholder `/acara`.
- Galeri panitia `/panitia/event/[id]/foto`: F5.
- Hapus otomatis 8 Des 2026 (data + foto): Phase 8.
- Usulan copy di N4-deliverables.md ("Temuan dari review"): ikut Figma dulu sampai disetujui, kecuali state 0 foto (TODO).
