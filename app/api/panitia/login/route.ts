import { NextResponse } from "next/server";
import { clientKey, pinGate, startCrewSession } from "@/lib/server/access";
import { secrets } from "@/lib/server/config";

// P01: verifikasi PIN di server. Respons dipakai layar P01 / P01b (sisa percobaan) / P01c (terkunci).
export async function POST(req: Request) {
  let pin = "";
  try {
    const body = (await req.json()) as { pin?: unknown };
    pin = typeof body.pin === "string" ? body.pin : "";
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (!/^\d{6}$/.test(pin)) {
    return NextResponse.json({ error: "format", message: "PIN 6 digit angka" }, { status: 400 });
  }

  const result = pinGate().attempt(await clientKey(), pin, secrets().eventPin);
  switch (result.kind) {
    case "ok":
      await startCrewSession();
      return NextResponse.json({ ok: true });
    case "wrong":
      return NextResponse.json({ error: "wrong", remaining: result.remaining }, { status: 401 });
    case "locked":
      return NextResponse.json(
        { error: "locked", retryAfterSec: Math.ceil(result.retryAfterMs / 1000) },
        { status: 429, headers: { "Retry-After": String(Math.ceil(result.retryAfterMs / 1000)) } },
      );
    case "disabled":
      return NextResponse.json({ error: "disabled" }, { status: 503 });
  }
}
