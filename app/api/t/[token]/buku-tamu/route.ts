import { mutateStore, StoreError } from "@/lib/data";
import { parseFeedbackBody, type FeedbackPostResponse } from "@/lib/feedback";
import { guestFromToken } from "@/lib/server/access";
import { serverNow } from "@/lib/server/clock";
import { ensurePurged } from "@/lib/server/feedback";
import { isSameOrigin } from "@/lib/server/url";

// F5 · kirim buku tamu dari HP tamu (T14 → T15). JSON: clientId (UUID dari HP), rating,
// highlightSessionId, improve, inviteAgain. Idempoten per clientId: kirim ulang setelah sinyal
// putus (T14b) dapat hasil yang sama. Udah pernah isi → "sudah-isi" (T14d).
function reply(body: FeedbackPostResponse, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const STATUS: Partial<Record<StoreError["code"], number>> = {
  "belum-masuk": 403,
  "acara-belum-ditutup": 409,
  "isian-tidak-valid": 400,
  "data-dihapus": 410,
};

// Rate-limit sederhana per tamu (per instance server): 10 kiriman / menit.
const WINDOW_MS = 60_000;
const MAX_HITS = 10;
const hits = new Map<string, number[]>();

function limited(guestId: string): boolean {
  const now = Date.now();
  const list = (hits.get(guestId) ?? []).filter((t) => now - t < WINDOW_MS);
  list.push(now);
  hits.set(guestId, list);
  return list.length > MAX_HITS;
}

export async function POST(req: Request, ctx: RouteContext<"/api/t/[token]/buku-tamu">) {
  if (!isSameOrigin(req)) return new Response("forbidden", { status: 403 });
  const { token } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return reply({ ok: false, error: "Link nggak valid" }, 404);
  if (await ensurePurged(guest.eventId)) {
    return reply({ ok: false, error: "Data acara ini udah dihapus" }, 410);
  }
  if (limited(guest.id))
    return reply({ ok: false, error: "Kebanyakan coba, tunggu sebentar" }, 429);

  let input;
  try {
    input = parseFeedbackBody(await req.json());
  } catch {
    input = null;
  }
  if (!input) return reply({ ok: false, error: "Isiannya belum pas" }, 400);

  const at = (await serverNow()).toISOString();
  try {
    await mutateStore((s) => s.addFeedback(guest.id, input, at));
    return reply({ ok: true, status: "ok" });
  } catch (err) {
    if (!(err instanceof StoreError)) throw err;
    if (err.code === "sudah-isi") return reply({ ok: true, status: "sudah-isi" });
    return reply({ ok: false, error: err.message }, STATUS[err.code] ?? 409);
  }
}
