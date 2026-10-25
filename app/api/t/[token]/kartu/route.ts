import { cardOf, normalizeCard, type KartuPostResponse } from "@/lib/card";
import { isStoreError, mutateStore, type StoreError } from "@/lib/data";
import { guestFromToken } from "@/lib/server/access";
import { ensurePurged } from "@/lib/server/feedback";
import { rateLimiter } from "@/lib/server/rateLimit";
import { isSameOrigin } from "@/lib/server/url";

// N3 · T11 Simpan kartu dari HP tamu. JSON: role (≤ 40 | null), askAbout (≤ 3 × ≤ 20). Idempoten:
// isi sama → kartu yang sama, rev tetap ("Simpan lagi" setelah sinyal putus aman). Tersimpan →
// rev naik → HP tamu lain dapat kartu baru lewat LiveRefresh. Acara ditutup → 409 "acara-selesai".
function reply(body: KartuPostResponse, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const STATUS: Partial<Record<StoreError["code"], number>> = {
  "belum-rsvp": 403,
  "acara-ditutup": 409,
  "data-dihapus": 410,
};

// Rate-limit per tamu (per instance server): 20 simpan / menit.
const limited = rateLimiter(20);

export async function POST(req: Request, ctx: RouteContext<"/api/t/[token]/kartu">) {
  if (!isSameOrigin(req)) return new Response("forbidden", { status: 403 });
  const { token } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return reply({ ok: false, error: "Link nggak valid" }, 404);
  if (await ensurePurged(guest.eventId)) {
    return reply({ ok: false, error: "Data acara ini udah dihapus" }, 410);
  }
  if (limited(guest.id)) {
    return reply({ ok: false, error: "Kebanyakan simpan, tunggu sebentar" }, 429);
  }

  let card;
  try {
    card = normalizeCard(await req.json());
  } catch {
    card = null;
  }
  if (!card) return reply({ ok: false, error: "Isian kartunya belum pas" }, 400);

  try {
    const saved = await mutateStore((s) => {
      s.saveGuestCard(guest.id, card);
      return cardOf(s.getGuest(guest.id)!);
    });
    return reply({ ok: true, card: saved });
  } catch (err) {
    if (!isStoreError(err)) throw err;
    const error = err.code === "acara-ditutup" ? "acara-selesai" : err.message;
    return reply({ ok: false, error }, STATUS[err.code] ?? 409);
  }
}
