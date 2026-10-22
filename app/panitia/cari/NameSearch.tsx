"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CameraSlash,
  CaretLeft,
  Check,
  DownloadSimple,
  Info,
  UserPlus,
  WifiSlash,
} from "@/components/icons";
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Card,
  Field,
  IconButton,
  Screen,
  ScreenHeader,
  SearchField,
  Sheet,
  Toast,
} from "@/components/ui";
import { postCheckIn } from "@/lib/crewClient";
import { cx } from "@/lib/cx";
import type { CheckInMethod } from "@/lib/data/types";
import styles from "./cari.module.css";

export type SearchRow = {
  id: string;
  name: string;
  ig: string;
  keyNo: string;
  code: string;
  checkedInAt: string | null;
  method: CheckInMethod | null;
};

const POLL_MS = 5000;

export function NameSearch({
  rows,
  cameraError,
  initialQuery,
}: {
  rows: SearchRow[];
  cameraError: boolean;
  initialQuery: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [local, setLocal] = useState<Record<string, string>>({}); // guestId → jam (optimistik)
  const [queue, setQueue] = useState<string[]>([]); // check-in manual yang menunggu sinkron
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState<{ key: number; text: string } | null>(null);
  const [walkIn, setWalkIn] = useState(false);
  const seq = useRef(0);

  const flash = (text: string) => setToast({ key: ++seq.current, text });

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // Data server diperbarui tiap 5 dtk (check-in dari HP panitia lain ikut tampil).
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === "visible" && navigator.onLine) router.refresh();
    }, POLL_MS);
    return () => clearInterval(t);
  }, [router]);

  // Antrean offline: dikirim ulang saat online lagi.
  useEffect(() => {
    const sync = async () => {
      setOnline(navigator.onLine);
      if (!navigator.onLine) return;
      const pending = [...queue];
      for (const id of pending) {
        try {
          await postCheckIn({ guestId: id });
          setQueue((cur) => cur.filter((x) => x !== id));
        } catch {
          return;
        }
      }
      if (pending.length) router.refresh();
    };
    const t = setTimeout(sync, 0);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      clearTimeout(t);
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, [queue, router]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase().replace(/^[@#]/, "");
    if (!term) return rows;
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(term) ||
        r.ig.includes(term) ||
        r.code.toLowerCase().includes(term) ||
        r.keyNo.includes(term),
    );
  }, [q, rows]);

  async function checkIn(r: SearchRow) {
    const nowLabel = new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .format(new Date())
      .replace(":", ".");
    setLocal((cur) => ({ ...cur, [r.id]: nowLabel }));
    try {
      const res = await postCheckIn({ guestId: r.id });
      if ("error" in res) throw new Error(res.error);
      if (res.kind === "used") {
        flash(`Masuk ${res.time} ${res.method === "manual" ? "lewat cari nama" : "lewat scan"}`);
        setLocal((cur) => ({ ...cur, [r.id]: res.time ?? nowLabel }));
      } else if (res.kind === "valid") {
        flash(`${r.name.split(" ")[0]} masuk · tamu ke-${res.guestNo}`);
      }
      router.refresh();
    } catch {
      // Offline / gagal jaringan: antre, tetap tampil "Masuk" di HP ini.
      setQueue((cur) => (cur.includes(r.id) ? cur : [...cur, r.id]));
    }
  }

  const offlineBanner = (!online || queue.length > 0) && (
    <div className={styles.offline}>
      <WifiSlash size={18} />
      <span className="t-label-emph">Mode offline · {queue.length} check-in menunggu sinkron</span>
    </div>
  );

  return (
    <Screen
      withBack
      bottom={
        <Button variant="secondary" href="/panitia/cari/manual" icon={<DownloadSimple />}>
          Unduh daftar manual (PDF)
        </Button>
      }
    >
      <ScreenHeader
        leading={<IconButton href="/panitia/scan" label="Kembali" icon={<CaretLeft />} />}
        eyebrow="Check-in manual · tanpa tiket"
        title="Cari nama"
      />
      {cameraError ? (
        <Banner tone="warning" icon={<CameraSlash />} title="Kamera nggak bisa dipakai">
          Langsung pindah ke cari nama. Cocokkan nama + IG tamu, lalu check-in.
        </Banner>
      ) : (
        offlineBanner
      )}
      <SearchField
        label="Cari tamu"
        placeholder="Nama, IG, atau kode tiket"
        value={q}
        autoFocus
        onChange={(e) => setQ(e.target.value)}
      />

      {results.length === 0 ? (
        <button type="button" className={styles.notFound} onClick={() => setWalkIn(true)}>
          <span className="t-body-emph">“{q.trim()}” nggak ada di daftar</span>
          <span className="t-label c-label-2">Tamu walk-in? Tambahkan cepat di bawah.</span>
        </button>
      ) : (
        <Card className={styles.list}>
          {results.map((r) => {
            const time = r.checkedInAt ?? local[r.id];
            return (
              <div key={r.id} className={styles.row}>
                <Avatar name={r.name} />
                <span className={styles.stack}>
                  <span className="t-body-emph">{r.name}</span>
                  <span className="t-label c-label-2">
                    @{r.ig} · {r.keyNo}
                  </span>
                </span>
                {time ? (
                  <Badge tone="success">Masuk {time}</Badge>
                ) : (
                  <button type="button" className={styles.checkin} onClick={() => checkIn(r)}>
                    Check-in
                  </button>
                )}
              </div>
            );
          })}
        </Card>
      )}

      {toast && (
        <div className={styles.toastWrap} key={toast.key}>
          <Toast icon={<Check />}>{toast.text}</Toast>
        </div>
      )}

      <WalkInSheet
        open={walkIn}
        query={q}
        onClose={() => setWalkIn(false)}
        onDone={(text) => {
          setWalkIn(false);
          setQ("");
          flash(text);
          router.refresh();
        }}
      />
    </Screen>
  );
}

// P07c · Tambah tamu cepat (walk-in): nama + IG, langsung check-in manual.
function WalkInSheet({
  open,
  query,
  onClose,
  onDone,
}: {
  open: boolean;
  query: string;
  onClose: () => void;
  onDone: (toast: string) => void;
}) {
  const guessName = query
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
    .join(" ");
  const [name, setName] = useState(guessName);
  const [ig, setIg] = useState(
    query.trim() ? `@${query.trim().toLowerCase().replace(/\s+/g, "")}` : "",
  );
  const [errors, setErrors] = useState<{ name?: string; ig?: string; net?: boolean }>({});
  const [pending, setPending] = useState(false);
  const [lastQuery, setLastQuery] = useState(query);

  // Isi ulang tebakan saat sheet dibuka dengan kata cari baru.
  if (open && query !== lastQuery) {
    setLastQuery(query);
    setName(guessName);
    setIg(query.trim() ? `@${query.trim().toLowerCase().replace(/\s+/g, "")}` : "");
    setErrors({});
  }

  async function submit() {
    setPending(true);
    setErrors({});
    try {
      const res = await fetch("/api/panitia/walkin", {
        method: "POST",
        headers: { "content-type": "application/json", "x-device": "walkin" },
        body: JSON.stringify({ name, ig }),
      });
      const body = (await res.json()) as {
        error?: string;
        fields?: { name?: string; ig?: string };
        kind?: string;
        guestNo?: number;
      };
      if (body.error === "invalid") setErrors(body.fields ?? {});
      else if (body.kind === "valid" || body.kind === "used") {
        onDone(
          `${name.split(" ")[0]} ditambah & masuk${body.guestNo ? ` · tamu ke-${body.guestNo}` : ""}`,
        );
      } else setErrors({ net: true });
    } catch {
      setErrors({ net: true });
    } finally {
      setPending(false);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Tambah tamu cepat">
      <div className={styles.sheetHead}>
        <h3 className="t-card-title">Tambah tamu cepat</h3>
        <p className="t-label c-label-2">Masuk sebagai walk-in · tanpa tiket</p>
      </div>
      {errors.net && (
        <Banner tone="danger" icon={<WifiSlash />} title="Gagal nambah, sinyalnya lemah">
          Isian nggak hilang. Coba lagi ya.
        </Banner>
      )}
      <Field
        label="Nama"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
      />
      <Field
        label="Instagram"
        value={ig}
        autoCapitalize="none"
        placeholder="@username"
        onChange={(e) => setIg(e.target.value)}
        error={errors.ig}
      />
      <p className={cx("t-label c-label-2", styles.info)}>
        <Info size={16} />
        Tamu dapat kartu &amp; akses layar acara setelah ditambah.
      </p>
      <Button icon={<UserPlus />} onClick={submit} disabled={pending}>
        Tambah &amp; check-in
      </Button>
    </Sheet>
  );
}
