import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

// Gambar pratinjau link (WA/Discord/IG): logo Potara di tengah latar --bg. Logo di tengah
// supaya tetap utuh kalau aplikasi chat memotongnya jadi kotak. Dibuat sekali saat build.
export const alt = "Logo Potara Studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const svg = await readFile(join(process.cwd(), "public/figma/logo-mark.svg"));
  const logo = `data:image/svg+xml;base64,${svg.toString("base64")}`;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F3F2F0",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse cuma kenal <img> */}
      <img src={logo} width={320} height={320} alt="" />
    </div>,
    size,
  );
}
