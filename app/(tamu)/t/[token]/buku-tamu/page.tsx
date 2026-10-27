import { redirect } from "next/navigation";
import { Suspense } from "react";
import { closedGuest } from "@/lib/server/feedback";

export const metadata = { title: "Buku tamu · House Moving Day" };

// F5 v2 (K3) · /buku-tamu = link pesan makasih (P12, `?dari=wa`). Buku tamu sekarang sheet di BT12:
// belum isi → /selesai?sheet=buku-tamu · udah isi → /kolase?isi=1 (T14d) · belum masuk → /selesai ·
// acara belum ditutup / data dihapus → /t/{token}.
export default function GuestbookPage({ params }: PageProps<"/t/[token]/buku-tamu">) {
  return (
    <Suspense>
      <Guestbook params={params} />
    </Suspense>
  );
}

async function Guestbook({ params }: Pick<PageProps<"/t/[token]/buku-tamu">, "params">) {
  const { token } = await params;
  const ctx = await closedGuest(token);
  if (!ctx) redirect(`/t/${token}`);
  const { guest, store, inside } = ctx;
  if (!inside) redirect(`/t/${token}/selesai`);
  if (store.feedbackFor(guest.id)) redirect(`/t/${token}/kolase?isi=1`);
  return redirect(`/t/${token}/selesai?sheet=buku-tamu`);
}
