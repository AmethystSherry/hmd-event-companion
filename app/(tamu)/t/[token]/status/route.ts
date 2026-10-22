import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { timeWib } from "@/lib/format";
import { guestFromToken } from "@/lib/server/access";

// Dipoll HP tamu di T05 (tiap ±2 dtk) supaya tiket "sobek" begitu panitia men-scan.
// Pengganti realtime sampai DB/realtime asli dipasang.
export async function GET(_req: Request, ctx: RouteContext<"/t/[token]/status">) {
  const { token } = await ctx.params;
  const guest = await guestFromToken(token);
  if (!guest) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const store = await getStore();
  const [ticket, count] = await Promise.all([
    store.getTicketForGuest(guest.id),
    store.checkInCount(),
  ]);
  const used = ticket?.status === "dipakai";
  return NextResponse.json(
    {
      checkedIn: used,
      time: used && ticket?.checkedInAt ? timeWib(ticket.checkedInAt) : null,
      guestNo: used ? ticket?.guestNo : null,
      total: count.total,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
