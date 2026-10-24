import { getStore } from "@/lib/data";
import { isCrew } from "@/lib/server/access";
import { photoResponse } from "@/lib/server/photoResponse";

// N4 · gambar foto kolase untuk HP panitia (galeri, nanti F5). Butuh sesi PIN. ?v=thumb = thumbnail.
export async function GET(req: Request, ctx: RouteContext<"/api/panitia/foto/[id]">) {
  if (!(await isCrew())) return new Response("unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const photo = (await getStore()).getPhoto(id);
  if (!photo) return new Response("not found", { status: 404 });
  return photoResponse(photo, new URL(req.url).searchParams.get("v") === "thumb");
}
