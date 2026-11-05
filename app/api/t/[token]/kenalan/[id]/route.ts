import { getStore } from "@/lib/data";
import { kenalanFileId } from "@/lib/kenalan";
import { guestFromToken } from "@/lib/server/access";
import { photoResponse } from "@/lib/server/photoResponse";

// N5 · gambar selfie kenalan (BTk4) buat HP tamu: cuma 2 tamu di pasangan itu (K16), selain itu
// 404. ?v=thumb = thumbnail. Cache privat selamanya (isi file nggak pernah berubah).
export async function GET(req: Request, ctx: RouteContext<"/api/t/[token]/kenalan/[id]">) {
  const { token, id } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return new Response("not found", { status: 404 });
  const intro = (await getStore()).getIntroduction(id);
  if (!intro || (intro.a !== guest.id && intro.b !== guest.id)) {
    return new Response("not found", { status: 404 });
  }
  const thumb = new URL(req.url).searchParams.get("v") === "thumb";
  return photoResponse({ eventId: intro.eventId, id: kenalanFileId(intro.id) }, thumb);
}
