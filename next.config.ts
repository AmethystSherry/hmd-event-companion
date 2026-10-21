import { execSync } from "node:child_process";
import type { NextConfig } from "next";
import pkg from "./package.json";

// Versi build untuk /dev/status: versi package + commit pendek (Vercel atau git lokal).
function buildSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "dev";
  }
}

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Dev: izinkan HP di Wi-Fi yang sama (IP jaringan lokal) memuat aset dev & hot reload.
  allowedDevOrigins: ["192.168.*.*", "10.*.*.*", "172.*.*.*"],
  env: {
    NEXT_PUBLIC_APP_VERSION: pkg.version,
    NEXT_PUBLIC_BUILD_SHA: buildSha(),
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },
  // Acara privat: tidak ada halaman yang boleh diindeks (link tamu berisi token).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
