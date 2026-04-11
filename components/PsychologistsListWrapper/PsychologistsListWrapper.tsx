"use client";

import { useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { useAuthStore } from "@/stores/useAuthStore";
import { db } from "@/lib/firebase";
import { onValue, ref, remove, set } from "firebase/database";
import toast from "react-hot-toast";
import PsychologistsList from "../PsychologistsList/PsychologistsList";
import { Psychologist } from "@/types/psychologist";

function PsychologistsListWithFavorites({
  user,
  psychologists,
}: {
  user: User;
  psychologists: Psychologist[];
}) {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  useEffect(() => {
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
  }, [user.uid]);

  const handleToggleFavorite = async (id: string) => {
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

export default function PsychologistsListWrapper({
  psychologists,
}: {
  psychologists: Psychologist[];
}) {
  const user = useAuthStore((state) => state.user);

  const handleGuestToggle = () => {
    toast.error("Login first");
  };

  if (!user) {
    return (
      <PsychologistsList
        psychologists={psychologists}
        favoriteIds={[]}
        onToggleFavorite={handleGuestToggle}
      />
    );
  }

  return (
    <PsychologistsListWithFavorites
      key={user.uid}
      user={user}
      psychologists={psychologists}
    />
  );
}
