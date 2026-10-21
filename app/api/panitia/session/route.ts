import { NextResponse } from "next/server";
import { isCrew } from "@/lib/server/access";

// Cek cepat apakah perangkat ini sudah masuk sebagai panitia.
export async function GET() {
  return NextResponse.json({ crew: await isCrew() });
}
