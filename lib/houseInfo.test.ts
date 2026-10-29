import { describe, expect, it } from "vitest";
import { HMD_ID, seedData } from "./data/seed";
import { createStore } from "./data/store";
import { cleanHouseInfo, hasHouseInfo, mapsUrl } from "./houseInfo";

describe("info rumah (29 Okt)", () => {
  it("trim, kosong → null, kepanjangan ditolak per field", () => {
    expect(cleanHouseInfo({ wifiName: " Potara ", wifiPassword: "", address: "  " })).toEqual({
      ok: true,
      value: { wifiName: "Potara", wifiPassword: null, address: null },
    });
    const r = cleanHouseInfo({ wifiName: "x", wifiPassword: "p".repeat(64), address: "" });
    expect(r).toMatchObject({ ok: false, field: "wifiPassword" });
  });

  it("store: simpan, isi sama nggak naikin rev, semua kosong = null", () => {
    const store = createStore(seedData());
    const info = { wifiName: "Potara", wifiPassword: "rumahbaru", address: "Jl. Mawar 1" };
    expect(store.setHouseInfo(HMD_ID, info)).toBe(true);
    const rev = store.rev;
    expect(store.setHouseInfo(HMD_ID, { ...info })).toBe(false);
    expect(store.rev).toBe(rev);
    expect(hasHouseInfo(store.getEvent(HMD_ID)?.houseInfo)).toBe(true);
    store.setHouseInfo(HMD_ID, { wifiName: null, wifiPassword: null, address: null });
    expect(store.getEvent(HMD_ID)?.houseInfo).toBeNull();
  });

  it("link Maps di-encode", () => {
    expect(mapsUrl("Jl. Mawar 1, Bandung")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Jl.%20Mawar%201%2C%20Bandung",
    );
  });
});
