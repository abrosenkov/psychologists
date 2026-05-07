"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { get, ref } from "firebase/database";
import Loader from "@/components/Loader/Loader";
import css from "./page.module.css";

interface Stats {
  psychologists: number;
  bookings: number;
  users: number;
  favorites: number;
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    psychologists: 0,
    bookings: 0,
    users: 0,
    favorites: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [psychologistsSnap, bookingsSnap, usersSnap, favoritesSnap] =
        await Promise.all([
          get(ref(db, "psychologists")),
          get(ref(db, "appointments")),
          get(ref(db, "users")),
          get(ref(db, "favorites")),
        ]);

      const psychologists = psychologistsSnap.exists()
        ? Object.keys(psychologistsSnap.val()).length
        : 0;

      const bookings = bookingsSnap.exists()
        ? Object.keys(bookingsSnap.val()).length
        : 0;

      const users = usersSnap.exists()
        ? Object.keys(usersSnap.val()).length
        : 0;

      let favorites = 0;

      if (favoritesSnap.exists()) {
        const data = favoritesSnap.val();

        Object.values(data).forEach((userFavs) => {
          favorites += Object.keys(userFavs as object).length;
        });
      }

      setStats({
        psychologists,
        bookings,
        users,
        favorites,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={css.wrapper}>
      <div className={css.topbar}>
        <div>
          <h1>Dashboard</h1>
          <p>Admin statistics overview</p>
        </div>
      </div>

      <div className={css.grid}>
        <div className={css.card}>
          <span>Total psychologists</span>
          <strong>{stats.psychologists}</strong>
        </div>

        <div className={css.card}>
          <span>Total bookings</span>
          <strong>{stats.bookings}</strong>
        </div>

        <div className={css.card}>
          <span>Total users</span>
          <strong>{stats.users}</strong>
        </div>

        <div className={css.card}>
          <span>Total favorites</span>
          <strong>{stats.favorites}</strong>
        </div>
      </div>
    </div>
  );
}
