import React from "react";
import css from "./page.module.css";
import { Metadata } from "next";
import { Button } from "@/components/UI/Button/Button";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The requested psychologist could not be found.",
  openGraph: {
    title: "Page not found",
    description: "The requested psychologist could not be found.",
    images: [
      {
        url: "/hero/hero.webp",
        width: 1200,
        height: 630,
        alt: "Psychologists Services",
      },
    ],
  },
};

export default function notFound() {
  return (
    <div className={css.wrapper}>
      <div className="container">
        <div className={css.content}>
          <h1 className={css.title}>404</h1>
          <h2 className={css.subtitle}>Whoops! Page not found</h2>
          <p className={css.description}>
            The psychologist you are looking for is unavailable or the link is
            incorrect.
          </p>

          <Button href="/psychologists" className={css.backBtn}>
            Back to psychologists
          </Button>
        </div>
      </div>
    </div>
  );
}
