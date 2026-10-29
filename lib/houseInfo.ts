import type { HouseInfo } from "./data/types";

// (29 Okt) Info rumah buat tamu: Wi-Fi & alamat kantor. Diisi panitia di PE03 (bisa diubah kapan
// aja, juga setelah event dimulai), tampil di sheet "Info rumah" layar acara tamu (udah check-in).

export const HOUSE_LIMITS = { wifiName: 40, wifiPassword: 63, address: 160 } as const;

export type HouseInfoInput = { wifiName: string; wifiPassword: string; address: string };

// Trim, kosong → null. Kepanjangan → error per field (nggak dipotong diam-diam).
export function cleanHouseInfo(
  input: HouseInfoInput,
): { ok: true; value: HouseInfo } | { ok: false; field: keyof HouseInfoInput; error: string } {
  const value: HouseInfo = { wifiName: null, wifiPassword: null, address: null };
  for (const key of ["wifiName", "wifiPassword", "address"] as const) {
    const v = (input[key] ?? "").trim();
    if (v.length > HOUSE_LIMITS[key]) {
      return { ok: false, field: key, error: `Maksimal ${HOUSE_LIMITS[key]} huruf` };
    }
    value[key] = v || null;
  }
  return { ok: true, value };
}

export const hasHouseInfo = (h: HouseInfo | null | undefined): h is HouseInfo =>
  !!h && !!(h.wifiName || h.wifiPassword || h.address);

// "Buka di Maps": Google Maps search (jalan di iPhone & Android, nggak perlu koordinat).
export const mapsUrl = (address: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
