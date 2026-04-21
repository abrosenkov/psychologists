"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { ref, get, remove } from "firebase/database";
import css from "./page.module.css";

interface Psychologist {
  id: string;
  name: string;
  price_per_hour: number;
  rating: number;
  specialization: string;
}

export default function AdminPsychologistsPage() {
  const [items, setItems] = useState<Psychologist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPsychologists();
  }, []);

  const loadPsychologists = async () => {
    try {
      const snapshot = await get(ref(db, "psychologists"));

      if (!snapshot.exists()) {
        setItems([]);
        return;
      }

      const data = snapshot.val();

      const list = Object.entries(data).map(([id, value]) => ({
        id,
        ...(value as Omit<Psychologist, "id">),
      }));

      setItems(list);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("Delete psychologist?");

    if (!confirmed) return;

    await remove(ref(db, `psychologists/${id}`));

    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className={css.wrapper}>
      <div className={css.topbar}>
        <h1>Psychologists</h1>
      </div>

      <div className={css.table}>
        {items.map((item) => (
          <div key={item.id} className={css.row}>
            <div>
              <strong>{item.name}</strong>
              <p>{item.specialization}</p>
            </div>

            <div>${item.price_per_hour}</div>

            <div>{item.rating}</div>

            <button
              className={css.deleteBtn}
              onClick={() => handleDelete(item.id)}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}