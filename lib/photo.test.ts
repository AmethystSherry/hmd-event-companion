import { describe, expect, it } from "vitest";
import {
  centerCrop,
  fitSize,
  isInAppBrowser,
  isJpeg,
  isPhotoId,
  photoTilt,
  polaroidDate,
} from "./photo";

describe("crop & ukuran foto (BT06)", () => {
  it("frame landscape 4:3 dipotong tengah jadi 5:6", () => {
    const r = centerCrop(1920, 1440);
    expect(r).toEqual({ x: 360, y: 0, w: 1200, h: 1440 });
    expect(r.w / r.h).toBeCloseTo(5 / 6);
  });

  it("frame portrait 9:16 dipotong atas-bawah", () => {
    const r = centerCrop(1080, 1920);
    expect(r.w).toBe(1080);
    expect(r.h).toBe(1296);
    expect(r.y).toBe(312);
  });

  it("sisi panjang ≤ 1280 dan nggak diperbesar", () => {
    expect(fitSize(1200, 1440, 1280)).toEqual({ w: 1067, h: 1280 });
    expect(fitSize(500, 600, 1280)).toEqual({ w: 500, h: 600 });
  });
});

describe("validasi & tampilan", () => {
  it("JPEG dikenali dari magic bytes", () => {
    expect(isJpeg(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe(true);
    expect(isJpeg(new Uint8Array([0x89, 0x50, 0x4e, 0x47]))).toBe(false);
  });

  it("id foto harus UUID", () => {
    expect(isPhotoId("3f2504e0-4f89-41d3-9a0c-0305e82c3301")).toBe(true);
    expect(isPhotoId("../../etc/passwd")).toBe(false);
  });

  it("kemiringan ±4°, konsisten per foto, nggak pernah 0", () => {
    const ids = Array.from({ length: 200 }, (_, i) => `id-${i}`);
    for (const id of ids) {
      const t = photoTilt(id);
      expect(Math.abs(t)).toBeLessThanOrEqual(4);
      expect(t).not.toBe(0);
      expect(photoTilt(id)).toBe(t);
    }
  });

  it("tanggal polaroid 8.11.26", () => {
    expect(polaroidDate("2026-11-08")).toBe("8.11.26");
  });

  it("deteksi in-app browser Instagram", () => {
    expect(
      isInAppBrowser(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Instagram 300.0",
      ),
    ).toBe(true);
    expect(isInAppBrowser("Mozilla/5.0 (Linux; Android 14) Chrome/120 Mobile Safari/537.36")).toBe(
      false,
    );
  });
});
