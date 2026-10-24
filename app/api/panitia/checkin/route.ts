import { mutateStore } from "@/lib/data";
import type { CheckInRequest, CheckInResponse } from "@/lib/door";
import { isCrew } from "@/lib/server/access";
import { serverNow } from "@/lib/server/clock";
import { applyDoorOp } from "@/lib/server/door";
import { isSameOrigin } from "@/lib/server/url";

// F2 · terima antrean check-in dari HP panitia (scan, ✓ manual, walk-in, Batalkan) secara
// berurutan. Idempoten per opId: kirim ulang setelah sinyal putus tidak menambah hitungan.
const MAX_OPS = 50;

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return new Response("forbidden", { status: 403 });
  if (!(await isCrew())) return new Response("unauthorized", { status: 401 });

  let body: CheckInRequest;
  try {
    body = (await req.json()) as CheckInRequest;
  } catch {
    return new Response("bad request", { status: 400 });
  }
  if (typeof body?.eventId !== "string" || !Array.isArray(body.ops) || body.ops.length > MAX_OPS) {
    return new Response("bad request", { status: 400 });
  }

  const by = String(body.by ?? "HP panitia").slice(0, 24);
  const now = await serverNow();
  const ops = body.ops.filter((op) => op && typeof op.opId === "string" && op.opId.length <= 64);
  const out = await mutateStore((store): CheckInResponse | null => {
    if (!store.getEvent(body.eventId)) return null;
    const results = ops.map((op) => ({
      opId: op.opId,
      result: applyDoorOp(store, body.eventId, by, op, now),
    }));
    return { rev: store.rev, results };
  });
  if (!out) return new Response("not found", { status: 404 });

  return Response.json(out, {
    headers: { "Cache-Control": "no-store" },
  });
}
