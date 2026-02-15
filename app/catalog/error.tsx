"use client";

import css from "./page.module.css";

interface Props {
  error: Error;
}

export default function Error({ error }: Props) {
  return (
    <div className="container">
      <p className={css.error}>
        Could not fetch the list of campers. {error.message}
      </p>
    </div>
  );
}
