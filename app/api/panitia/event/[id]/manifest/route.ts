import { getStore } from "@/lib/data";
import { isCrew } from "@/lib/server/access";
import { toDoorManifest } from "@/lib/server/door";

// F2 · manifest pintu untuk HP panitia (P05/P07): tamu + ticketId + status. Disimpan di
// IndexedDB supaya scan & Cari nama tetap jalan offline. Tanpa secret HMAC/token; WA cuma versi disamarkan (P07d).
export async function GET(_req: Request, ctx: RouteContext<"/api/panitia/event/[id]/manifest">) {
  if (!(await isCrew())) return new Response("unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const store = await getStore();
  if (!store.getEvent(id)) return new Response("not found", { status: 404 });
  return Response.json(toDoorManifest(store, id), {
    headers: { "Cache-Control": "no-store" },
  });
}
