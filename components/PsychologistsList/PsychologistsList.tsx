"use client";

import { useState } from "react";
import { Button } from "../UI/Button/Button";
import PsychologistCard from "../PsychologistCard/PsychologistCard";
import css from "./PsychologistsList.module.css";

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
}

const STEP = 3;

export default function PsychologistsList({
  psychologists,
}: {
  psychologists: Psychologist[];
}) {
  const [visibleCount, setVisibleCount] = useState(3);

  const visible = psychologists.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + STEP);
  };

  return (
    <div className={css.list}>
      {visible.map((psychologist) => (
        <PsychologistCard key={psychologist.id} psychologist={psychologist} />
      ))}

      {visibleCount < psychologists.length && (
        <Button onClick={handleLoadMore}>Load more</Button>
      )}
    </div>
  );
}
