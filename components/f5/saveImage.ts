import { isInAppBrowser } from "@/lib/photo";

// Simpan / bagikan gambar dari HP (T15b "Simpan foto", T15c "Simpan" & "Bagikan", T15e).
// - iPhone/iPad: <a download> masuk ke Files, bukan Foto → pakai share sheet ("Simpan Gambar").
// - Android Chrome & desktop: download biasa (masuk Galeri/Download).
// - Webview IG/FB: share & download sering nggak jalan → "fallback": pemanggil menampilkan gambar
//   di layar + toast "Tekan lama gambarnya buat simpan".
// share() wajib dipanggil langsung dari tap: siapkan File-nya dulu sebelum tombol ditekan.

export type SaveOutcome = "shared" | "downloaded" | "fallback" | "cancelled";

export function isIOS(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function canShareFile(file: File): boolean {
  try {
    return typeof navigator.share === "function" && !!navigator.canShare?.({ files: [file] });
  } catch {
    return false;
  }
}

// Share sheet HP. "fallback" = browser nggak bisa berbagi file / gagal; batal = diam saja.
export async function shareFile(file: File, title: string): Promise<SaveOutcome> {
  if (isInAppBrowser(navigator.userAgent) || !canShareFile(file)) return "fallback";
  try {
    await navigator.share({ files: [file], title });
    return "shared";
  } catch (err) {
    return (err as Error).name === "AbortError" ? "cancelled" : "fallback";
  }
}

export async function saveFile(file: File, title: string): Promise<SaveOutcome> {
  if (isInAppBrowser(navigator.userAgent)) return "fallback";
  if (isIOS()) return shareFile(file, title);
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
  return "downloaded";
}
