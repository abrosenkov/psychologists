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
        url: "/hero/hero-bg.webp",
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
          <h1 className={css.title}>404</h1>
          <h2 className={css.subtitle}>Whoops! Page not found</h2>
          <p className={css.description}>
            The campervan you are looking for might have been booked or the link
            is broken. Don&apos;t let that stop your journey!
          </p>

          <Button href="/catalog" className={css.backBtn}>
            Back to Catalog
          </Button>
        </div>
      </div>
    </div>
  );
}
