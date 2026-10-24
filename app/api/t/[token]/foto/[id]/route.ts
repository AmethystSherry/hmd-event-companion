import { getStore, mutateStore, StoreError } from "@/lib/data";
import { guestFromToken } from "@/lib/server/access";
import { serverNow } from "@/lib/server/clock";
import { deletePhotoFiles } from "@/lib/server/photos";
import { photoResponse } from "@/lib/server/photoResponse";
import { isSameOrigin } from "@/lib/server/url";

// N4 · gambar foto kolase untuk HP tamu (strip BT07, nanti kolase T15): token valid + foto dari
// event yang sama. ?v=thumb = thumbnail. DELETE = hapus foto sendiri (UI di F5 · T15b).
export async function GET(req: Request, ctx: RouteContext<"/api/t/[token]/foto/[id]">) {
  const { token, id } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return new Response("not found", { status: 404 });
  const photo = (await getStore()).getPhoto(id);
  if (!photo || photo.eventId !== guest.eventId) return new Response("not found", { status: 404 });
  return photoResponse(photo, new URL(req.url).searchParams.get("v") === "thumb");
}

export async function DELETE(req: Request, ctx: RouteContext<"/api/t/[token]/foto/[id]">) {
  if (!isSameOrigin(req)) return new Response("forbidden", { status: 403 });
  const { token, id } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return new Response("not found", { status: 404 });
  const at = (await serverNow()).toISOString();
  try {
    const deleted = await mutateStore((s) => s.deletePhoto(guest.id, id, at));
    if (!deleted) return new Response("not found", { status: 404 });
  } catch (err) {
    if (err instanceof StoreError) return new Response(err.message, { status: 409 });
    throw err;
  }
  await deletePhotoFiles(guest.eventId, id).catch(() => {});
  return new Response(null, { status: 204 });
}
