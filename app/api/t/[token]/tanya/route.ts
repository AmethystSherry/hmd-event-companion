import { isStoreError, mutateStore, type StoreError } from "@/lib/data";
import { parseQuestionBody, TANYA_FAIL_COOKIE, type QuestionPostResponse } from "@/lib/questions";
import { guestFromToken } from "@/lib/server/access";
import { serverNow } from "@/lib/server/clock";
import { ensurePurged } from "@/lib/server/feedback";
import { rateLimiter } from "@/lib/server/rateLimit";
import { isSameOrigin } from "@/lib/server/url";

// N1 · kirim pertanyaan talkshow dari HP tamu (BT08 → BT09). JSON: clientId (UUID dari HP), text.
// Idempoten per clientId: "Kirim lagi" setelah sinyal putus (BT08b) dapat pertanyaan yang sama.
// Sesi yang jalan bukan talkshow (keburu selesai) → 409 "bukan-talkshow".
function reply(body: QuestionPostResponse, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const STATUS: Partial<Record<StoreError["code"], number>> = {
  "belum-masuk": 403,
  "bukan-talkshow": 409,
  "isian-tidak-valid": 400,
  "data-dihapus": 410,
};

// Dev: /dev/states/n1 "Simulasi gagal kirim" — tersimpan, tapi respons 503 (seperti sinyal putus
// setelah request sampai). Production selalu false.
function failSimulated(req: Request): boolean {
  if (process.env.NODE_ENV === "production") return false;
  return (req.headers.get("cookie") ?? "").includes(`${TANYA_FAIL_COOKIE}=1`);
}

// Rate-limit per tamu (per instance server): 10 pertanyaan / menit.
const limited = rateLimiter(10);

export async function POST(req: Request, ctx: RouteContext<"/api/t/[token]/tanya">) {
  if (!isSameOrigin(req)) return new Response("forbidden", { status: 403 });
  const { token } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return reply({ ok: false, error: "Link nggak valid" }, 404);
  if (await ensurePurged(guest.eventId)) {
    return reply({ ok: false, error: "Data acara ini udah dihapus" }, 410);
  }
  if (limited(guest.id)) {
    return reply({ ok: false, error: "Kebanyakan nanya, tunggu sebentar" }, 429);
  }

  let input;
  try {
    input = parseQuestionBody(await req.json());
  } catch {
    input = null;
  }
  if (!input) return reply({ ok: false, error: "Pertanyaannya belum pas" }, 400);

  const at = (await serverNow()).toISOString();
  try {
    const { question } = await mutateStore((s) => s.addQuestion(guest.id, input, at));
    if (failSimulated(req)) return reply({ ok: false, error: "Simulasi gagal kirim (dev)" }, 503);
    return reply({
      ok: true,
      question: { id: question.id, text: question.text, createdAt: question.createdAt },
    });
  } catch (err) {
    if (!isStoreError(err)) throw err;
    const error = err.code === "bukan-talkshow" ? "bukan-talkshow" : err.message;
    return reply({ ok: false, error }, STATUS[err.code] ?? 409);
  }
}
