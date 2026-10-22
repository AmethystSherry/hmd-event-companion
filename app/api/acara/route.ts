import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { canReadEvent } from "@/lib/server/eventAccess";

// Snapshot state acara (cadangan polling kalau SSE putus). Panitia (cookie) atau tamu (?t=token).
export async function GET(req: Request) {
  if (!(await canReadEvent(req)))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const snap = await (await getStore()).getSnapshot();
  return NextResponse.json(snap, { headers: { "Cache-Control": "no-store" } });
}
