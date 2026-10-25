import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ConfirmForm } from "@/components/f1/ConfirmForm";
import { Screen, Skeleton } from "@/components/ui";
import { formatWa } from "@/lib/csv";
import { guestFromToken } from "@/lib/server/access";
import { submitConfirm } from "../actions";

// T02 · Konfirmasi hadir (+ T02c belum lengkap, T02d gagal kirim). Juga dipakai "Ubah jawaban" T02b.
export default function ConfirmPage({ params }: PageProps<"/t/[token]/konfirmasi">) {
  return (
    <Suspense
      fallback={
        <Screen withBack>
          <Skeleton height={100} radius={12} />
          <Skeleton height={300} />
        </Screen>
      }
    >
      <Form params={params} />
    </Suspense>
  );
}

async function Form({ params }: Pick<PageProps<"/t/[token]/konfirmasi">, "params">) {
  const { token } = await params;
  const guest = await guestFromToken(token);
  if (!guest) redirect(`/t/${token}`);
  return (
    <ConfirmForm
      backHref={`/t/${token}`}
      doneHref={`/t/${token}`}
      initial={{
        name: guest.name,
        ig: guest.ig ? `@${guest.ig}` : "",
        wa: guest.wa ? formatWa(guest.wa) : "",
        job: guest.job ?? "",
        interests: guest.interests ?? "",
        follow: guest.followConfirmed,
      }}
      submit={submitConfirm.bind(null, token)}
    />
  );
}
