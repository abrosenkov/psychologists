import css from "./page.module.css";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import clsx from "clsx";
import FavoritesWrapper from "@/components/FavoritesWrapper/FavoritesWrapper";
import SortDropdown from "@/components/SortDropdown/SortDropdown";
import {
  filterPsychologists,
  sortKeyForListing,
  sortPsychologists,
} from "@/lib/psychologistFilters";
import { Psychologist } from "@/types/psychologist";

async function getPsychologists(): Promise<Psychologist[]> {
  const snapshot = await get(ref(db, "psychologists"));

  if (!snapshot.exists()) return [];

  const data = snapshot.val();

  return Object.entries(data).map(([key, value]) => ({
    id: key,
    ...(value as Record<string, unknown>),
  })) as Psychologist[];
}

export default async function FavoritesPage({
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
    <div className={css.favoritesPage}>
      <div className={clsx("container", css.favoritesContainer)}>
        <SortDropdown />

        <FavoritesWrapper
          key={`${listSortKey}-${price ?? "none"}-${rating ?? "none"}`}
          psychologists={sorted}
        />
      </div>
    </div>
  );
}
