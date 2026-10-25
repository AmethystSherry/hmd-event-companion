import type { ReactNode } from "react";
import { acara, jeda1 } from "../f4/screens";
import { demoCard } from "./cards";

// Registri layar N3 (N3-deliverables.md "Daftar layar", Figma section 4670:4888) untuk
// /dev/states/n3/[code]. Komponen sama dengan route asli (AcaraScreen + sheet), data contoh dari
// store di memori (20 tamu, Rara = pemilik HP #014), tanpa server: jam beku, tanpa jaringan.

export type ScreenDef = {
  code: string;
  name: string;
  kind: "Utama" | "Kasus" | "Aksi" | "Gagal";
  lane: "Tamu";
  render: () => ReactNode;
};

const NOW = "13:48:00"; // jeda setelah Open space
const onlyTwo = { here: (name: string) => /^(Rara|Bima)\b/.test(name) };
// T11e: kartu Rara kosong, tamu lain tetap kartu dummy.
const emptyMine = {
  card: (name: string, i: number) =>
    name.startsWith("Rara") ? { role: null, askAbout: [] } : demoCard(name, i),
};

export const SCREENS: ScreenDef[] = [
  {
    code: "BT03",
    name: "Jeda (titik mulai)",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara(jeda1, NOW),
  },
  {
    code: "BT05",
    name: "Tamu di sini",
    kind: "Utama",
    lane: "Tamu",
    render: () => acara(jeda1, NOW, { sheet: "tamu" }),
  },
  {
    code: "BT05b",
    name: "Cari nggak ketemu (“budi”)",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(jeda1, NOW, { sheet: "tamu", kartu: { query: "budi" } }),
  },
  {
    code: "BT05c",
    name: "Baru sedikit yang datang",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(jeda1, NOW, { sheet: "tamu" }, undefined, onlyTwo),
  },
  {
    code: "T11",
    name: "Kartu kamu · ubah",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(jeda1, NOW, { sheet: "kartu" }),
  },
  {
    code: "T11e",
    name: "Kartu kamu masih kosong",
    kind: "Kasus",
    lane: "Tamu",
    render: () => acara(jeda1, NOW, { sheet: "kartu" }, undefined, emptyMine),
  },
  {
    code: "T11s",
    name: "Kartu kesimpan (BT05 + toast)",
    kind: "Aksi",
    lane: "Tamu",
    render: () => acara(jeda1, NOW, { sheet: "tamu", kartu: { saved: true } }),
  },
  {
    code: "T11f",
    name: "Gagal simpan / offline (usulan T6)",
    kind: "Gagal",
    lane: "Tamu",
    render: () => acara(jeda1, NOW, { sheet: "kartu", kartu: { failed: true } }),
  },
];
