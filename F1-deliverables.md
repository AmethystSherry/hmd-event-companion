# F1 · Undangan & konfirmasi — Deliverables

23 Okt 2026 · @Pota Design · v4.1 (layar baru + design system diterapkan penuh + Primary oranye "Delete")

> **Untuk dev:** pakai `F1-prompt-claude-code.md`. Kalau F1 udah pernah dibangun dari prompt sebelumnya, kirim prompt di `F1-prompt-claude-code.md` (isinya cuma update 23 Okt).

## Ringkasan

F1 (undangan sampai pengingat H-1) sekarang punya **36 layar**: 12 utama + 24 case. Plus 1 kartu contoh isi template CSV.

**Perubahan desain sejak v3:**

- Amplop undangan **T01a** (tap segel untuk buka).
- "Titip ucapan" di **T02b**.
- Sheet kalender **T03k**.
- Filter **P04g/P04h**.
- Error IG **P04i**.
- Swipe kiri untuk hapus (**P04s / PE04s**).
- Hapus sesi/event pindah jadi ikon 🗑 di judul sheet.
- Template CSV yang bisa diunduh.

**Design system udah diterapkan penuh ke semua layar F1:**

- Semua tombol pakai `Clean/Button`, semua status pakai `Clean/Badge`, dan info event pakai `Clean/Pill`.
- 1.065 warna terhubung ke variabel **Potara Clean / Color**.
- **Button Primary** sekarang **oranye full rounded** (1:1 referensi "Delete") dan udah diterapkan ke semua layar.
- `Clean/Badge` dapat tipe baru **Danger**.

Siap direview tim dan lanjut ke handoff dev.

- **Figma, band F1:** [All Case Flow · F1](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4732-12593) (`4732:12593`)
- **Section lengkap:** [Screen Flow · All Case](https://www.figma.com/design/xYZlQ3GjRHHtYcod8rTIZJ/Fawwaz-Exploration?node-id=4655-2704)
- **Komponen:** frame `Clean v0.5 / Components` (`4587:276`) di page DOKSLI SAPI
- **Font:** Switzer. Layar di band di-scale 0,5×, jadi ukuran asli = 2× dari yang terlihat (frame 390×844)

## Flow F1

```
TAMU     DM IG (link unik) → T01a Amplop tertutup → tap segel → T01 Undangan (kebuka)
           → T02 Konfirmasi (WA wajib)
              ├─ Hadir → T03 Tiket + countdown ── Simpan ke kalender → T03k
              │          (H-1, dari WA) T03h ── hari-H ──▶ F2 T05
              └─ Nggak bisa datang → T02b (titip ucapan opsional, selesai)
           Link dibuka lagi setelah konfirmasi → langsung T03

PANITIA  P01 PIN → PE01 Event kamu → PE02 Buat event → PE03 Home event
           ├─ Detail event: Edit → PE03e Ubah detail (🗑 di judul) → PE03h konfirmasi hapus
           ├─ Rundown: PE04k → PE04 → tap sesi PE04a (🗑 di judul) · swipe kiri PE04s
           └─ Tamu & undangan: P04k (Pilih file CSV · Unduh template CSV)
                → P04a cek & simpan (sekali) · error: P04c baris error, P04i IG salah
                → P04 undang via DM IG (✈) → P04d balik dari IG (Undo 5 dtk)
                → filter P04g Belum jawab (↻) / P04h Belum diundang (✈)
                → P04f tambah manual · P04e ubah · swipe kiri P04s hapus
           H-1: P04b Kirim pengingat via WA (satu-satu / Kirim ke semua)
           3 kartu siap (PE03b) → "Buka Kontrol acara" aktif
           Hari-H ──▶ F2 BP00 Kontrol acara
```

## Daftar layar

| Kode | Layar | Lane | Jenis | Node |
| --- | --- | --- | --- | --- |
| T01a | Amplop undangan tertutup ("Tap segelnya buat buka") | Tamu | Utama · **baru** | `4847:7245` |
| T01 | Undangan (kebuka, "No. 014") | Tamu | Utama · diubah | `4847:6229` |
| T01e | Link tidak valid / kedaluwarsa | Tamu | Gagal | `4732:13142` |
| T02 | Konfirmasi hadir (nomor WA wajib) | Tamu | Utama | `4784:903` |
| T02b | Nggak bisa datang + titip ucapan | Tamu | Kasus lain · diubah | `4847:6277` |
| T02c | Form belum lengkap | Tamu | Gagal | `4784:944` |
| T02d | Gagal kirim (sinyal) | Tamu | Gagal | `4847:6310` |
| T03 | Tiket + countdown | Tamu | Utama | `4784:1029` |
| T03k | Simpan ke kalender (sheet) | Tamu | Kasus lain · **baru** | `4847:7283` |
| T03h | Dibuka dari WA H-1, countdown jam | Tamu | Kasus lain | `4784:1842` |
| P01 | Masuk panitia (PIN) | Panitia | Utama | `4732:12894` |
| P01b | PIN salah | Panitia | Gagal | `4732:13303` |
| P01c | Terkunci 5 menit | Panitia | Gagal | `4732:13364` |
| PE01 | Event kamu | Panitia | Utama | `4778:4900` |
| PE01a | Belum ada event | Panitia | Kasus lain | `4778:5320` |
| PE02 | Buat event (nama + tanggal) | Panitia | Utama | `4778:4947` |
| PE03 | Home event, kosong ("Buka Kontrol acara" nonaktif) | Panitia | Utama | `4810:11003` |
| PE03b | Home event, terisi ("Buka Kontrol acara" aktif) | Panitia | Kasus lain | `4810:11052` |
| PE03e | Ubah detail event (sheet, 🗑 di judul) | Panitia | Aksi · diubah | `4847:7161` |
| PE03h | Hapus event · konfirmasi | Panitia | Aksi | `4810:11218` |
| PE04k | Rundown, belum ada sesi | Panitia | Aksi | `4778:5408` |
| PE04 | Rundown, atur sesi | Panitia | Aksi | `4778:5443` |
| PE04a | Ubah sesi (sheet, 🗑 di judul) | Panitia | Aksi · diubah | `4847:7066` |
| PE04s | Swipe kiri hapus sesi | Panitia | Aksi · **baru** | `4897:6420` |
| P04k | Tamu & undangan kosong (Pilih file CSV, Unduh template CSV) | Panitia | Utama · diubah | `4847:6405` |
| P04a | Cek & simpan CSV (sekali) | Panitia | Utama | `4784:1714` |
| P04c | CSV ada baris error ("Cek daftar tamu") | Panitia | Gagal · diubah | `4847:6353` |
| P04i | IG kosong / salah format | Panitia | Gagal · **baru** | `4847:7318` |
| P04 | Tamu & undangan, undang via DM IG | Panitia | Utama · diubah | `4847:6454` |
| P04d | Balik dari IG (toast Undo) | Panitia | Kasus lain | `4847:6592` |
| P04g | Filter · Belum jawab (↻ undang lagi) | Panitia | Kasus lain · **baru** | `4847:7376` |
| P04h | Filter · Belum diundang (✈) | Panitia | Kasus lain · **baru** | `4847:7504` |
| P04f | Tambah tamu manual | Panitia | Aksi | `4847:6905` |
| P04e | Ubah tamu | Panitia | Aksi | `4847:6740` |
| P04s | Swipe kiri hapus tamu | Panitia | Aksi · **baru** | `4897:6496` |
| P04b | Kirim pengingat H-1 via WA | Panitia | Utama | `4784:1772` |
| — | Kartu contoh isi template CSV (`template-tamu-hmd.csv`) | Panitia | Aksi · **baru** | `4847:7620` |

## Perubahan desain (22 Okt malam → 23 Okt)

| Layar / kartu | Yang berubah |
| --- | --- |
| **T01a** (baru) | Amplop tertutup sebelum undangan: "Ada surat buat kamu, Rara." · "Untuk Rara Wening · No. 014 · dari Potara Studio" · segel kunci oranye + hint "Tap segelnya buat buka" · "Minggu, 8 Nov 2026 · 13.00 · Kantor baru Potara". Tap segel: flap kebuka, kartu undangan naik keluar amplop, masuk T01. |
| **T01** | Eyebrow jadi "Undangan pribadi · No. 014", ada segel yang udah kebuka. Label "Undangan · kebuka". |
| **T02b** | "Sambil nunggu / Intip cerita pindahan" diganti **Titip ucapan (opsional)**: chip cepat "Selamat pindahan!", "Semoga betah", "Next time aku datang" + field teks + kirim. Footer "Follow @potarastudio buat lihat kolase foto acaranya." |
| **T03k** (baru) | Sheet Simpan ke kalender: pilih Google Calendar atau kalender HP (.ics). "House Moving Day · Min, 8 Nov · 13.00–17.00 · Kantor baru Potara. Pengingat 1 jam sebelum ikut kesimpan." |
| **P04k** | Tombol Unggah CSV di header dihapus. Unggah lewat "Pilih file CSV" di kotak; link "Unduh contoh" → **"Unduh template CSV"** + kartu contoh isi (nama, ig, pesan, wa). |
| **P04c** | Judul "Cek daftar tamu", tanpa segmented. Copy: "Simpan 20 tamu dulu, 3 baris ini ditambah manual nanti. Atau benerin CSV-nya lalu unggah ulang." Tombol "Unggah ulang CSV" + "Simpan 20 tamu dulu". |
| **P04i** (baru) | 3 username IG perlu dicek: IG kosong, ada spasi, link bukan username. "Tamu tanpa IG valid nggak bisa diundang lewat DM…" |
| **P04g / P04h** (baru) | Filter aktif Belum jawab (tombol ↻) / Belum diundang (tombol ✈) dengan hint di atas daftar. |
| **P04 · P04d–f** | Copy hint template: "Template ini otomatis disalin pas kamu tap ✈ di baris tamu". |
| **P04s / PE04s** (baru) | Swipe kiri di baris tamu/sesi → panel merah "Hapus". Tap → kehapus + Batalkan 5 dtk. |
| **PE03e / PE04a** | Hapus pindah ke ikon 🗑 di kanan judul sheet (dulu tombol di bawah). PE03e sisa tombol "Simpan perubahan" + "Batal"; PE04a "Simpan sesi" + "Batal". |
| Kartu case | Banyak kartu dapat pill "LAYAR …" (T03, T03k, P04, P04g, P04h, P04i, P04k, Template CSV) + copy baru: DM masuk "Permintaan pesan" (kejadian di IG, lalu ke T01a), Ubah/hapus tamu & sesi (sheet + swipe), Hapus event (ikon 🗑), Unduh template CSV. |
| Cerita · F1 | Paragraf tamu sekarang menjelaskan amplop T01a → T01. |
| Chip ke F2 | "F2 · Hari-H: tamu buka tiketnya (T05)" dan "F2 · Hari-H: Home event jadi Kontrol acara (BP00)". |

## Penerapan design system (23 Okt)

### Komponen

| Perubahan | Jumlah | Layar |
| --- | --- | --- |
| Tombol custom → `Clean/Button` Small: Tambah tamu (Secondary + user-plus), Pilih file CSV (Primary + upload), Edit / Buka (Secondary) | 11 | P04, P04d–h, P04s, P04k, PE03e |
| Tombol ikon di baris tamu → Small Icon only: ✎ (Secondary, pencil), ↻ (Secondary), ✈ (Primary) | 66 | P04, P04d–h, P04s |
| Ikon 🗑 di judul sheet → Small **Destructive** Icon only | 2 | PE03e, PE04a |
| "Hapus tamu" di sheet Ubah tamu: Secondary → **Destructive** Large | 1 | P04e |
| `Clean/Button` yang fill/stroke/efeknya di-override → di-reset ke varian aslinya | 7 | T02b, T02d, P04c, P04i, T03k |
| Status → `Clean/Badge`: Hadir / Diundang barusan = **Success** · Diundang / Belum diundang / Draft / Opsional / Info = **Neutral** · Belum jawab / Persiapan · H-17 / Wajib = **Crew** · Nggak bisa / Baris error = **Danger** (baru) · Talkshow = **Live** | 93 | PE01, PE02, PE03b/e/h, PE04, PE04a, PE04s, P04*, P04c, P04i, P04k |
| Info event → `Clean/Pill` + ikon: "20 tamu", "Belum ada tamu" (users), "Rundown 4 sesi", "Rundown kosong" (list-bullets) | 8 | PE01, PE02 |

Hasil audit: 36 layar F1 pakai 138 `Clean/Button`, 102 `Clean/Badge`, 11 `Clean/Pill`, 23 `Clean/IconButton`, 3 `Clean/Ticket`, 4 `Potara/Logo mark`. Override yang tersisa cuma **opacity** buat state nonaktif ("Saya hadir" di T02c, "Buka Kontrol acara" di PE03).

### Warna → variabel

- **1.065 fill/stroke** sekarang terhubung ke variabel **Potara Clean / Color**. Pemetaannya:
  - `bg` buat latar layar; `card` / `card-2` buat kartu & tile.
  - `label`, `label-2`, `label-3` buat teks & ikon; `cta` / `on-cta` buat elemen gelap dan teks di atasnya.
  - `accent*`, `crew*`, `success*`, `warning*`, `danger*` buat status; `separator` buat garis list.
- **Variabel baru `danger-fill`** (#F54847, scope Frame/Shape fill, code `var(--danger-fill)`). Dipakai di `Clean/Button` Destructive dan panel swipe "Hapus".
- **Sisa 63 warna** belum ada variabelnya:
  - Segmented control: #F1F1F3, #E2E2E4, #232325, #5B5B5D.
  - Backdrop sheet: Ink 40%.
  - Grabber: #D9D5CF.
  - Toast: #2A2826.
  - Detail amplop T01a: #F8E6D2, #EBD9C6.
  - Beberapa abu-abu: #A39E96, #8A847C, #C9C4BC, #E4E1DC.

### Update komponen design system

**Button Primary → oranye (1:1 referensi "Delete", full rounded)**. Ini versi final 23 Okt; versi "Sign up" dengan ring krem sebelumnya udah diganti. Berlaku di 4 varian Primary (Large/Small × Text/Icon only). Secondary dan Destructive tidak berubah.

| Bagian | Large | Small |
| --- | --- | --- |
| Bentuk | pill, radius 999 | sama |
| Fill | gradient vertikal #F87030 → #F06A27 (30%) → #E86322 (65%) → #E15A1A | sama |
| Border (layer `Border`, inside) | 1,25 px #B04A14 | 1 px |
| Highlight atas (inner shadow) | `inset 0 1.5 1 rgba(255,176,136,.85)` | `inset 0 1 0.5 …` |
| Shadow | glow `0 4 9 rgba(226,100,31,.32)` + `0 1 1.5 rgba(138,58,14,.18)` | `0 2.5 6 …` + sama |
| Label & ikon | #FFFFFF, Switzer **Semibold** (Large 17, Small 13) | sama |

Layer `Rim` disembunyikan (nggak dipakai lagi), layer `Inner edge` dihapus.

**Diterapkan ke semua layar:** semua 179 instance Primary di page ikut berubah otomatis.

- Di All Case Flow · v1, 26 Primary yang fill, radius, atau efeknya masih di-override pakai style lama udah di-reset: F2 (3), N1 (2), N3 (1), N4 (3), F5 (17).
- Warna ikon di 106 Primary disamain jadi putih.
- "Tandai dijawab" (N1 · P10) dan 2× "Gulir otomatis" (N2 · P09) dari pill hitam custom jadi Small Primary.
- Arsip **nggak** disentuh: "Backup · flow lama", section salinan `4652:5762`, backup F2 `4824:5502`, dan BP00 lama `4820:5449`.

`Clean/Badge` dapat **Type=Danger**: fill `danger-soft`, titik & label `danger-text`.

> Catatan: Primary oranye (#F06A27) sekarang deket sama Destructive (#F54847). Di layar yang punya dua-duanya (PE03h: "Ya, hapus event" + "Batal"; PE04a: 🗑 + "Simpan sesi") masih kebaca beda karena posisinya, tapi perlu dicek. Opsi: Destructive pakai merah yang lebih dingin/gelap (mis. #D92D20), atau Destructive cuma dipakai di sheet konfirmasi.

### Elemen yang belum punya komponen

| Elemen | Layar | Yang dibutuhin |
| --- | --- | --- |
| Segmented control (Undangan / Pengingat H-1, Info / Talkshow) | P04*, P04b, PE04a | Komponen Segmented + variabel warnanya |
| Filter chip (Semua 20, Belum diundang 8, …) & chip ucapan | P04*, T02b | Komponen Chip (aktif/nonaktif) |
| Baris tamu / sesi (avatar, nama, @ig, status, aksi) + panel swipe | P04*, PE04*, P04b | `Clean/ListRow` dengan slot status & aksi |
| Toast Undo ("Batalkan · 5") | P04d | Komponen Toast |
| Field input, toggle, sheet + grabber + backdrop | T02*, PE02, PE03e, PE04a, P04e/f, T03k | Field, Toggle, Sheet |
| Ikon kirim di field ucapan | T02b | Ikut komponen Field (aksi di kanan) |
| Amplop + segel | T01a | Ilustrasi/komponen sekali pakai, cukup di kode |

## Keputusan & asumsi

| Keputusan | Kenapa | Perlu dicek |
| --- | --- | --- |
| Undangan cuma lewat DM IG | Panitia nggak punya nomor WA semua tamu | — |
| Link DM buka amplop dulu (T01a), baru undangan | Momen "dapat surat" | Amplop muncul tiap buka link, atau cuma pertama kali? Usul: pertama kali aja |
| Nomor WA wajib diisi tamu pas konfirmasi | Dipakai buat kirim pengingat H-1 | Oke dari sisi privasi? |
| Titip ucapan di T02b (opsional) | Tamu yang nggak datang tetap bisa ikut | Ucapan tampil di mana? (rekap panitia / kolase?) Belum ada di PRD |
| "Kirim ke semua" WA manual, satu per satu | Nggak pakai WA API | Panitia sanggup kirim \~17 chat manual? |
| Status "Diundang" diset pas panitia balik ke app, ada Undo 5 detik | IG nggak bisa konfirmasi DM terkirim | — |
| CSV cuma bisa diunggah sekali | Biar status undangan nggak kereset | Tapi P04c/P04i nyaranin "unggah ulang" sebelum disimpan. Jelasin: ulang boleh **sebelum** simpan |
| Hapus tamu/sesi lewat swipe kiri + Undo 5 dtk, atau 🗑 di sheet | Cepat tapi bisa dibatalin | Swipe nggak kelihatan; ikon 🗑 di sheet tetap jadi jalur utama |
| Hapus event lewat 🗑 di sheet Edit + konfirmasi kedua | Datanya nggak bisa dibalikin | — |
| "Buka Kontrol acara" aktif kalau detail, tamu, dan rundown terisi | Kontrol acara butuh rundown & tamu | Boleh dibuka sebelum hari-H buat gladi? |
| Simpan ke kalender: Google Calendar atau .ics | iOS & Android | — |
| Primary jadi oranye full rounded (referensi "Delete") | Permintaan desain 23 Okt; berlaku di semua bab | Prinsip design.md "Tombol utama = Ink" perlu diupdate |
| Status pakai `Clean/Badge` (ada titik/ikon, tinggi 30 di ukuran asli) | Satu komponen status di semua layar | Belum jawab & Wajib pakai Crew (amber), bukan Warning (kuning) |

## Next step

- [ ] Review flow F1 dan kasih komentar langsung di Figma
- [ ] Setujui tabel keputusan di atas (terutama amplop, titip ucapan, unggah ulang CSV)
- [ ] Cek Primary oranye vs Destructive merah; putuskan warna Destructive
- [ ] Bikin komponen Segmented, Chip, ListRow + slot, Toast, Field, Toggle, Sheet
- [ ] Putuskan State=Disabled di `Clean/Button` (T02c, PE03 masih opacity)
- [x] ~~Prompt Claude Code untuk update F1~~ → `F1-prompt-claude-code.md` (update 23 Okt)
- [ ] Update design.md (Primary oranye, Badge Danger, `danger-fill`)
- [ ] Samakan tombol di layar full-size Archive (C12, C16) dan bab lain dengan Primary baru
- [ ] Handoff ke dev (produk freeze 30 Okt, 17.00)
