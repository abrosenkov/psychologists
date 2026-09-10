import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { get, ref } from "firebase/database";
import PsychologistsListWrapper from "@/components/PsychologistsListWrapper/PsychologistsListWrapper";
import { db } from "@/lib/firebase";
import type { Psychologist } from "@/types/psychologist";
import css from "./page.module.css";

interface PageProps {
  params: Promise<{ id: string }>;
}

const getPsychologist = cache(async (id: string): Promise<Psychologist | null> => {
  const snapshot = await get(ref(db, `psychologists/${id}`));

  if (!snapshot.exists()) return null;

  return { id, ...(snapshot.val() as Omit<Psychologist, "id">) };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const psychologist = await getPsychologist(id);

  if (!psychologist) return { title: "Psychologist not found" };

  return {
    title: psychologist.name,
    description:
      psychologist.about?.slice(0, 160) ||
      `View the profile of ${psychologist.name}.`,
  };
}

export default async function PsychologistDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const psychologist = await getPsychologist(id);

  if (!psychologist) notFound();

  return (
    <main className={css.detailsPage}>
      <div className="container">
        <PsychologistsListWrapper psychologists={[psychologist]} />
      </div>
    </main>
  );
}
