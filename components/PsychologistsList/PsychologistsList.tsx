"use client";

import { useEffect, useState } from "react";
import { Button } from "../UI/Button/Button";
import PsychologistCard from "../PsychologistCard/PsychologistCard";
import css from "./PsychologistsList.module.css";
import { useAuthStore } from "@/stores/useAuthStore";
import { db } from "@/lib/firebase";
import { onValue, ref, remove, set } from "firebase/database";
import toast from "react-hot-toast";

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
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) {
      setFavoriteIds([]);
      return;
    }

    const favoritesRef = ref(db, `favorites/${user.uid}`);

    const unsubscribe = onValue(
      favoritesRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setFavoriteIds([]);
          return;
        }

        const data = snapshot.val() as Record<string, unknown>;
        setFavoriteIds(Object.keys(data));
      },
      () => {
        toast.error("Failed to load favorites.");
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);

  const handleToggleFavorite = async (psychologistId: string) => {
    if (!user) {
      toast.error("This feature is available only for authorized users.");
      return;
    }

    const favoriteRef = ref(db, `favorites/${user.uid}/${psychologistId}`);
    const isFavorite = favoriteIds.includes(psychologistId);

    try {
      if (isFavorite) {
        await remove(favoriteRef);
        toast.success("Removed from favorites.");
      } else {
        await set(favoriteRef, true);
        toast.success("Added to favorites.");
      }
    } catch {
      toast.error("Failed to update favorites. Try again.");
    }
  };

  const visible = psychologists.slice(0, visibleCount);

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + STEP);
  };

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
          onToggleFavorite={() => handleToggleFavorite(psychologist.id)}
        />
      ))}

      {visibleCount < psychologists.length && (
        <Button onClick={handleLoadMore}>Load more</Button>
      )}
    </div>
  );
}
