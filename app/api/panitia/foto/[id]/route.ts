import { getStore, mutateStore } from "@/lib/data";
import { isPhotoId } from "@/lib/photo";
import { isCrew } from "@/lib/server/access";
import { serverNow } from "@/lib/server/clock";
import { photoResponse } from "@/lib/server/photoResponse";
import { deletePhotoFiles } from "@/lib/server/photos";
import { isSameOrigin } from "@/lib/server/url";

// N4 · gambar foto kolase untuk HP panitia (P13 Foto masuk, unduh ZIP). Butuh sesi PIN.
// ?v=thumb = thumbnail.
export async function GET(req: Request, ctx: RouteContext<"/api/panitia/foto/[id]">) {
  if (!(await isCrew())) return new Response("unauthorized", { status: 401 });
  const { id } = await ctx.params;
  const photo = (await getStore()).getPhoto(id);
  if (!photo) return new Response("not found", { status: 404 });
  return photoResponse(photo, new URL(req.url).searchParams.get("v") === "thumb");
}

// F3 v3 · P13: panitia hapus foto siapa pun (K18). Body JSON `{by}` = label HP. Soft delete dulu
// (rev naik → galeri/kolase tamu ikut update), baru file dihapus. Udah dihapus = 204 juga (aman
// diulang dari dua HP).
export async function DELETE(req: Request, ctx: RouteContext<"/api/panitia/foto/[id]">) {
  if (!isSameOrigin(req)) return new Response("forbidden", { status: 403 });
  if (!(await isCrew())) return new Response("unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (!isPhotoId(id)) return new Response("not found", { status: 404 });
  const body = (await req.json().catch(() => ({}))) as { by?: unknown };
  const by = typeof body.by === "string" ? body.by.slice(0, 16) : null;
  const photo = (await getStore()).getPhoto(id);
  const at = (await serverNow()).toISOString();
  const removed = await mutateStore((s) => s.removePhoto(id, at, by));
  if (removed && photo) await deletePhotoFiles(photo.eventId, id).catch(() => {});
  return new Response(null, { status: 204 });
}
