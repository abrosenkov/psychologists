import css from "./page.module.css";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import SortDropdown from "@/components/SortDropdown/SortDropdown";
import {
  filterPsychologists,
  sortKeyForListing,
  sortPsychologists,
} from "@/lib/psychologistFilters";

import clsx from "clsx";
import PsychologistsListWrapper from "@/components/PsychologistsListWrapper/PsychologistsListWrapper";
import { Psychologist } from "@/types/psychologist";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Psychologists Catalog | Find the Right Specialist",
  description:
    "Browse our catalog of professional psychologists. Sort by rating, price, or name, read profiles, and choose the best specialist for you.",
  keywords: [
    "psychologists catalog",
    "find psychologist",
    "therapy specialists",
    "mental health experts",
    "online booking psychologist",
    "psychologists services",
  ],
  openGraph: {
    title: "Psychologists Catalog | Find the Right Specialist",
    description:
      "Browse trusted psychologists, compare specialists, and choose the right one for your needs.",
    type: "website",
    images: [
      {
        url: "/hero/hero-bg.webp",
        width: 1200,
        height: 630,
        alt: "Psychologists Catalog",
      },
    ],
  },
};

async function getPsychologists(): Promise<Psychologist[]> {
  const snapshot = await get(ref(db, "psychologists"));

  if (!snapshot.exists()) return [];

  const data = snapshot.val();

  return Object.entries(data).map(([key, value]) => ({
    id: key,
    ...(value as Record<string, unknown>),
  })) as Psychologist[];
}

export default async function PsychologistsPage({
  searchParams,
}: {
  searchParams: Promise<{
    sort?: string;
    price?: string;
    rating?: string;
  }>;
}) {
  const params = await searchParams;
  const psychologists = await getPsychologists();

  const sortFromUrl = params?.sort || "name-asc";
  const price = params?.price;
  const rating = params?.rating;

  const filtered = filterPsychologists(psychologists, { price, rating });
  const listSortKey = sortKeyForListing(sortFromUrl, rating);
  const sorted = sortPsychologists(filtered, listSortKey);

  return (
    <div className={css.psychologistsPage}>
      <div className={clsx("container", css.psychologistsContainer)}>
        <SortDropdown />

        <PsychologistsListWrapper
          key={`${listSortKey}-${price ?? "none"}-${rating ?? "none"}`}
          psychologists={sorted}
        />
      </div>
    </div>
  );
}
