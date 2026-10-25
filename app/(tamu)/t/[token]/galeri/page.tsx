import { redirect } from "next/navigation";
import { Suspense } from "react";

// BT07d Galeri sekarang sheet di layar acara (N4 v2) → link lama /galeri dialihkan ke sana.
export default function Page({ params }: PageProps<"/t/[token]/galeri">) {
  return (
    <Suspense>
      <Go params={params} />
    </Suspense>
  );
}

async function Go({ params }: Pick<PageProps<"/t/[token]/galeri">, "params">): Promise<never> {
  const { token } = await params;
  redirect(`/t/${token}/acara?sheet=galeri`);
}
