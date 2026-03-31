"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { db } from "@/lib/firebase";
import { onValue, ref, remove, set } from "firebase/database";
import toast from "react-hot-toast";
import PsychologistsList from "../PsychologistsList/PsychologistsList";
import { Psychologist } from "@/types/psychologist";

export default function PsychologistsListWrapper({
  psychologists,
}: {
  psychologists: Psychologist[];
}) {
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

        setFavoriteIds(Object.keys(snapshot.val()));
      },
      () => {
        toast.error("Failed to load favorites.");
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleToggleFavorite = async (id: string) => {
    if (!user) {
      toast.error("Login first");
      return;
    }

    const favoriteRef = ref(db, `favorites/${user.uid}/${id}`);
    const isFavorite = favoriteIds.includes(id);

    try {
      if (isFavorite) {
        await remove(favoriteRef);
        toast.success("Removed from favorites.");
      } else {
        await set(favoriteRef, true);
        toast.success("Added to favorites.");
      }
    } catch {
      toast.error("Failed to update favorites.");
    }
  };

  return (
    <PsychologistsList
      psychologists={psychologists}
      favoriteIds={favoriteIds}
      onToggleFavorite={handleToggleFavorite}
    />
  );
}
