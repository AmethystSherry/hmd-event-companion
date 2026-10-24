// Label HP panitia ("HP 7K2Q"): acak sekali per browser, disimpan di localStorage. Satu PIN =
// tanpa identitas orang, jadi ini yang dipakai di `checkedInBy` (F2) & `Event.stateBy` (BP02d).
// Klien saja.
export function deviceLabel(): string {
  try {
    let v = localStorage.getItem("hmd-device");
    if (!v) {
      v = `HP ${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      localStorage.setItem("hmd-device", v);
    }
    return v;
  } catch {
    return "HP panitia";
  }
}
