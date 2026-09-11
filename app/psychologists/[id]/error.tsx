"use client";
import css from "./page.module.css";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className={css.wrapper}>
      <p>Could not fetch psychologist details.</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
