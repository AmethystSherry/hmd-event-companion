import { getStore, isStoreError, mutateStore } from "@/lib/data";
import {
  isJpeg,
  isPhotoId,
  SERVER_MAX_PHOTO_BYTES,
  SERVER_MAX_THUMB_BYTES,
  type PhotoUploadResponse,
} from "@/lib/photo";
import { guestFromToken } from "@/lib/server/access";
import { serverNow } from "@/lib/server/clock";
import { deletePhotoFiles, putPhotoFile } from "@/lib/server/photos";
import { isSameOrigin } from "@/lib/server/url";

// N4 · upload foto kolase dari HP tamu (BT06 → BT07). Multipart: id (UUID dari HP), photo + thumb
// (JPEG sudah dikompres di HP), width, height. Idempoten per id: antrean offline yang mengirim
// ulang dapat hasil yang sama. Urutan: file dulu, baru metadata di store.
function reply(body: PhotoUploadResponse, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, ctx: RouteContext<"/api/t/[token]/foto">) {
  if (!isSameOrigin(req)) return new Response("forbidden", { status: 403 });
  const { token } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return reply({ ok: false, error: "Link nggak valid" }, 404);
  const store = await getStore();
  if (store.ticketFor(guest.id)?.status !== "dipakai") {
    return reply({ ok: false, code: "belum-masuk", error: "Check-in dulu di pintu" }, 403);
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return reply({ ok: false, error: "Upload rusak" }, 400);
  }
  const id = String(form.get("id") ?? "");
  const photo = form.get("photo");
  const thumb = form.get("thumb");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));
  if (
    !isPhotoId(id) ||
    !(photo instanceof Blob) ||
    !(thumb instanceof Blob) ||
    !(width > 0 && width <= 4096 && height > 0 && height <= 4096) ||
    photo.size > SERVER_MAX_PHOTO_BYTES ||
    thumb.size > SERVER_MAX_THUMB_BYTES
  ) {
    return reply({ ok: false, error: "Fotonya nggak bisa dibaca" }, 400);
  }

  // Foto yang udah dihapus (pemilik / panitia P13) dikirim ulang dari antrean → tolak sebelum file
  // ditulis lagi ke storage.
  if (store.isPhotoDeleted(id)) {
    return reply({ ok: false, code: "foto-dihapus", error: "Fotonya udah dihapus" }, 410);
  }
  const known = store.getPhoto(id);
  if (known && known.guestId !== guest.id) return reply({ ok: false, error: "Foto bentrok" }, 409);
  if (!known) {
    const full = new Uint8Array(await photo.arrayBuffer());
    const small = new Uint8Array(await thumb.arrayBuffer());
    if (!isJpeg(full) || !isJpeg(small)) {
      return reply({ ok: false, error: "Fotonya nggak bisa dibaca" }, 400);
    }
    await putPhotoFile(guest.eventId, id, "full", full);
    await putPhotoFile(guest.eventId, id, "thumb", small);
  }

  const at = (await serverNow()).toISOString();
  try {
    const summary = await mutateStore((s) => {
      s.addPhoto({ id, guestId: guest.id, at, width, height, bytes: photo.size });
      return s.photoSummary(guest.eventId, guest.id);
    });
    return reply({ ok: true, id, ...summary });
  } catch (err) {
    if (!isStoreError(err)) throw err;
    if (!known) await deletePhotoFiles(guest.eventId, id).catch(() => {});
    if (err.code === "foto-dihapus")
      return reply({ ok: false, code: err.code, error: err.message }, 410);
    const code = err.code === "foto-penuh" || err.code === "acara-ditutup" ? err.code : undefined;
    return reply({ ok: false, code, error: err.message }, 409);
  }
}
