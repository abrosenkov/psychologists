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
  console.log(data[0]);

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

  const sort = params?.sort || "name-asc";
  const price = params?.price;
  const rating = params?.rating;

  let filtered = [...psychologists];

  if (price === "lt10") {
    filtered = filtered.filter((p) => p.price_per_hour < 10);
  }

  if (price === "gt10") {
    filtered = filtered.filter((p) => p.price_per_hour >= 10);
  }

  if (rating === "popular") {
    filtered = filtered.filter((p) => p.rating >= 4.5);
  }

  if (rating === "not-popular") {
    filtered = filtered.filter((p) => p.rating < 4.5);
  }

  const sorted = [...filtered];

  switch (sort) {
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;

    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;

    default:
      break;
  }

  return (
    <div className={css.psychologistsPage}>
      <div className={clsx("container", css.psychologistsContainer)}>
        <SortDropdown />
        <PsychologistsList
          key={`${sort}-${price ?? "none"}-${rating ?? "none"}`}
          psychologists={sorted}
        />
      </div>
    </div>
  );
}
