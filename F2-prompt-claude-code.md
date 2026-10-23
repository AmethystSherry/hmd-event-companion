# Prompt Claude Code — F2 Check-in di pintu

Cara pakai:

1. Pastikan F1 udah di-review dan di-commit. Taruh `F2-deliverables.md` dan file ini di root repo (sejajar `F1-deliverables.md`).
2. Buka Claude Code di repo itu, kirim **Prompt A**. Tunggu ringkasan + rencananya, lalu konfirmasi atau koreksi.
3. Kirim **Prompt B** (data, API, logika check-in + tes). Cek tesnya, terus commit.
4. Kirim **Prompt C** (layar F2 + realtime + offline). Uji di 2 HP, terus commit.
5. Kalau ada keputusan tim yang berubah setelah itu, pakai **Prompt D**.
6. **Update desain 23 Okt:** kalau Prompt A–C udah terlanjur dikerjain, kirim **Prompt E** aja (isinya cuma perubahan hari ini). Kalau belum mulai sama sekali, tetap kirim A → B → C dulu, lalu E.

Prompt ini menggantikan "Phase 4 — F2" di `HANDOFF-CLAUDE-CODE.md`. Kalau Figma MCP tersedia di Claude Code, dia bisa ambil ukuran dan screenshot langsung dari node yang disebut di bawah.

---

## Prompt A — Baca dulu, jangan nulis kode

```text
Kita lanjut ke F2 · Check-in di pintu (HMD Event Companion, Konsep B). F1 udah selesai di kode.

Sumber kebenaran (urutan prioritas kalau bertentangan):
1. Figma band F2: file xYZlQ3GjRHHtYcod8rTIZJ, node 4667:4654 ("F2 · Check-in di pintu", di dalam All Case Flow · v1, page DOKSLI SAPI). Komponen di frame "Clean v0.5 / Components" (4587:276).
2. F2-deliverables.md → daftar 13 layar, copy per layar, kartu kasus, keputusan & asumsi (termasuk yang beda dari PRD).
3. prd.md v0.2 → §6 model state, §7 F2, §8 data (Ticket), §9 NFR (offline, idempoten).
4. design.md → bagian Tiket (animasi sobek), token, motion.
5. CLAUDE.md → stack, struktur, aturan design system & konvensi. Ikuti persis.

Tugas sekarang (TANPA menulis kode):
1. Petakan yang udah ada dan bisa dipakai ulang untuk F2: model Ticket/Guest di lib/data, HMAC QR di lib/server, TicketQr, Ticket/Ticket torn/TicketStub, sw.js (tiket offline), /api/live (SSE) + LiveRefresh, sesi panitia (cookie), route /panitia/event/[id]/kontrol (placeholder), TabBar, Sheet, Badge, Chip, SearchField, Field, Banner, Toast, ListRow/Avatar, StatTile.
2. Tabel layar F2: kode layar | route/komponen yang diusulkan | komponen UI yang dipakai | yang perlu dibuat baru.
   Usulan awal: tamu tetap di /t/[token] (hari-H → T05, setelah masuk → BT02 sekali lalu T03b);
   panitia BP00 = /panitia/event/[id]/kontrol, P05/P06 = /panitia/event/[id]/scan, P07 = /panitia/event/[id]/scan/cari (atau usulanmu).
3. Pilih library scan QR yang gratis & berlisensi MIT/Apache dan jalan di iPhone Safari + Android Chrome (BarcodeDetector nggak ada di iOS). Kasih 2 opsi + alasan.
4. Jelaskan rencana: (a) cara "hari-H" dideteksi + override untuk testing, (b) validasi offline di HP panitia TANPA menaruh secret HMAC di browser, (c) antrean check-in offline (IndexedDB) + sinkron idempoten, (d) cara HP tamu tahu tiketnya udah discan (SSE yang ada).
5. Daftar hal di F2-deliverables.md "Keputusan & asumsi" yang belum diputuskan dan butuh jawabanku sebelum lanjut.
Ringkas ≤ 15 poin + rencana file yang disentuh. Tunggu konfirmasiku.
```

---

## Prompt B — Data, API, dan logika check-in (pakai tes)

```text
Prompt B: bangun logika F2 di lib/ + API, BELUM layar. Ikuti struktur yang ada (lib/data store murni + tes, getStore(), lib/server).

1. Data (prd.md §8, F2-deliverables.md):
   - Ticket: ticketId, guestId, shortCode (mis. HMD-014-7F3K), qrSig, status "aktif" | "dipakai", checkedInAt, checkedInBy (id/label HP panitia), method "scan" | "manual".
   - Tiket dibuat saat tamu konfirmasi Hadir (cek apa F1 udah bikin; kalau belum, tambahkan). Walk-in & "RSVP Nggak bisa tapi datang" dapat tiket saat check-in.
   - Guest.source tambah "walkin". Check-in tamu RSVP "nggak" → rsvp jadi "hadir".
2. Fungsi murni di store (dengan tes Vitest):
   - checkInByQr(payload, by): verifikasi HMAC → "valid" (+ urutan tamu ke-n) | "sudah_dipakai" (+ jam & method & oleh siapa) | "tidak_dikenal" (QR rusak, sig salah, tiket event lain).
   - checkInManual(guestId, by) → valid / sudah_dipakai.
   - undoCheckIn(ticketId, by) → hanya boleh ≤ 5 dtk setelah check-in manual oleh HP yang sama; status balik "aktif", hitungan turun.
   - addWalkIn({nama, ig?}, by) → guest baru + tiket langsung "dipakai" method manual.
   - Idempoten: check-in dobel (2 HP / retry jaringan / antrean offline) → yang pertama menang, berikutnya "sudah_dipakai". Hitungan nggak pernah dobel.
   - Hitungan: masuk = jumlah tiket "dipakai"; total = tamu RSVP hadir + walk-in (tulis sebagai konstanta/fungsi yang gampang diganti, ini masih menunggu keputusan tim).
3. API (server action atau route handler, sesuai pola F1), semua butuh sesi panitia kecuali yang tamu:
   - POST check-in by QR, POST check-in manual, POST undo, POST walk-in.
   - POST batch sinkron antrean offline: array {clientId, kind, payload, at}; balas hasil per item; aman diulang (clientId unik).
   - GET snapshot untuk HP panitia: daftar tamu (nama, ig, status, shortCode, ticketId) + versi `rev`, buat validasi offline. JANGAN kirim secret HMAC ke browser.
   - Tiap perubahan menaikkan `rev` → /api/live (yang udah ada) → tamu & panitia refresh.
4. Hari-H: helper isEventDay(event, now) (mulai 00.00 WIB tanggal event). Untuk testing: override waktu lewat env/dev-only (mis. HMD_NOW di .env.local atau query ?now= hanya saat NODE_ENV=development).
5. Data dummy: 20 tamu fiktif (seed yang ada) dengan campuran: 12 hadir belum masuk, 5 udah masuk, 2 RSVP nggak bisa, 1 belum jawab.

Definition of Done
- [ ] Tes: valid, dobel scan, QR acak, QR event lain, manual, undo ≤ 5 dtk & > 5 dtk, walk-in, RSVP nggak → hadir, batch sinkron diulang 2× tetap konsisten
- [ ] npm test, lint, typecheck lulus
Laporkan file yang diubah + ringkas hasil tes.
```

---

## Prompt C — Bangun layar F2

```text
Prompt C: bangun 13 layar F2 sesuai Figma band 4667:4654 dan F2-deliverables.md ("Daftar layar", "Copy per layar", "Kartu kasus"). Copy PERSIS seperti tabel copy (bukan tabel usulan).
Layar di band skala 0,5 → ukuran asli 2× (frame 390×844). Teks: 6,5 → t-label (13), 7,5 → t-body (15), 8,5 → t-headline (17), 6 → t-caption (12), 12 → t-card-title (24), 16 → t-title (32).
Pakai HANYA komponen di components/ui. Elemen yang di Figma masih custom (search field, chip, sheet, field, banner, baris tamu, badge merah RSVP) → pakai komponen kode yang udah ada; kalau belum ada varian yang pas (mis. Badge danger), tambah varian di komponen itu, jangan bikin komponen paralel. Tanya dulu kalau ragu.

Tamu (/t/[token])
- T05 (4807:729): hari-H & tiket aktif → Ticket dengan QR asli + badge "Belum masuk". Header "Hari-H · pintu udah dibuka" / "Tunjukkan QR ke panitia". Badge "Kecerahan maks" = tombol: mode QR layar penuh latar putih + Screen Wake Lock (browser nggak bisa ngatur brightness). Tiket & QR tetap tampil offline (sw.js).
- T05a (4807:742) → BT02 (4807:756): saat tiket jadi "dipakai" (SSE → refresh), mainkan animasi sobek (design.md: potongan QR lepas & jatuh ±900 ms; prefers-reduced-motion = fade), lalu BT02 "Selamat datang di rumah baru, {nama depan}!" + cap "MASUK {jam} · Tamu ke-{n} dari {total}" + Badge Success "Sudah masuk". lg primary "Masuk sekarang" + otomatis 3 dtk → layar acara (route F3/F4 placeholder; kalau ada sesi aktif ke Sesi, kalau nggak ke Jeda). BT02 cuma tampil sekali (simpan flag lokal).
- T03b (4807:991): tiket dibuka lagi setelah masuk → Ticket torn + baris "QR nonaktif / Discan panitia {jam} · nggak bisa dipakai lagi" + lg primary "Kembali ke acara". Nggak ada QR aktif.
- HP tamu offline saat discan → begitu online, refresh → animasi sobek tetap jalan.
- Sebelum hari-H tetap T03 (F1).

Panitia
- BP00 (4814:707) di /panitia/event/[id]/kontrol: hari-H, PE03b otomatis redirect ke sini. Header "Kontrol acara · {tanggal}" + judul event + Badge Crew "Hari-H · Live". Card Pintu masuk: eyebrow "Pintu masuk · buka sejak 13.00", judul "{n} tamu udah masuk", sub "{sisa} lagi belum datang", lg primary "Scan tiket". StatTile Check-in {n}/{total} (tap → P07), Foto 0, Pertanyaan 0. Card Rundown read-only (daftar sesi + jam + PIC, status "Belum mulai"); kontrol sesi itu F3, jangan dibangun. TabBar panitia + tombol QR → P05. Angka update realtime dari HP panitia lain.
- P05 (4807:775): "Pintu masuk · {n} dari {total} sudah masuk" / "Scan tiket" + Badge Crew "Hari-H". Kamera langsung aktif (kamera belakang), bingkai viewfinder, "Arahkan ke QR di tiket tamu". lg secondary "Cari nama" (ikon MagnifyingGlass) → P07. Debounce: QR yang sama dalam 3 dtk diabaikan.
- P06 (4807:805) Valid: Sheet di atas kamera; avatar inisial, nama, "Kunci #{keyNo} · @{ig}", ✓, Badge Success "Valid · tamu ke-{n}" + Badge Neutral "Masuk {jam}", lg primary "Scan berikutnya", caption "Tiket di HP tamu sobek otomatis · tutup dalam 2 detik". Tutup sendiri 2 dtk, kamera tetap nyala. Bunyi pendek + navigator.vibrate kalau ada.
- P06b (4807:1028) Sudah dipakai: ikon Clock, "Tiket sudah dipakai", "{nama} sudah masuk {jam} lewat {scan|manual}. Hitungan tamu tidak bertambah." lg primary "Scan berikutnya" + lg secondary "Lihat detail tamu" (→ P07 dengan nama itu).
- P06c (4807:1079) Tidak dikenal: ikon X, "Tiket tidak dikenal", "QR ini bukan tiket {nama event}. Minta tamu buka tiket dari link WA-nya, lalu scan lagi." lg primary "Scan lagi".
- P05b (4807:1236): kalau offline / request gagal → validasi lokal dari snapshot, simpan di antrean IndexedDB, strip "Sinyal lemah · {k} check-in nunggu, terkirim otomatis" (ikon WifiSlash). Sinkron otomatis saat online (online event + interval), hilang kalau antrean kosong.
- P07 (4807:851): IconButton back, sm secondary "Tambah tamu" (UserPlus), "Hari-H · {n} dari {total} udah masuk" / "Cari nama", SearchField "Cari nama atau @instagram" (juga cocokkan shortCode), Chip filter "Semua {x} / Belum masuk {y} / Udah masuk {z}", baris tamu: Avatar inisial, nama, @ig, Badge Success "Udah masuk" atau Neutral "Belum masuk", badge danger "RSVP: Nggak bisa" kalau rsvp nggak. Yang belum masuk punya sm primary icon-only ✓ (aria-label "Check-in {nama}"); yang udah masuk nggak ada tombol. Tap ✓ → check-in manual + Toast "{nama} udah masuk" dengan Batalkan 5 dtk (undo ring). Jalan juga offline (antrean).
- P07b (4807:1129): izin kamera ditolak / error → langsung ke P07 + Banner warning "Kamera nggak bisa dipakai" / "Langsung pindah ke cari nama. Cocokkan nama + IG tamu, lalu check-in."
- P07c (4807:1319): pencarian kosong → "“{q}” nggak ada di daftar" / "Tamu walk-in? Tambahkan cepat di bawah."; "Tambah tamu" → Sheet "Tambah tamu cepat" / "Walk-in · nggak ada di daftar, langsung tercatat masuk", Field Nama (prefill dari pencarian), Field Username Instagram, info "Statusnya langsung "Udah masuk" dan ikut kehitung di jumlah tamu.", lg primary "Tambah & check-in" (nonaktif kalau nama kosong) + lg secondary "Batal".

Teknis
- Kamera butuh HTTPS: siapkan cara uji di HP (mis. `next dev --experimental-https` atau preview Vercel). Tulis langkahnya di CLAUDE.md "Cara run".
- Semua layar F2 masuk /dev/states/f2 (seperti /dev/states/f1) + tombol simulasi: "Jadikan hari-H", "Scan tiket tamu X" (tanpa kamera), "Matikan jaringan (simulasi)", "Reset check-in".
- Semua tombol pakai Button (lg untuk CTA & sheet, sm untuk header/baris). Nggak ada warna hex di komponen.

Definition of Done
- [ ] 13 layar F2 bisa dipicu di /dev/states/f2, cocok dengan Figma (bandingkan screenshot 390×844)
- [ ] 2 HP asli: scan → sheet Valid → tiket di HP tamu sobek → BT02 → layar acara; median scan→sobek < 10 dtk
- [ ] Scan tiket yang sama 2× / dari 2 HP → "Sudah dipakai", hitungan nggak nambah
- [ ] QR acak → "Tidak dikenal"
- [ ] HP panitia mode pesawat: scan & P07 tetap jalan, antrean terkirim saat online, angka benar
- [ ] HP tamu mode pesawat: T05 tetap tampil; sobek setelah online
- [ ] Walk-in & undo 5 dtk jalan; BP00 angka realtime di semua HP panitia
- [ ] npm test, lint, typecheck, build lulus
Laporkan file yang diubah, screenshot tiap layar, dan cara aku uji di 2 HP.
```

---

## Prompt D — Susulan kalau keputusan tim berubah

```text
Prompt D: ada keputusan baru untuk F2 (lihat F2-deliverables.md versi terbaru + Figma 4667:4654). Kerjakan HANYA yang aku sebut di bawah, jangan ubah layar lain:
- [isi, mis. "pembagi = RSVP hadir + walk-in", "tambah tombol Unduh daftar manual (PDF) di P07", "terapkan usulan copy P06b"]
Update tes yang terdampak + /dev/states/f2. Laporkan file yang diubah + screenshot 390×844.
```

---

## Belum termasuk (jangan dikerjakan dulu)

- Kontrol sesi di BP00/BP01 (Mulai, Selesaikan, Tutup acara) dan isi layar Jeda/Sesi tamu: F3 + F4. Cukup route placeholder sebagai tujuan BT02.
- "Unduh daftar manual (PDF)" (P07d di HANDOFF): belum ada di band F2, menunggu keputusan tim.
- Usulan copy di F2-deliverables.md ("Usulan copy yang belum diterapkan"): ikut Figma dulu sampai disetujui.
- Varian card Pintu masuk per kondisi (sebelum buka, sesi jalan, semua datang): belum ada di Figma. Untuk sekarang pakai satu varian "{n} tamu udah masuk / {sisa} lagi belum datang".
