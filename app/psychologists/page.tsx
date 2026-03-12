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

export default async function PsychologistsPage() {
  const psychologists = await getPsychologists();

  return (
    <div className={css.psychologistsPage}>
      <div className={clsx("container", css.psychologistsContainer)}>
        <SortDropdown />

        <PsychologistsList psychologists={psychologists} />
      </div>
    </div>
  );
}
