import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SCREENS } from "../screens";

export const metadata = { title: "F1 state · dev" };

// /dev/states/f1/{kode}: satu layar F1 ukuran penuh dengan data contoh (tanpa aksi ke server).
export default function StatePage({ params }: PageProps<"/dev/states/f1/[code]">) {
  return (
    <Suspense>
      <State params={params} />
    </Suspense>
  );
}

async function State({ params }: Pick<PageProps<"/dev/states/f1/[code]">, "params">) {
  await connection();
  const { code } = await params;
  const screen = SCREENS.find((s) => s.code.toLowerCase() === code.toLowerCase());
  if (!screen) notFound();
  return <>{await screen.render()}</>;
}
