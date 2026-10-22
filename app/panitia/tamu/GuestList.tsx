"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Check, MagnifyingGlass, PaperPlaneTilt, UploadSimple, Users } from "@/components/icons";
import {
  Avatar,
  Badge,
  Card,
  HeroState,
  IconButton,
  ListRow,
  ScreenHeader,
  SearchField,
  StatTile,
} from "@/components/ui";
import styles from "./tamu.module.css";

export type GuestRowData = {
  id: string;
  keyNo: number;
  name: string;
  ig: string;
  status: "hadir" | "konfirmasi" | "belum" | "tidak";
  checkedInAt: string | null;
};

// "Realtime" sementara: refresh data server tiap 5 dtk (realtime asli dipasang bersama DB).
const POLL_MS = 5000;

export function GuestList({
  rows,
  stats,
}: {
  rows: GuestRowData[];
  stats: { invited: number; confirmed: number; present: number };
}) {
  const router = useRouter();
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [router]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/^@/, "");
    if (!term) return rows;
    return rows.filter((r) => r.name.toLowerCase().includes(term) || r.ig.includes(term));
  }, [q, rows]);

  return (
    <>
      <ScreenHeader
        eyebrow={`${stats.invited} diundang · ${stats.present} hadir`}
        title="Daftar tamu"
        trailing={
          <IconButton href="/panitia/undangan" label="Kirim undangan" icon={<UploadSimple />} />
        }
      />
      <div className={styles.stats}>
        <StatTile icon={<PaperPlaneTilt />} value={stats.invited} label="Diundang" />
        <StatTile icon={<Check />} value={stats.confirmed} label="Konfirmasi" />
        <StatTile icon={<Users />} value={stats.present} label="Hadir" />
      </div>
      <SearchField
        label="Cari tamu"
        placeholder="Cari nama atau IG"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {filtered.length === 0 ? (
        <Card>
          <HeroState icon={<MagnifyingGlass />} title="Nggak ketemu">
            {rows.length === 0
              ? "Belum ada tamu. Import CSV dulu dari tombol di kanan atas."
              : `Nggak ada tamu dengan nama atau IG "${q.trim()}".`}
          </HeroState>
        </Card>
      ) : (
        <Card inset aria-live="polite">
          {filtered.map((r) => (
            <ListRow
              key={r.id}
              leading={<Avatar name={r.name} />}
              title={r.name}
              subtitle={`@${r.ig}`}
              trailing={<StatusBadge row={r} />}
            />
          ))}
        </Card>
      )}
    </>
  );
}

function StatusBadge({ row }: { row: GuestRowData }) {
  switch (row.status) {
    case "hadir":
      return <Badge tone="success">Hadir {row.checkedInAt}</Badge>;
    case "konfirmasi":
      return <Badge tone="neutral">Konfirmasi</Badge>;
    case "belum":
      return <Badge tone="crew">Belum jawab</Badge>;
    case "tidak":
      return <Badge tone="neutral">Tidak hadir</Badge>;
  }
}
