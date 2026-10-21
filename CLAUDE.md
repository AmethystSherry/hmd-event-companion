@AGENTS.md

# HMD Event Companion · Konsep B "Satu Layar, Dua Mode"

Web app mobile untuk House Moving Day Potara Studio (Minggu 8 Nov 2026, 13.00–17.00, ±20 tamu).
Tamu: undangan → tiket QR → layar acara JEDA ⇄ SESI yang digerakkan panitia → buku tamu & kolase.
Panitia: PIN → kirim undangan, scan tiket, kontrol sesi.

## Sumber kebenaran
- **Figma** `xYZlQ3GjRHHtYcod8rTIZJ`, page DOKSLI SAPI → section "Screen Flow · All Case" → frame
  **All Case Flow · v1** (4665:3650). Bab: F1 4666:6822 · F2 4667:4654 · F3+F4 4668:4730 ·
  N1 4669:4888 · N2 4669:4993 · N3 4670:4888 · N4 4670:4981 · F5 4671:4888.
  Layar ukuran penuh & komponen: "Finalise Alfin" (4648:1920), frame "Clean v0.5 / Components".
  Arsip (abaikan): Screen Flow Konsep B v2, "Backup · flow lama", Flow v0.2, iOS v0.3, Konsep A/B awal.
- Prioritas alur/layar/state/tampilan: **All Case Flow v1 > design.md > prd.md**.
  Aturan bisnis, data & privasi, NFR, milestone: **prd.md**.
- Rencana kerja per phase: `HANDOFF-CLAUDE-CODE.md`. Kerjakan satu phase, tunggu "lanjut".

## Stack (disetujui 21 Okt 2026)
- Next.js 16 (App Router, TypeScript, `cacheComponents` aktif) — baca `node_modules/next/dist/docs/`
  sebelum memakai API Next; banyak yang berubah dari versi lama.
- CSS biasa + CSS Modules + CSS variables (tanpa Tailwind) supaya nilai piksel Figma bisa persis.
- Font: Switzer variable self-host (`app/fonts/`, Free Font License), JetBrains Mono via `next/font`.
- Tes: Vitest. Format: Prettier (printWidth 100). Lint: ESLint (config Next).
- Rencana hosting: Vercel Hobby (gratis). Database: Supabase free (lihat "Ditunda").

### Ditunda sampai akhir proyek (keputusan user 21 Okt)
- **Database asli** (Supabase) dan **offline/service worker**. Sampai saat itu semua data lewat
  `lib/data` dengan adapter **mock in-memory** (`lib/data/mock.ts`). Pemanggil hanya memakai
  `getStore()`; adapter DB nanti dipasang di `lib/data/index.ts` tanpa mengubah layar.
- Akibatnya: data hilang saat server restart, dan mock hanya konsisten di satu proses `next dev`
  (cukup untuk uji banyak HP di LAN yang sama, tidak untuk Vercel serverless).

## Struktur
```
app/
  (tamu)/t/[token]/   halaman tamu via link unik bertoken (T01…T15, BT*)
  panitia/            ruang panitia (P*, BP*)
  dev/status/         versi build + status sumber data
  fonts/              Switzer
components/ui/        komponen design system Clean v0.5 (Phase 1)
lib/data/             tipe domain + DataStore (mock sekarang, DB nanti)
```

## Cara run
```bash
npm install
npm run dev          # http://localhost:3000
npm run dev -- -H 0.0.0.0   # buka dari HP di Wi-Fi yang sama: http://<IP-laptop>:3000
npm test             # vitest
npm run lint && npm run typecheck && npm run format:check
npm run build
```
Env: salin `.env.example` → `.env.local`. Phase 0 belum butuh variabel.

## Konvensi
- Copy UI Bahasa Indonesia santai, persis Figma/design.md §7. Jam 24 jam pakai titik (13.00).
- ID layar Figma (T01, BT03, P06b…) dipakai di nama komponen/route/komentar supaya mudah dilacak.
- Semua halaman `noindex` (metadata + header `X-Robots-Tag`). Token tamu tidak pernah ditampilkan/di-log.
- Tidak ada data tamu asli, password, atau secret di kode/chat. Hanya CSV dummy sampai Test Day.
- Hanya layanan gratis / yang sudah dimiliki studio.
- Tiap layar wajib punya state loading, kosong, error, offline sesuai kartu case All Case Flow v1.
- Commit kecil per fitur. Repo GitHub harus **private** (PRD rahasia sampai Test Day).

## Status phase
- [x] Phase 0 — fondasi (tanpa DB & offline, ditunda)
- [ ] Phase 1 — design system
