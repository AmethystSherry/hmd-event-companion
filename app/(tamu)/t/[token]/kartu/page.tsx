import { redirect } from "next/navigation";
import { Suspense } from "react";

// N3 · T11 Kartu kamu sekarang sheet di layar acara (?sheet=kartu). Link lama tetap jalan.
export default function Page({ params }: PageProps<"/t/[token]/kartu">) {
  return (
    <Suspense>
      <Body params={params} />
    </Suspense>
  );
}

async function Body({ params }: Pick<PageProps<"/t/[token]/kartu">, "params">): Promise<never> {
  const { token } = await params;
  redirect(`/t/${token}/acara?sheet=kartu`);
}
