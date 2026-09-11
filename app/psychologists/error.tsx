"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <div className="container">
      <p>Could not fetch the list of psychologists.</p>
      <button type="button" onClick={reset}>Try again</button>
    </div>
  );
}
