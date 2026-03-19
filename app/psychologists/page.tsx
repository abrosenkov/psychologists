import css from "./page.module.css";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import SortDropdown from "@/components/SortDropdown/SortDropdown";
import PsychologistsList from "@/components/PsychologistsList/PsychologistsList";
import clsx from "clsx";

interface Psychologist {
  id: string;
  name: string;
  specialization: string;
  avatar_url: string;
  experience: number;
  license: string;
  rating: number;
  price_per_hour: number;
  initial_consultation: string;
  about: string;
  [key: string]: unknown;
}

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
  searchParams: Promise<{ sort?: string }>;
}) {
  const params = await searchParams;
  const psychologists = await getPsychologists();
  const sort = params?.sort || "name-asc";

  const sorted = [...psychologists];

  switch (sort) {
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;

    case "price-asc":
      sorted.sort((a, b) => a.price_per_hour - b.price_per_hour);
      break;

    case "price-desc":
      sorted.sort((a, b) => b.price_per_hour - a.price_per_hour);
      break;

    case "rating-asc":
      sorted.sort((a, b) => a.rating - b.rating);
      break;

    case "rating-desc":
      sorted.sort((a, b) => b.rating - a.rating);
      break;
  }

  return (
    <div className={css.psychologistsPage}>
      <div className={clsx("container", css.psychologistsContainer)}>
        <SortDropdown />

        <PsychologistsList key={sort} psychologists={sorted} />
      </div>
    </div>
  );
}
