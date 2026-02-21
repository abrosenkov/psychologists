import React from "react";
import css from "./page.module.css";
import { Metadata } from "next";
import { Button } from "@/components/UI/Button/Button";

export const metadata: Metadata = {
  title: "Page not found",
  description:
    "Page not found. Return to TravelTrucks and keep your notes organized.",
  openGraph: {
    title: "Page not found",
    description:
      "Page not found. Return to TravelTrucks and keep your notes organized.",
    url: "https://campers-el18.vercel.app/not-found",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "TravelTrucks image",
      },
    ],
  },
};

export default function notFound() {
  return (
    <div className={css.wrapper}>
      <div className="container">
        <div className={css.content}>
          <h1 className={css.titleNotFound}>404</h1>
          <h2 className={css.subtitleNotFound}>Page not found</h2>
          <p className={css.descriptionNotFound}>
            The page you are looking for doesn&apos;t exist or may have been
            moved. Let&apos;s help you get back on track.
          </p>

          <Button href="/psychologists" className={css.backBtn}>
            Go to Psychologists
          </Button>
        </div>
      </div>
    </div>
  );
}
