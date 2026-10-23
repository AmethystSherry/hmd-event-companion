import { getStore } from "@/lib/data";
import { guestFromToken, isCrew } from "@/lib/server/access";

// SSE realtime: kirim `rev` store saat terhubung & tiap ada perubahan (jawaban tamu, undangan,
// rundown). Klien lalu me-refresh halaman (LiveRefresh). Tidak ada data tamu di stream ini.
// Akses: sesi panitia, atau token tamu yang valid (?t=).
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("t");
  const allowed = token ? !!(await guestFromToken(token)) : await isCrew();
  if (!allowed) return new Response("unauthorized", { status: 401 });

  const store = await getStore();
  // ?once=1 → `rev` saja, untuk polling cadangan kalau SSE tertahan proxy (mis. Cloudflare quick
  // tunnel tidak meneruskan SSE).
  if (new URL(req.url).searchParams.has("once")) {
    return new Response(String(store.rev), { headers: { "Cache-Control": "no-store" } });
  }
  const enc = new TextEncoder();
  let stop = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const send = (rev: number) => {
        try {
          controller.enqueue(enc.encode(`data: ${rev}\n\n`));
        } catch {
          stop();
        }
      };
      send(store.rev);
      const unsubscribe = store.subscribe(send);
      const beat = setInterval(() => {
        try {
          controller.enqueue(enc.encode(`: ping\n\n`));
        } catch {
          stop();
        }
      }, 15_000);
      stop = () => {
        unsubscribe();
        clearInterval(beat);
      };
      req.signal.addEventListener("abort", () => {
        stop();
        try {
          controller.close();
        } catch {}
      });
    },
    cancel() {
      stop();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
