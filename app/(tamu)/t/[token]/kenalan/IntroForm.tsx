"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CaretLeft, Key, WifiSlash } from "@/components/icons";
import {
  AddChip,
  Banner,
  Button,
  Card,
  Chip,
  IconButton,
  Screen,
  TextAction,
} from "@/components/ui";
import { saveIntro } from "../actions";
import styles from "../guest.module.css";

const MAX = 3;
const SKILL_OPTIONS = ["UX writing", "Design system", "Motion", "Fotografi", "Coding"];
const ASBUN_OPTIONS = ["Kopi susu", "Kucing", "Teori konspirasi", "Film horor"];

// T02b · Kenalan dikit: chip Potensi skill (Ink) & Potensi asbun (oranye lembut), maks. 3 per grup.
export function IntroForm({
  token,
  initialSkills,
  initialAsbun,
}: {
  token: string;
  initialSkills: string[];
  initialAsbun: string[];
}) {
  const router = useRouter();
  const [skills, setSkills] = useState(initialSkills);
  const [asbun, setAsbun] = useState(initialAsbun);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const goTicket = () => router.push(`/t/${token}`);

  function save() {
    setFailed(false);
    startTransition(async () => {
      try {
        const res = await saveIntro(token, { skills, asbun });
        if (res.ok) goTicket();
        else setFailed(true);
      } catch {
        setFailed(true);
      }
    });
  }

  return (
    <Screen
      withBack
      bottomHeight={118}
      bottom={
        <>
          <Button icon={<Key />} onClick={save} disabled={pending}>
            Simpan &amp; lihat tiket
          </Button>
          <Button variant="secondary" onClick={goTicket} disabled={pending}>
            Lewati dulu
          </Button>
        </>
      }
    >
      <div className={styles.topRow}>
        <IconButton href={`/t/${token}/konfirmasi`} label="Kembali" icon={<CaretLeft />} />
        <span className={`t-label-emph ${styles.stepBadge}`}>Opsional · 2 dari 2</span>
      </div>
      <header className={styles.intro}>
        <h1 className="t-title">Kenalan dikit, yuk</h1>
        <p className="t-body c-label-2">
          Isinya jadi chip di kartu tetanggamu, biar tamu lain punya bahan buat nyapa.
        </p>
      </header>
      {failed && (
        <Banner
          tone="danger"
          icon={<WifiSlash />}
          title="Gagal simpan, sinyalnya lemah"
          action={<TextAction onClick={save}>Coba lagi</TextAction>}
        >
          Tenang, pilihanmu nggak hilang.
        </Banner>
      )}
      <ChipGroup
        title="Potensi skill"
        subtitle="Hal yang kamu jago"
        options={SKILL_OPTIONS}
        value={skills}
        onChange={setSkills}
        tone="ink"
      />
      <ChipGroup
        title="Potensi asbun"
        subtitle="Topik ngalor-ngidul favoritmu"
        options={ASBUN_OPTIONS}
        value={asbun}
        onChange={setAsbun}
        tone="accent"
      />
    </Screen>
  );
}

function ChipGroup({
  title,
  subtitle,
  options,
  value,
  onChange,
  tone,
}: {
  title: string;
  subtitle: string;
  options: string[];
  value: string[];
  onChange: React.Dispatch<React.SetStateAction<string[]>>;
  tone: "ink" | "accent";
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  // Pilihan sendiri yang ditambah tamu tetap tampil di daftar.
  const all = [...options, ...value.filter((v) => !options.includes(v))];
  const full = value.length >= MAX;

  const toggle = (opt: string) =>
    onChange((cur) =>
      cur.includes(opt) ? cur.filter((v) => v !== opt) : cur.length >= MAX ? cur : [...cur, opt],
    );

  function commit() {
    const text = draft.trim().slice(0, 24);
    setDraft("");
    setAdding(false);
    if (!text) return;
    onChange((cur) => (cur.includes(text) || cur.length >= MAX ? cur : [...cur, text]));
  }

  return (
    <Card className={styles.chipCard}>
      <div className={styles.chipHead}>
        <span className={styles.stack}>
          <span className="t-headline">{title}</span>
          <span className="t-label c-label-2">{subtitle}</span>
        </span>
        <span
          className="t-label c-label-2 tabular"
          aria-label={`${value.length} dari ${MAX} dipilih`}
        >
          {value.length} / {MAX}
        </span>
      </div>
      <div className={styles.chips}>
        {all.map((opt) => {
          const on = value.includes(opt);
          return (
            <Chip
              key={opt}
              look="outline"
              tone={tone}
              selected={on}
              disabled={!on && full}
              onClick={() => toggle(opt)}
            >
              {opt}
            </Chip>
          );
        })}
        {adding ? (
          <input
            autoFocus
            className={styles.addInput}
            value={draft}
            maxLength={24}
            placeholder={tone === "ink" ? "mis. Ilustrasi" : "mis. Musik indie"}
            aria-label={`Tambah ${title.toLowerCase()}`}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
            }}
          />
        ) : (
          <AddChip disabled={full} onClick={() => setAdding(true)}>
            Tambah
          </AddChip>
        )}
      </div>
    </Card>
  );
}
