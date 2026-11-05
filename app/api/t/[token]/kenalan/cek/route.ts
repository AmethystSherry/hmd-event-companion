import { getStore } from "@/lib/data";
import { firstName } from "@/lib/format";
import type { KenalanCekResponse } from "@/lib/kenalan";
import { guestFromToken } from "@/lib/server/access";
import { ensurePurged } from "@/lib/server/feedback";
import { kenalanFail, kenalanStoreFail, parseKenalanCode } from "@/lib/server/kenalan";
import { rateLimiter } from "@/lib/server/rateLimit";
import { isSameOrigin } from "@/lib/server/url";

// N5 · BTk1 hasil scan → cek kode QR kenalan sebelum kamera selfie dibuka (K3). Nggak menulis apa
// pun: error (QR tiket, QR sendiri, udah kenalan, belum check-in, papan dikunci …) langsung tampil
// di layar scan. JSON {code} → {ok, friend {id, name, firstName}} | {ok:false, error, message}.
function reply(body: KenalanCekResponse, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

// Scanner bisa membaca QR yang sama berkali-kali per detik; HP membatasi, ini jaring pengaman.
const limited = rateLimiter(60);

export async function POST(req: Request, ctx: RouteContext<"/api/t/[token]/kenalan/cek">) {
  if (!isSameOrigin(req)) return new Response("forbidden", { status: 403 });
  const { token } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return fail("link");
  if (await ensurePurged(guest.eventId)) return fail("data-dihapus");
  if (limited(guest.id)) return fail("kebanyakan");

  let code = "";
  try {
    const body = (await req.json()) as { code?: unknown };
    code = typeof body.code === "string" ? body.code.slice(0, 200) : "";
  } catch {
    // body rusak → QR asing
  }
  const parsed = parseKenalanCode(code);
  if (!parsed.ok) return fail(parsed.reason);

  try {
    const owner = (await getStore()).checkIntroduction(guest.id, parsed.guestId);
    return reply({
      ok: true,
      friend: { id: owner.id, name: owner.name, firstName: firstName(owner.name) },
    });
  } catch (err) {
    const f = kenalanStoreFail(err);
    if (!f) throw err;
    return reply(f.body, f.status);
  }
}

function fail(error: Parameters<typeof kenalanFail>[0]) {
  const f = kenalanFail(error);
  return reply(f.body, f.status);
}
