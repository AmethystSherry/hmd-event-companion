import { redirect } from "next/navigation";
import { Suspense } from "react";

// N1 · Tanya pembicara = sheet di layar acara (?sheet=tanya). Link lama ke sini dialihkan.
// Bukan talkshow / belum masuk → layar acara yang menangani (sheet nggak dibuka, atau ke tiket).
export default function Page({ params }: PageProps<"/t/[token]/tanya">) {
  return (
    <Suspense>
      <Go params={params} />
    </Suspense>
  );
}

async function Go({ params }: Pick<PageProps<"/t/[token]/tanya">, "params">): Promise<never> {
  const { token } = await params;
  redirect(`/t/${token}/acara?sheet=tanya`);
}
