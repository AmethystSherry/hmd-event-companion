import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { SCREENS } from "../screens";

export const metadata = { title: "N3 state · dev" };

// /dev/states/n3/{kode}: satu layar N3 ukuran penuh dengan data contoh (tanpa server).
export default function StatePage({ params }: PageProps<"/dev/states/n3/[code]">) {
  return (
    <Suspense>
      <State params={params} />
    </Suspense>
  );
}

async function State({ params }: Pick<PageProps<"/dev/states/n3/[code]">, "params">) {
  await connection();
  const { code } = await params;
  const screen = SCREENS.find((s) => s.code.toLowerCase() === code.toLowerCase());
  if (!screen) notFound();
  return <>{screen.render()}</>;
}
