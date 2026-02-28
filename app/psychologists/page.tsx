// export const metadata: Metadata = {
//   title: "Catalog | TravelTrucks",
//   description:
//     "Explore our wide range of campervans. Filter by equipment, type, and location to find the perfect vehicle for your next travel adventure.",
//   keywords: [
//     "campervan catalog",
//     "rent campervan",
//     "campervan filters",
//     "van life",
//     "TravelTrucks models",
//   ],
//   openGraph: {
//     title: "Campervan Catalog | TravelTrucks",
//     description: "Find your dream campervan in our extensive catalog.",
//     type: "website",
//     url: "hhttps://campers-el18.vercel.app/catalog",
//   },
// };

import css from "./page.module.css";

import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";
import Link from "next/link";
import SortDropdown from "@/components/SortDropdown/SortDropdown";

interface Psychologist {
  id: string;
  name: string;
  specialization: string;
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
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const params = await searchParams;

  const limit = Number(params?.limit ?? 3);

  const psychologists = await getPsychologists();
  const visible = psychologists.slice(0, limit);

  return (
    <div className={css.psychologistsPage}>
      <h1>Psychologists</h1>

      <SortDropdown />

      {visible.map((psy) => (
        <div key={psy.id}>
          <h3>{psy.name}</h3>
          <p>{psy.specialization}</p>
        </div>
      ))}

      {limit < psychologists.length && (
        <Link href={`/psychologists?limit=${limit + 3}`}>Load more</Link>
      )}
    </div>
  );
}
