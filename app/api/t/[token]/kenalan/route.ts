import { getStore, mutateStore } from "@/lib/data";
import { kenalanFileId, type KenalanPostResponse } from "@/lib/kenalan";
import { isJpeg, isPhotoId, SERVER_MAX_PHOTO_BYTES, SERVER_MAX_THUMB_BYTES } from "@/lib/photo";
import { guestFromToken } from "@/lib/server/access";
import { serverNow } from "@/lib/server/clock";
import { ensurePurged } from "@/lib/server/feedback";
import { kenalanFail, kenalanStoreFail, parseKenalanCode } from "@/lib/server/kenalan";
import { deletePhotoFiles, putPhotoFile } from "@/lib/server/photos";
import { rateLimiter } from "@/lib/server/rateLimit";
import { isSameOrigin } from "@/lib/server/url";

// N5 · BTk3 Jepret → kenalan + selfie berdua dalam satu request (K3: dihitung saat selfie
// terkirim, tanpa antrean offline). Multipart: id (UUID dari HP pemindai), code (isi QR teman),
// photo + thumb (JPEG dikompres di HP, pipeline N4). Urutan pola N4: file dulu
// (`{eventId}/kenalan/{id}`), baru mutateStore(addIntroduction). Idempoten per id (Coba lagi aman).
// Selfie ini bukan `Photo`: nggak ikut Galeri, PhotoStack, kolase, P13, ZIP, photoCount.
function reply(body: KenalanPostResponse, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

const limited = rateLimiter(20); // K18: 20 kenalan / menit per tamu (per instance)

export async function POST(req: Request, ctx: RouteContext<"/api/t/[token]/kenalan">) {
  if (!isSameOrigin(req)) return new Response("forbidden", { status: 403 });
  const { token } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return fail("link");
  if (await ensurePurged(guest.eventId)) return fail("data-dihapus");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return fail("foto-rusak");
  }
  const id = String(form.get("id") ?? "");
  const photo = form.get("photo");
  const thumb = form.get("thumb");
  const parsed = parseKenalanCode(String(form.get("code") ?? "").slice(0, 200));
  if (!parsed.ok) return fail(parsed.reason);
  if (
    !isPhotoId(id) ||
    !(photo instanceof Blob) ||
    !(thumb instanceof Blob) ||
    photo.size > SERVER_MAX_PHOTO_BYTES ||
    thumb.size > SERVER_MAX_THUMB_BYTES
  ) {
    return fail("foto-rusak");
  }

  // Kirim ulang id yang udah tercatat (sinyal putus setelah server nyimpan) → sukses lagi tanpa
  // nulis file & tanpa kena rate limit.
  const store = await getStore();
  const known = store.getIntroduction(id);
  if (!known) {
    if (limited(guest.id)) return fail("kebanyakan");
    try {
      store.checkIntroduction(guest.id, parsed.guestId); // gagal → file nggak ditulis
    } catch (err) {
      const f = kenalanStoreFail(err);
      if (!f) throw err;
      return reply(f.body, f.status);
    }
    const full = new Uint8Array(await photo.arrayBuffer());
    const small = new Uint8Array(await thumb.arrayBuffer());
    if (!isJpeg(full) || !isJpeg(small)) return fail("foto-rusak");
    await putPhotoFile(guest.eventId, kenalanFileId(id), "full", full);
    await putPhotoFile(guest.eventId, kenalanFileId(id), "thumb", small);
  }

  const at = (await serverNow()).toISOString();
  try {
    await mutateStore((s) => s.addIntroduction(guest.id, parsed.guestId, { id }, at));
    return reply({ ok: true, id });
  } catch (err) {
    // Kalah balapan (mis. dua HP saling scan barengan → "udah-kenalan") → file yatim dihapus.
    if (!known) await deletePhotoFiles(guest.eventId, kenalanFileId(id)).catch(() => {});
    const f = kenalanStoreFail(err);
    if (!f) throw err;
    return reply(f.body, f.status);
  }
}

function fail(error: Parameters<typeof kenalanFail>[0]) {
  const f = kenalanFail(error);
  return reply(f.body, f.status);
}
