import { NextResponse } from "next/server";
import { endCrewSession } from "@/lib/server/access";

export async function POST() {
  await endCrewSession();
  return NextResponse.json({ ok: true });
}
