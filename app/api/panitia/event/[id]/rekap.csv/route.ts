import { feedbackCsv } from "@/lib/csv";
import { getStore } from "@/lib/data";
import { timeWib, wibDate } from "@/lib/format";
import { isCrew } from "@/lib/server/access";
import { ensurePurged } from "@/lib/server/feedback";

// F5 · P11 "Unduh CSV": jawaban buku tamu per orang, sesi PIN saja. Setelah data per orang
// dihapus H+30 (P11d) → 410.
export async function GET(_req: Request, ctx: RouteContext<"/api/panitia/event/[id]/rekap.csv">) {
  if (!(await isCrew())) return new Response("unauthorized", { status: 401 });
  const { id } = await ctx.params;
  if (await ensurePurged(id)) return new Response("data udah dihapus", { status: 410 });
  const store = await getStore();
  if (!store.getEvent(id)) return new Response("not found", { status: 404 });

  const titles = new Map(store.listSessions(id).map((s) => [s.id, s.title]));
  const rows = store.listFeedback(id).map((f) => {
    const g = store.getGuest(f.guestId);
    return {
      name: g?.name ?? "",
      ig: g?.ig ?? "",
      rating: f.rating,
      highlight: f.highlightSessionId ? (titles.get(f.highlightSessionId) ?? null) : null,
      improve: f.improve,
      inviteAgain: f.inviteAgain,
      at: `${wibDate(new Date(f.createdAt))} ${timeWib(f.createdAt)}`,
    };
  });
  return new Response(feedbackCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="rekap-buku-tamu-hmd.csv"',
      "Cache-Control": "no-store",
    },
  });
}
