import { inflateRawSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { crc32, zipStored } from "./zip";

const enc = new TextEncoder();

// Baca ZIP lewat central directory (cara unzip beneran) → nama + isi per file.
function readZip(zip: Uint8Array) {
  const v = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
  const eocd = zip.length - 22;
  expect(v.getUint32(eocd, true)).toBe(0x06054b50);
  const count = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const files: { name: string; data: Uint8Array; crc: number }[] = [];
  for (let i = 0; i < count; i++) {
    expect(v.getUint32(p, true)).toBe(0x02014b50);
    const method = v.getUint16(p + 10, true);
    const crc = v.getUint32(p + 16, true);
    const size = v.getUint32(p + 20, true);
    const nameLen = v.getUint16(p + 28, true);
    const local = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(zip.subarray(p + 46, p + 46 + nameLen));
    const localName = v.getUint16(local + 26, true);
    const start = local + 30 + localName;
    const raw = zip.subarray(start, start + size);
    files.push({ name, data: method === 0 ? raw : inflateRawSync(raw), crc });
    p += 46 + nameLen;
  }
  return files;
}

describe("zip stored (unduh P13)", () => {
  it("CRC32 standar", () => {
    expect(crc32(enc.encode("123456789"))).toBe(0xcbf43926);
    expect(crc32(new Uint8Array())).toBe(0);
  });

  it("isi & nama (UTF-8) terbaca utuh", () => {
    const a = enc.encode("foto pertama");
    const b = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);
    const zip = zipStored([
      { name: "01-rara-talkshow.jpg", data: a, date: new Date(2026, 10, 8, 14, 5, 30) },
      { name: "02-sekar-çafé.jpg", data: b },
    ]);
    const files = readZip(zip);
    expect(files.map((f) => f.name)).toEqual(["01-rara-talkshow.jpg", "02-sekar-çafé.jpg"]);
    expect(Array.from(files[0].data)).toEqual(Array.from(a));
    expect(Array.from(files[1].data)).toEqual(Array.from(b));
    expect(files[1].crc).toBe(crc32(b));
  });

  it("kosong = cuma EOCD", () => {
    expect(zipStored([]).length).toBe(22);
  });
});
