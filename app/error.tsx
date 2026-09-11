"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main>
      <p>We could not load this page.</p>
      <button type="button" onClick={reset}>
        Try again
      </button>
    </main>
  );
}
