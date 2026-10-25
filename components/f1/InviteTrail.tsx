import { Check } from "@/components/icons";
import f1 from "./f1.module.css";
import styles from "./invite.module.css";

const STEPS = ["Undangan dibuka", "Konfirmasi", "Dapet kunci"];

// Jejak undangan (T01): 3 langkah; sebelum `step` = selesai, `step` = aktif (aria-current).
// Penghitung "x dari 3" = jumlah langkah yang udah selesai.
export function InviteTrail({ step }: { step: 1 | 2 | 3 }) {
  return (
    <section className={styles.trail} aria-labelledby="jejak-undangan">
      <div className={f1.between}>
        <h2 id="jejak-undangan" className="t-label-emph">
          Jejak undangan
        </h2>
        <p className="t-label c-label-2">{step - 1} dari 3</p>
      </div>
      <ol className={styles.trailSteps}>
        {STEPS.map((label, i) => {
          const n = i + 1;
          const state = n < step ? "done" : n === step ? "active" : "todo";
          return (
            <li
              key={label}
              className={styles.trailStep}
              data-state={state}
              aria-current={state === "active" ? "step" : undefined}
            >
              <span aria-hidden className={styles.dot}>
                {state === "done" ? <Check size={20} weight="bold" /> : n}
              </span>
              <span className={state === "active" ? "t-label-emph" : "t-label"}>
                {label}
                {state === "done" && <span className="sr-only"> (selesai)</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
