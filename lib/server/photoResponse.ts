import type { Photo } from "../data";
import { readPhotoFile } from "./photos";

// Kirim file foto dari penyimpanan. Id foto unik & isinya nggak pernah berubah → cache privat
// selamanya (HP tamu, SW). Foto yang dihapus nggak lagi lolos cek di route. N5: selfie kenalan
// lewat sini juga dengan id `kenalan/{id}`.
export async function photoResponse(
  photo: Pick<Photo, "eventId" | "id">,
  thumb: boolean,
): Promise<Response> {
  const bytes = await readPhotoFile(photo.eventId, photo.id, thumb ? "thumb" : "full");
  if (!bytes) return new Response("not found", { status: 404 });
  return new Response(bytes as BodyInit, {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
