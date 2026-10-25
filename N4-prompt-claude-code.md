# Prompt Claude Code — N4 update desain v2 (25 Okt)

N4 v1 udah ada di kode. Prompt ini cuma berisi perubahan desain 25 Okt. Taruh `N4-deliverables.md` v2 di root repo, lalu kirim prompt di bawah ke Claude Code.

```text
Update desain N4 per 25 Okt. N4 v1 udah ada di kode — kerjakan HANYA perubahan di bawah.
Sumber: Figma section N4 4670:4981 + N4-deliverables.md v2 ("Yang berubah dari v1", "Detail per layar", "Copy per layar").
Node: BT06 5030:13770, BT07 5030:13821, BT06b 5030:13790, BT07b 5030:13898, BT07c 5030:13979,
BT07d 5030:14132, BT07e 5030:14060. Ukuran di deliverables sudah 2×.
Kasih rencana singkat (file yang disentuh) dulu, tunggu konfirmasiku, baru tulis kode.

1. Hasil foto (BT07, BT07b, BT07c) jadi SHEET di atas home, bukan layar penuh
   - Setelah jepret (antrean + tunggu upload ≤ 5 dtk tetap), kamera nutup → /t/[token]/acara?sheet=foto&id={id}.
     Sheet pakai komponen Sheet + pola pushState sheet F4, backdrop 45%. /foto sekarang cuma kamera (BT06/BT06b).
   - Polaroid: miring −4° (tetap acak ±4°), tambah MAGNET oranye di tengah atas + BADGE STATUS 30 di pojok kanan
     atas (terkirim: --success-text + Check; antre: netral + Hourglass). Jadikan prop di Polaroid yang ada.
     Lingkaran ikon ✓/awan di bawah polaroid DIHAPUS. Judul pakai t-card-title (24).
   - Tombol kedua "Kembali ke acara" → "Selesai" (tutup sheet, tetap di home Sesi/Jeda).
   - Copy baru:
     BT07  body "Fotomu udah nempel bareng {others} foto tamu lain."
     BT07b pill "{k} foto nunggu sinyal"
     BT07c toast "Kolase lengkap kebuka pas acara selesai (± {jam selesai})"

2. BT07e Foto pertama (baru, ganti teks "Kamu yang pertama nempel di kulkas!")
   - Kalau others === 0: judul "Kamu yang pertama!", body "Kulkasnya masih sepi. Ajak yang lain ikut foto, ya.",
     strip = fotomu sendiri (maks 4), tanpa "+N". Tombol sama BT07.

3. BT07d Galeri (baru, ganti placeholder /galeri)
   - Pintasan "Galeri" di home → sheet ?sheet=galeri; /t/[token]/galeri redirect ke situ.
   - "Galeri foto" + "Kolase lengkap kebuka pas acara selesai (± {jam selesai})".
   - Segmented "Foto saya · {n}" / LockSimple "Foto tamu" (terkunci; tap → toast BT07c).
   - Grid 2 kolom fotoku: Polaroid miring kecil berganti, caption "{nama depan} · {jam foto}" + ikon Trash
     (area tap 44) → Dialog konfirmasi → DELETE /api/t/[token]/foto/[id] yang udah ada.
   - Tile terakhir "Foto lagi" (--card-2, border dashed --accent, ikon Camera) → /t/[token]/foto.

4. BT06 & BT06b
   - BT06 caption → "Jepret sekali, langsung nempel di kulkas bareng."
   - BT06b: langkah 2 → "Izin situs › Kamera › Izinkan", langkah 3 → "Balik ke sini, tap Coba lagi".
     Aksi bawah: lg primary "Coba lagi" + lg secondary "Pakai kamera HP" (Camera). TextAction "Pakai kamera
     bawaan HP" dihapus.

Update /dev/states/n4 (tambah BT07d, BT07e; BT07/b/c tampil sebagai sheet) dan "Aturan N4 di kode" di CLAUDE.md.

Definition of Done
- [ ] Jepret → kamera nutup → home + sheet; "Selesai" nutup sheet; back HP nutup sheet
- [ ] Offline → sheet badge ⌛; online lagi → berubah ke ✓ tanpa reload
- [ ] Tanpa foto tamu lain → BT07e
- [ ] Galeri: hapus foto lewat Dialog jalan; /galeri lama ke-redirect
- [ ] Cocok dengan Figma (390×844, light & dark); npm test, lint, typecheck, build lulus
Laporkan file yang diubah + screenshot layar yang berubah.
```
