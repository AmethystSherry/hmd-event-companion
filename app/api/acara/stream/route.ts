import { getStore } from "@/lib/data";
import { canReadEvent } from "@/lib/server/eventAccess";

// SSE: kirim snapshot state acara saat terhubung & tiap kali panitia mengubahnya (target ≤1 dtk).
// Heartbeat 15 dtk menjaga koneksi lewat proxy. Klien jatuh ke polling /api/acara kalau putus.
export async function GET(req: Request) {
  if (!(await canReadEvent(req))) return new Response("unauthorized", { status: 401 });
  const store = await getStore();
  const enc = new TextEncoder();
  let stop = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (data: unknown) => {
        try {
          controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          stop();
        }
      };
      send(await store.getSnapshot());
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
