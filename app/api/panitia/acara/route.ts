import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import type { SessionEdit } from "@/lib/data/types";
import { isCrew } from "@/lib/server/access";

// Kontrol acara panitia (BP01–BP04). Body:
//  { action: "start" | "undo", sessionId } · { action: "finish", sessionId, startNext }
//  { action: "close" } · { action: "rundown", edits: SessionEdit[] }
// Header x-device = id HP panitia (untuk toast "Diubah oleh panitia lain" di HP lain).
export async function POST(req: Request) {
  if (!(await isCrew())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { action?: unknown; sessionId?: unknown; startNext?: unknown; edits?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const by = (req.headers.get("x-device") ?? "panitia").slice(0, 40);
  const store = await getStore();
  const id = typeof body.sessionId === "string" ? body.sessionId : "";

  switch (body.action) {
    case "start":
      return NextResponse.json(await store.startSession(id, by));
    case "undo":
      return NextResponse.json(await store.undoStart(id, by));
    case "finish":
      return NextResponse.json(
        await store.finishSession(id, by, { startNext: body.startNext === true }),
      );
    case "close":
      return NextResponse.json(await store.closeEvent(by));
    case "rundown":
      if (!Array.isArray(body.edits)) break;
      return NextResponse.json(await store.updateRundown(body.edits as SessionEdit[], by));
  }
  return NextResponse.json({ error: "bad_request" }, { status: 400 });
}
