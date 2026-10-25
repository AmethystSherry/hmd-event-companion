"use client";

import { useState, type KeyboardEvent } from "react";
import { ASK_ITEM_MAX, ASK_MAX, hasInterest } from "@/lib/card";
import { cx } from "@/lib/cx";
import styles from "./n3.module.css";

// T11 · "Minat · tanya aku soal (opsional)": chip accent-soft + "×" hapus, "+ Tambah minat" (dashed)
// selagi < 3. Tap tambah → input kecil di tempat (Temuan T3): Enter / blur = tambah, koma = tambah &
// lanjut ketik, Esc / kosong = batal, dobel (huruf besar-kecil diabaikan) diabaikan.
export function InterestChips({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  // Tambah beberapa minat sekaligus (dobel & kosong diabaikan, maks 3). Hasil = daftar baru.
  const add = (items: string[]) => {
    const next = [...value];
    for (const raw of items) {
      const item = raw.trim().replace(/\s+/g, " ").slice(0, ASK_ITEM_MAX);
      if (item && !hasInterest(next, item) && next.length < ASK_MAX) next.push(item);
    }
    if (next.length !== value.length) onChange(next);
    return next;
  };
  const commit = () => {
    add([draft]);
    setDraft("");
    setAdding(false);
  };
  // Koma / titik koma dari keyboard HP (keydown-nya sering "Unidentified") atau tempel teks: bagian
  // sebelum koma jadi chip, sisanya tetap di input selagi masih < 3.
  const type = (text: string) => {
    const parts = text.split(/[,;]/);
    if (parts.length === 1) return setDraft(text);
    const rest = parts.pop() ?? "";
    const next = add(parts);
    setDraft(next.length < ASK_MAX ? rest.slice(0, ASK_ITEM_MAX) : "");
    if (next.length >= ASK_MAX) setAdding(false);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation(); // Esc nutup input, bukan sheet
      setDraft("");
      setAdding(false);
    }
  };

  return (
    <div className={styles.interests} role="group" aria-labelledby="minat-judul">
      <div className={styles.interestsHead}>
        <span id="minat-judul" className="t-label-emph">
          Minat · tanya aku soal (opsional)
        </span>
        <span className={cx("t-caption", styles.count)}>
          {value.length} dari {ASK_MAX}
        </span>
      </div>
      <ul className={styles.chipList}>
        {value.map((item) => (
          <li key={item} className={styles.chip}>
            <span>{item}</span>
            <button
              type="button"
              className={styles.chipX}
              aria-label={`Hapus ${item}`}
              onClick={() => onChange(value.filter((x) => x !== item))}
            >
              ×
            </button>
          </li>
        ))}
        {value.length < ASK_MAX && (
          <li>
            {adding ? (
              <input
                autoFocus
                className={cx(styles.chipAdd, styles.chipInput)}
                aria-label="Minat baru"
                placeholder="Mis. Kopi"
                maxLength={ASK_ITEM_MAX + 1} // + koma pemisah
                value={draft}
                enterKeyHint="done"
                onChange={(e) => type(e.target.value)}
                onKeyDown={onKey}
                onBlur={commit}
              />
            ) : (
              <button type="button" className={styles.chipAdd} onClick={() => setAdding(true)}>
                + Tambah minat
              </button>
            )}
          </li>
        )}
      </ul>
    </div>
  );
}
