import { NextResponse } from "next/server";
import { isCrew } from "@/lib/server/access";
import { checkInByGuest, checkInByQr } from "@/lib/server/checkin";

// P05/P06 scan dan P07 manual. Body: { qr } atau { guestId }; header x-device = id HP panitia
// (untuk "dicek oleh"; konflik 2 HP → yang pertama menang, yang kedua dapat "used").
export async function POST(req: Request) {
  if (!(await isCrew())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { qr?: unknown; guestId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const by = (req.headers.get("x-device") ?? "panitia").slice(0, 40);
  if (typeof body.qr === "string") return NextResponse.json(await checkInByQr(body.qr, by));
  if (typeof body.guestId === "string" && /^g\d{3,}$/.test(body.guestId)) {
    return NextResponse.json(await checkInByGuest(body.guestId, by));
  }
  return NextResponse.json({ error: "bad_request" }, { status: 400 });
}
