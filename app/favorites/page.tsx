"use client";

import { useEffect, useMemo, useState } from "react";
import css from "./page.module.css";
import { useAuthStore } from "@/stores/useAuthStore";
import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";
import PsychologistCard from "@/components/PsychologistCard/PsychologistCard";
import clsx from "clsx";
import { Button } from "@/components/UI/Button/Button";
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

export default function FavoritesPage() {
  const user = useAuthStore((state) => state.user);
  const [psychologists, setPsychologists] = useState<Psychologist[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const favoritesSnapshot = await get(ref(db, `favorites/${user.uid}`));
        const psychologistsSnapshot = await get(ref(db, "psychologists"));

        if (favoritesSnapshot.exists()) {
          const favoritesData = favoritesSnapshot.val() as Record<
            string,
            unknown
          >;
          setFavoriteIds(Object.keys(favoritesData));
        }

        if (psychologistsSnapshot.exists()) {
          const data = psychologistsSnapshot.val() as Record<
            string,
            Record<string, unknown>
          >;

          const list: Psychologist[] = Object.entries(data).map(
            ([key, value]) =>
              ({
                id: key,
                ...(value as Record<string, unknown>),
              }) as Psychologist
          );

          setPsychologists(list);
        }
      } catch {
        toast.error("Failed to load favorites. Try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const favoritePsychologists = useMemo(
    () => psychologists.filter((p) => favoriteIds.includes(p.id)),
    [psychologists, favoriteIds]
  );

  const handleToggleFavorite = async (psychologistId: string) => {
    if (!user) {
      return;
    }

    const favoriteRef = ref(db, `favorites/${user.uid}/${psychologistId}`);
    const isFavorite = favoriteIds.includes(psychologistId);

    try {
      if (isFavorite) {
        await import("firebase/database").then(({ remove }) =>
          remove(favoriteRef)
        );
        setFavoriteIds((prev) => prev.filter((id) => id !== psychologistId));
        toast.success("Removed from favorites.");
      }
    } catch {
      toast.error("Failed to update favorites. Try again.");
    }
  };

  if (!user) {
    return (
      <div className={css.favoritesPage}>
        <div className={clsx("container", css.favoritesContainer)}>
          <h1 className={css.title}>Favorites</h1>
          <p className={css.message}>
            This page is available only for authorized users.
          </p>
          <Button href="/psychologists">Go to psychologists</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={css.favoritesPage}>
      <div className={clsx("container", css.favoritesContainer)}>
        <h1 className={css.title}>Favorites</h1>

        {isLoading ? (
          <p className={css.message}>Loading favorites...</p>
        ) : favoritePsychologists.length === 0 ? (
          <p className={css.message}>You have no favorite psychologists yet.</p>
        ) : (
          <div className={css.list}>
            {favoritePsychologists.map((psychologist) => (
              <PsychologistCard
                key={psychologist.id}
                psychologist={psychologist}
                isFavorite={true}
                onToggleFavorite={() => handleToggleFavorite(psychologist.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
