# Prompt Claude Code — F1 Undangan & konfirmasi

Update 23 Okt 2026. Pasangan dari `F1-deliverables.md` v4.1.

Prompt ini **cuma berisi update per 23 Okt**. Semua yang sebelumnya (F1 27 layar, design system, F2) dianggap udah ke-develop di repo.

Taruh `F1-deliverables.md` (v4.1) di root repo sebelum kirim. Kalau Figma MCP tersedia, Claude Code bisa ambil ukuran & screenshot dari node yang disebut.

---

## Prompt · Update F1 23 Okt

```text
Update F1 + design system sesuai F1-deliverables.md v4.1 (23 Okt).
Figma: file xYZlQ3GjRHHtYcod8rTIZJ, band F1 4732:12593 (layar di band skala 0,5 → ukuran asli 2×, frame 390×844), komponen di "Clean v0.5 / Components" 4587:276.
Baca dulu: F1-deliverables.md (bagian "Perubahan desain", "Penerapan design system", "Keputusan & asumsi"), CLAUDE.md, lalu kode di components/ui, components/f1, app/(tamu)/t/[token], app/panitia/event/[id]/(tamu|rundown), dan /dev/states/f1.
Ringkas rencanamu ≤ 12 poin + daftar file yang disentuh, lalu tunggu "lanjut".
Kerjakan berurutan, commit per bagian (A, B, C, …). Jangan sentuh F2 kecuali efek samping dari komponen bersama (cek /dev/states/f2 tetap aman).

=== A. Design system ===
A1. Button primary — ganti total styling (1:1 Figma 4587:316, varian Style=Primary). Warna tetap di light & dark.
    - pill radius 999
    - background: linear-gradient(180deg, #F87030 0%, #F06A27 30%, #E86322 65%, #E15A1A 100%)
    - border: lg 1.25px / sm 1px solid #B04A14 (inside → pakai box-shadow inset atau border + box-sizing)
    - box-shadow: lg `inset 0 1.5px 1px rgba(255,176,136,.85), 0 4px 9px rgba(226,100,31,.32), 0 1px 1.5px rgba(138,58,14,.18)`
                  sm `inset 0 1px .5px rgba(255,176,136,.85), 0 2.5px 6px rgba(226,100,31,.32), 0 1px 1.5px rgba(138,58,14,.18)`
    - label & ikon #FFFFFF, Switzer **Semibold** (lg 17/22, sm 13), tracking -0.5%
    - hapus rim gradient & border #151515 versi lama. Pressed: scale .97 + brightness .96. Disabled tetap opacity .35 + aria-disabled.
    - Secondary & destructive TIDAK berubah. Cek kontras label putih di #E86322 (≥ 3:1 untuk teks 17 semibold) dan laporkan angkanya.
A2. Token: pastikan ada `--danger-fill: #F54847` (light & dark sama) dan dipakai Button destructive + panel swipe hapus. Tidak ada hex lain di komponen.
A3. Badge: tambah type `danger` (bg var(--danger-soft), titik & teks var(--danger-text)). Tipe final: live · crew · success (ikon check) · neutral · danger. Tinggi 30 (ukuran asli), titik 6, teks 13 Medium.
A4. Pill (Clean/Pill 4587:290): ikon 16 + teks 13 Medium, bg var(--card-2), tinggi 32. Dipakai untuk info event (bukan status).
A5. Update /dev/ui: matriks Button baru (lg/sm × primary/secondary/destructive × teks/iconOnly) + Badge 5 tipe, light & dark.

=== B. Status & info di layar F1 (pakai komponen, bukan span custom) ===
Pemetaan status → Badge:
    success: "Hadir", "{n} hadir", "Diundang barusan"
    neutral: "Diundang", "Diundang {tgl}", "Belum diundang", "{n} belum diundang", "Draft", "Opsional", "Info"
    crew:    "Belum jawab", "{n} belum jawab", "Persiapan · H-{n}", "Wajib"
    danger:  "Nggak bisa", "{n} nggak bisa", "Baris {n}" (error CSV)
    live:    "Talkshow" (tipe sesi)
Info event di kartu PE01/PE02 → Pill: "{n} tamu" / "Belum ada tamu" (ikon Users), "Rundown {n} sesi" / "Rundown kosong" (ikon ListBullets).
Terapkan di PE01, PE02, PE03b/e/h, PE04*, P04*, P04c, P04i, P04k.

=== C. Layar tamu ===
C1. T01a Amplop tertutup (Figma 4847:7245) — langkah baru sebelum T01 di /t/{token}:
    eyebrow "Undangan pribadi · House Moving Day", judul "Ada surat buat kamu, {nama}.", amplop (CSS/SVG, warna dari token accent/accent-soft) dengan segel kunci oranye di tengah (ring berdenyut halus), "Untuk {nama lengkap}" · "No. {keyNo} · dari Potara Studio", hint gelap "Tap segelnya buat buka", footer "Minggu, 8 Nov 2026 · 13.00 · Kantor baru Potara".
    Tap segel → flap kebuka (rotateX ±400ms) → kartu undangan naik keluar amplop (±500ms, spring) → T01. Reduced motion: crossfade 200ms.
    Keputusan default: amplop cuma muncul di kunjungan pertama per token (localStorage `hmd_env_open_{token}`); kunjungan berikutnya langsung T01. Sudah konfirmasi tetap langsung T03/T02b (aturan lama).
    Seluruh area segel tombol (button, aria-label "Buka undangan"), bisa Enter/Space.
C2. T01 (4847:6229): eyebrow jadi "Undangan pribadi · No. {keyNo}"; tambah ikon segel kebuka (lingkaran accent 26 + ikon Key) di atas kartu sesuai Figma.
C3. T02b (4847:6277): ganti blok "Sambil nunggu" dengan kartu **Titip ucapan · opsional**:
    judul "Kasih semangat buat pindahan kami", chip cepat "Selamat pindahan!" · "Semoga betah" · "Next time aku datang" (pakai komponen Chip; tap = isi field), field teks maks 140 karakter + tombol kirim ikon PaperPlaneTilt di kanan field.
    Kirim → simpan `farewellMessage` + `farewellAt` di Guest (store + tipe + tes). Setelah terkirim: field read-only + teks kecil "Ucapanmu udah terkirim. Makasih!" (belum ada di Figma → laporkan sebagai asumsi). Gagal kirim → Banner "Coba lagi", isian nggak hilang.
    Footer caption "Follow @potarastudio buat lihat kolase foto acaranya." + lg primary "Follow @potarastudio" + lg secondary "Ubah jawaban" (ikon ArrowCounterClockwise).
    Ucapan belum ditampilkan di mana pun (keputusan terbuka) — cukup tersimpan dan ikut ekspor CSV panitia kalau ada.
C4. T03k (4847:7283): tombol "Simpan ke kalender" di T03 sekarang buka Sheet: judul "Simpan ke kalender", deskripsi "House Moving Day · Min, 8 Nov · 13.00–17.00 · Kantor baru Potara. Pengingat 1 jam sebelum ikut kesimpan.", lg primary "Google Calendar" (link calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=20261108T060000Z/20261108T100000Z&details=…{link tiket}&location=…), lg secondary "Kalender HP (Apple, Samsung, dll)" (.ics yang sudah ada + VALARM TRIGGER:-PT1H). Sama di T03h.

=== D. Layar panitia: Tamu & undangan ===
D1. P04k (4847:6405): hapus tombol "Unggah CSV" di header. Unggah cuma lewat Dropzone "Pilih file CSV" (sm primary + ikon UploadSimple). Link "Unduh contoh CSV" → **"Unduh template CSV"** → file `public/template-tamu-hmd.csv` (ganti nama dari contoh-tamu.csv, update semua referensi) berisi header `nama,ig,pesan,wa` + 3 baris contoh persis kartu Figma 4847:7620:
      Rara Wening,rarawening,,0812xxxx · Bima Nugraha,bimanug,Halo Bima!…, · Laras Putri,laraspt,,0857xxxx
    Tag kolom Wajib = Badge crew, Opsional = Badge neutral.
D2. P04c (4847:6353): eyebrow "{n} baris kebaca · {k} perlu dicek", judul **"Cek daftar tamu"** (tanpa segmented), kartu file, kartu "{k} baris perlu dicek" dengan Badge danger "Baris {n}" + judul error + detail, info "{m} baris lain aman / Simpan {m} tamu dulu, {k} baris ini ditambah manual nanti. Atau benerin CSV-nya lalu unggah ulang."
    Tombol: lg primary "Unggah ulang CSV" (ikon UploadSimple) + lg secondary "Simpan {m} tamu dulu".
    Aturan: unggah ulang boleh selama BELUM disimpan (csvImportedAt kosong). Setelah simpan, aturan sekali-unggah tetap.
D3. P04i (4847:7318) baru — validasi IG di CSV, layout sama P04c, judul kartu "{k} username IG perlu dicek":
    - kosong → "IG kosong" · "{nama} · nggak bisa diundang lewat DM"
    - ada spasi → "Ada spasi" · "\"laras putri\" → maksudnya laraspt?" (saran = huruf kecil tanpa spasi)
    - URL → "Bukan username" · "\"instagram.com/yurara\" → cukup yurara" (ambil path pertama, buang @ dan query)
    Info: "Tamu tanpa IG valid nggak bisa diundang lewat DM. Benerin di CSV, atau simpan dulu lalu ubah lewat ✎."
    Baris dengan saran boleh disimpan pakai saran itu (tandai di tes); baris IG kosong tetap tersimpan tapi tombol ✈ nonaktif.
    Kalau CSV punya error baris (P04c) DAN error IG, tampilkan dua kartu berurutan.
D4. P04 / P04d / P04e / P04f: hint di bawah template jadi "Template ini otomatis disalin pas kamu tap ✈ di baris tamu". Status di baris pakai Badge (bagian B). Tombol baris: ✎ sm secondary iconOnly (PencilSimple), ✈ sm primary iconOnly (PaperPlaneTilt), ↻ sm secondary iconOnly (ArrowCounterClockwise).
D5. P04g (4847:7376) & P04h (4847:7504): filter aktif menampilkan hint di atas daftar:
    Belum jawab → "Udah diundang tapi belum jawab. Tap ↻ buat kirim ulang DM-nya." (baris: ✎ + ↻)
    Belum diundang → "Belum dapat DM. Tap ✈ satu-satu, template otomatis disalin." (baris: ✎ + ✈)
    Filter lain tanpa hint. Filter chip pakai komponen Chip (aktif = cta).
D6. P04e (4847:6740): sheet Ubah tamu — "Simpan perubahan" lg primary + **"Hapus tamu" lg destructive** (dulu secondary). Hapus → tutup sheet + Toast "Rara Wening dihapus" + Batalkan 5 dtk (pulihkan data & status).
D7. P04s (4897:6496) swipe kiri di baris tamu:
    geser ≥ 44px → panel merah var(--danger-fill) lebar 88 (ukuran asli) muncul di kanan berisi ikon Trash + "Hapus" (putih); baris lain yang terbuka menutup; tap di luar / geser balik → tutup.
    Tap "Hapus" → tamu dihapus + Toast Batalkan 5 dtk (sama D6). Pakai pointer events (touch & mouse), threshold horizontal > vertikal biar scroll tetap jalan.
    Aksesibilitas: panel juga bisa dibuka dari keyboard (fokus baris → Delete/Backspace) dan jalur utama tetap ✎ → Hapus tamu.

=== E. Layar panitia: Event & rundown ===
E1. PE03e (4847:7161): sheet Ubah detail event — hapus tombol "Hapus event" di bawah; tambah sm destructive iconOnly (Trash, aria "Hapus event") di kanan judul sheet → PE03h (konfirmasi tetap). Tombol bawah: "Simpan perubahan" lg primary + "Batal" lg secondary.
E2. PE04a (4847:7066): sheet Ubah sesi — sama: 🗑 sm destructive iconOnly di kanan judul, tombol bawah "Simpan sesi" + "Batal". 🗑 → sesi dihapus + Toast Batalkan 5 dtk (tanpa sheet konfirmasi).
E3. PE04s (4897:6420): swipe kiri di baris sesi → panel "Hapus" sama D7 → hapus + Toast Batalkan 5 dtk.
E4. Pakai satu komponen swipe yang sama untuk D7 & E3 (mis. `SwipeRow` di components/ui) — jangan dua implementasi.

=== F. Dev states & tes ===
F1. /dev/states/f1: tambah layar baru T01a, T03k, P04g, P04h, P04i, P04s, PE04s + kartu template CSV → total 36 layar (urut & beri kode sesuai F1-deliverables.md "Daftar layar"). Sertakan CSV dummy yang memicu P04c dan P04i.
F2. Tes (vitest): validasi IG (kosong/spasi/URL → saran), unggah ulang sebelum simpan, hapus + undo tamu & sesi, simpan farewellMessage, ics punya VALARM -PT1H, URL Google Calendar benar (jam UTC).
F3. Update CLAUDE.md (bagian Status, Struktur, Aturan F1, Design system: Button primary baru, Badge danger, danger-fill, SwipeRow) dan /dev/ui.

Definition of Done
- [ ] Button primary di /dev/ui sama dengan Figma 4587:316 (screenshot berdampingan, light & dark)
- [ ] Semua status/info F1 pakai Badge/Pill; tidak ada span status custom (grep)
- [ ] T01a muncul sekali per token, animasi buka jalan, reduced motion = fade
- [ ] T02b ucapan tersimpan, isian nggak hilang saat gagal
- [ ] T03k: Google Calendar & .ics (pengingat 1 jam) jalan di iPhone & Android
- [ ] P04k template CSV terunduh; P04c/P04i muncul dari CSV dummy; unggah ulang hanya sebelum simpan
- [ ] Swipe hapus + Batalkan jalan di HP asli (tamu & sesi), scroll vertikal nggak keganggu
- [ ] 🗑 di judul sheet PE03e → PE03h; PE04a → hapus + undo
- [ ] /dev/states/f1 = 36 layar; npm test, lint, typecheck, build lulus
Laporkan: file yang diubah, screenshot 390×844 tiap layar baru/berubah, asumsi yang kamu ambil, dan cara aku cek di HP.
```

### Belum termasuk (jangan dikerjakan dulu)

- Tempat ucapan T02b ditampilkan (rekap panitia / kolase): nunggu keputusan.
- Komponen Figma Segmented, Chip, ListRow + slot, Toast, Field, Sheet: di kode udah ada, pakai yang ada.
- Warna Destructive baru (kalau nanti diganti biar beda dari Primary oranye): nunggu keputusan.
- Layar full-size Archive (C12, C16) belum ikut update; acuannya band F1.
