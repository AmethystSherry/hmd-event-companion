import { NextResponse } from "next/server";
import { normalizeIg } from "@/lib/csv";
import { getStore } from "@/lib/data";
import { isCrew } from "@/lib/server/access";
import { checkInByGuest } from "@/lib/server/checkin";

// P07c · Walk-in: tambah tamu cepat (nama + IG) lalu langsung check-in manual.
export async function POST(req: Request) {
  if (!(await isCrew())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  let body: { name?: unknown; ig?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 60) : "";
  const ig = typeof body.ig === "string" ? normalizeIg(body.ig) : "";
  const fields: { name?: string; ig?: string } = {};
  if (!name) fields.name = "Nama wajib diisi";
  if (!ig) fields.ig = "IG wajib diisi";
  else if (!/^[a-z0-9._]{1,30}$/.test(ig)) fields.ig = "Username IG-nya kurang pas";
  if (Object.keys(fields).length)
    return NextResponse.json({ error: "invalid", fields }, { status: 400 });

  const guest = await (await getStore()).addWalkIn({ name, ig });
  const by = (req.headers.get("x-device") ?? "panitia").slice(0, 40);
  return NextResponse.json(await checkInByGuest(guest.id, by));
}
