import { buildIcs } from "@/lib/ics";
import { guestFromToken } from "@/lib/server/access";
import { appOrigin } from "@/lib/server/url";

// T03 "Simpan ke kalender": file .ics acara (13.00–17.00 WIB) + pengingat 2 jam sebelumnya.
export async function GET(_req: Request, ctx: RouteContext<"/t/[token]/kalender">) {
  const { token } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return new Response("Link tidak valid", { status: 404 });
  const ics = buildIcs({ uid: guest.id, ticketUrl: `${await appOrigin()}/t/${token}` });
  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="house-moving-day.ics"',
      "Cache-Control": "private, no-store",
    },
  });
}
