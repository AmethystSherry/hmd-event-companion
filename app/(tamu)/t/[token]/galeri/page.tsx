import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GuestPlaceholder } from "@/components/f4/Placeholder";
import { Image as ImageIcon } from "@/components/icons";
import { guestFromToken } from "@/lib/server/access";

export const metadata = { title: "Galeri · House Moving Day" };

// Placeholder BT07d Galeri · Foto saya (susulan N4). Pintasan Galeri di layar acara (F4).
export default function Page({ params }: PageProps<"/t/[token]/galeri">) {
  return (
    <Suspense>
      <Body params={params} />
    </Suspense>
  );
}

async function Body({ params }: Pick<PageProps<"/t/[token]/galeri">, "params">) {
  const { token } = await params;
  if (!(await guestFromToken(token))) redirect(`/t/${token}`);
  return (
    <GuestPlaceholder token={token} title="Galeri" icon={<ImageIcon size={30} />}>
      Galeri foto kolase lagi disiapin. Sementara, jepret dulu lewat tombol kamera di layar acara.
    </GuestPlaceholder>
  );
}
