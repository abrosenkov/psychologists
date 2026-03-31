"use client";

import { Button } from "../UI/Button/Button";
import PsychologistCard from "../PsychologistCard/PsychologistCard";
import css from "./PsychologistsList.module.css";
import { useState } from "react";
import { Psychologist } from "@/types/psychologist";

const STEP = 3;

interface Props {
  psychologists: Psychologist[];
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

export default function PsychologistsList({
  psychologists,
  favoriteIds = [],
  onToggleFavorite,
}: Props) {
  const [visibleCount, setVisibleCount] = useState(STEP);

  const visible = psychologists.slice(0, visibleCount);

  if (psychologists.length === 0) {
    return <p className={css.empty}>No psychologists found</p>;
  }

  return (
    <div className={css.list}>
      {visible.map((psychologist) => (
        <PsychologistCard
          key={psychologist.id}
          psychologist={psychologist}
          isFavorite={favoriteIds.includes(psychologist.id)}
          onToggleFavorite={() => onToggleFavorite?.(psychologist.id)}
        />
      ))}

      {visibleCount < psychologists.length && (
        <Button onClick={() => setVisibleCount((prev) => prev + STEP)}>
          Load more
        </Button>
      )}
    </div>
  );
}
