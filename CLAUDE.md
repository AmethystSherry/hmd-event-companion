@AGENTS.md

# HMD Event Companion · Konsep B "Satu Layar, Dua Mode"

Web app mobile untuk House Moving Day Potara Studio (Minggu 8 Nov 2026, 13.00–17.00, ±20 tamu).

## ⏸ Status: development di-hold (22 Okt 2026)
**Development di-hold untuk revisi logika. Yang aktif hanya design system (Phase 1).**
Kode lama (Phase 0–5: data mock, akses token & PIN, F1 undangan, F2 check-in QR, F3+F4 mode acara
realtime) ada di branch **`archive/pre-revisi`** / tag **`archive-pre-revisi`** (commit `db60e73`).
Phase 2 dst akan dikerjakan ulang setelah `prd.md` direvisi.
- Jangan membangun fitur baru sampai prd.md revisi tersedia & user bilang lanjut.
- Ambil ulang kode lama hanya kalau diminta: `git show archive-pre-revisi:<path>` atau
  `git checkout archive-pre-revisi -- <path>`. Jangan force push / rewrite history / hapus branch.
- Branch & tag arsip baru ada di lokal (repo belum punya remote); push setelah remote ditambahkan.

## Sumber kebenaran
- **Figma** `xYZlQ3GjRHHtYcod8rTIZJ`, page DOKSLI SAPI → section "Screen Flow · All Case" → frame
  **All Case Flow · v1** (4665:3650). Layar ukuran penuh & komponen: "Finalise Alfin" (4648:1920),
  frame "Clean v0.5 / Components". (Bisa berubah mengikuti revisi logika.)
- Prioritas tampilan: **All Case Flow v1 > design.md > prd.md**. Aturan bisnis: **prd.md** (sedang direvisi).
- Rencana kerja per phase: `HANDOFF-CLAUDE-CODE.md` (akan disesuaikan dengan prd.md revisi).

## Stack (disetujui 21 Okt 2026)
- Next.js 16 (App Router, TypeScript, `cacheComponents` aktif) — baca `node_modules/next/dist/docs/`
  sebelum memakai API Next; banyak yang berubah dari versi lama.
- CSS biasa + CSS Modules + CSS variables (tanpa Tailwind) supaya nilai piksel Figma bisa persis.
- Font: Switzer variable self-host (`app/fonts/`, Free Font License), JetBrains Mono via `next/font`.
- Ikon: `@phosphor-icons/react`. Tes: Vitest. Format: Prettier (printWidth 100). Lint: ESLint (config Next).
- Rencana hosting: Vercel Hobby (gratis). Database: belum diputuskan ulang (dulu rencana Supabase free).

## Struktur (main)
```
app/
  layout.tsx          root layout: font, viewport, metadata robots noindex
  page.tsx            beranda sementara → tautan ke /dev/ui
  dev/ui/             preview design system (light & dark)
  tokens.css          token warna/radius/spacing/shadow/motion + kelas tipografi t-*
  globals.css         reset & base style
  fonts/              Switzer + lisensi
  placeholder.module.css  gaya beranda sementara
components/ui/        komponen design system Clean v0.5
components/icons.ts   ekspor ikon Phosphor (/ssr)
lib/cx.ts             util className (dipakai komponen UI)
public/figma/         aset statis Figma (logo mark, ember, knob toggle)
next.config.ts        header X-Robots-Tag noindex, allowedDevOrigins (HP di LAN)
```

## Design system (Clean v0.5)
- Token: `app/tokens.css` — warna semantik light (utama) + dark (`prefers-color-scheme`, atau paksa
  dengan `html[data-theme="light|dark"]`), radius, spacing, shadow, motion, kelas tipografi `t-*`
  (Clean/* dari Figma; tracking Figma dalam persen → `em`).
- Komponen: `components/ui/*` (satu `.tsx` + `.module.css`), ekspor lewat `@/components/ui`.
  Button, IconButton, DestructiveButton, Toggle, Segmented, Badge, Pill/Chip/AddChip,
  Card/CardLabel/InnerBox, StatTile, ListRow/Avatar, Banner/TextAction, HeroState, Field, Toast
  (undo ring), Sheet (bawah / `floating`), TabBar, Ticket (+`torn`)/TicketStub, LogoMark,
  Screen/ScreenHeader/Skeleton, SearchField.
- `Screen`: `withBack` (konten mulai 8px), `bottom` + `bottomHeight` (1 tombol 54, 2 tombol 118,
  +caption 28) → fade scroll-edge otomatis di atas aksi bawah.
- Catatan: `TabBar` masih menautkan ke `/panitia/*` (rute diarsipkan → 404 kalau diklik);
  `Ticket` tanpa QR asli menampilkan placeholder (generator QR diarsipkan).
- Ikon: hanya lewat `@/components/icons` (ukuran via prop `size`, warna `currentColor`).
- Bentuk yang ikut tema (lekukan, gerigi, tepi sobek tiket) digambar CSS/SVG inline dengan `var(--bg)`.
- Jangan pakai warna hex di komponen; pakai token. Pengecualian tetap di kedua mode:
  Button Primary, tab bar panitia, tombol destruktif, QR.
- Preview semua komponen & tema: `/dev/ui`.

## Cara run
```bash
npm install
npm run dev          # http://localhost:3000/dev/ui · HP di Wi-Fi sama: http://<IP-laptop>:3000 (baris "Network")
npm test             # vitest
npm run lint && npm run typecheck && npm run format:check
npm run build
```
`.env.example` masih berisi variabel kode lama (PIN, secret HMAC, Claude); main saat ini tidak butuh env.

## Konvensi
- Copy UI Bahasa Indonesia santai, persis Figma/design.md §7. Jam 24 jam pakai titik (13.00).
- ID layar Figma (T01, BT03, P06b…) dipakai di nama komponen/route/komentar supaya mudah dilacak.
- Semua halaman `noindex` (metadata + header `X-Robots-Tag`).
- Tidak ada data tamu asli, password, atau secret di kode/chat. Hanya data dummy sampai Test Day.
- Hanya layanan gratis / yang sudah dimiliki studio.
- Commit kecil per fitur. Repo GitHub harus **private** (PRD rahasia sampai Test Day).

## Status phase
- [x] Phase 0 — fondasi (scaffold, font, noindex) — sisa yang relevan tetap di main
- [x] Phase 1 — design system (`/dev/ui`) — **aktif**
- [ ] Phase 2–9 — dikerjakan ulang setelah prd.md direvisi (versi lama: tag `archive-pre-revisi`)
