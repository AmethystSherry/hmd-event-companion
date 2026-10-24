import { getStore } from "@/lib/data";
import { isCrew } from "@/lib/server/access";
import { ensurePurged, refreshSummary } from "@/lib/server/feedback";
import { isSameOrigin } from "@/lib/server/url";

// F5 · P11 "Ringkasan Claude": HP panitia memanggil ini kalau ringkasannya basi (P11 tetap tampil
// dari cache, nggak menunggu Claude). { force: true } = "Coba lagi" (P11b). Balasan = rekap +
// status ringkasan terbaru; HP lain ikut update lewat rev → SSE.
export async function POST(req: Request, ctx: RouteContext<"/api/panitia/event/[id]/ringkasan">) {
  if (!isSameOrigin(req)) return new Response("forbidden", { status: 403 });
  if (!(await isCrew())) return new Response("unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!(await getStore()).getEvent(id)) return new Response("not found", { status: 404 });
  const body = (await req.json().catch(() => null)) as { force?: unknown } | null;
  if (!(await ensurePurged(id))) await refreshSummary(id, body?.force === true);
  const store = await getStore();
  return Response.json(
    { recap: store.feedbackRecap(id), summary: store.getEvent(id)?.summary ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
