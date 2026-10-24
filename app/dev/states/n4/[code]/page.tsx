import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SCREENS } from "../screens";

export const metadata = { title: "N4 state · dev" };

// /dev/states/n4/{kode}: satu layar N4 ukuran penuh dengan data contoh (tanpa kamera/server).
export default function StatePage({ params }: PageProps<"/dev/states/n4/[code]">) {
  return (
    <Suspense>
      <State params={params} />
    </Suspense>
  );
}

async function State({ params }: Pick<PageProps<"/dev/states/n4/[code]">, "params">) {
  await connection();
  const { code } = await params;
  const screen = SCREENS.find((s) => s.code.toLowerCase() === code.toLowerCase());
  if (!screen) notFound();
  return <>{screen.render()}</>;
}
