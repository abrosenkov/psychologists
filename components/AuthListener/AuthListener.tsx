"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { ref, get } from "firebase/database";
import { useAuthStore } from "@/stores/useAuthStore";

export default function AuthListener() {
  const setUser = useAuthStore((state) => state.setUser);
  const setRole = useAuthStore((state) => state.setRole);
  const setLoading = useAuthStore((state) => state.setLoading);
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        logout();
        return;
      }

      try {
        setUser(user);

        const snapshot = await get(ref(db, `users/${user.uid}`));
        const data = snapshot.val();

        setRole(data?.role || "user");
      } catch {
        setRole("user");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setRole, setLoading, logout]);

  return null;
}
