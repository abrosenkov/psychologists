"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { db } from "@/lib/firebase";
import { ref, get, remove } from "firebase/database";
import toast from "react-hot-toast";
import PsychologistsList from "../PsychologistsList/PsychologistsList";
import { Psychologist } from "@/types/psychologist";
import css from "./FavoritesWrapper.module.css";

export default function FavoritesWrapper({
  psychologists,
}: {
  psychologists: Psychologist[];
}) {
  const user = useAuthStore((state) => state.user);

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const snapshot = await get(ref(db, `favorites/${user.uid}`));

        if (!snapshot.exists()) {
          setFavoriteIds([]);
          return;
        }

        setFavoriteIds(Object.keys(snapshot.val()));
      } catch {
        toast.error("Failed to load favorites.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const favoritePsychologists = useMemo(
    () => psychologists.filter((p) => favoriteIds.includes(p.id)),
    [psychologists, favoriteIds]
  );

  const handleToggleFavorite = async (id: string) => {
    if (!user) return;

    try {
      await remove(ref(db, `favorites/${user.uid}/${id}`));

      setFavoriteIds((prev) => prev.filter((favId) => favId !== id));

      toast.success("Removed from favorites.");
    } catch {
      toast.error("Failed to update favorites.");
    }
  };

  if (favoritePsychologists.length === 0) {
    return (
      <p className={css.message}>You have no favorite psychologists yet.</p>
    );
  }

  return (
    <PsychologistsList
      psychologists={favoritePsychologists}
      favoriteIds={favoriteIds}
      onToggleFavorite={handleToggleFavorite}
    />
  );
}
