"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { get, ref, update } from "firebase/database";
import css from "./page.module.css";

interface Booking {
  id: string;
  name: string;
  email: string;
  phone: string;
  psychologistName: string;
  date: string;
  time: string;
  comment?: string;
  status?: "pending" | "confirmed" | "cancelled";
}

export default function AdminBookingsPage() {
  const [items, setItems] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<
    "all" | "pending" | "confirmed" | "cancelled"
  >("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const [appointmentsSnap, psychologistsSnap] = await Promise.all([
        get(ref(db, "appointments")),
        get(ref(db, "psychologists")),
      ]);

      if (!appointmentsSnap.exists()) {
        setItems([]);
        return;
      }

      const appointmentsData = appointmentsSnap.val();
      const psychologistsData = psychologistsSnap.exists()
        ? psychologistsSnap.val()
        : {};

      const list = Object.entries(appointmentsData).map(([id, value]) => {
        const booking = value as any;

        return {
          id,
          ...booking,
          psychologistName:
            psychologistsData[booking.psychologistId]?.name || "Unknown",
        };
      });

      setItems(list.reverse());
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (
    id: string,
    status: "confirmed" | "cancelled"
  ) => {
    await update(ref(db, `appointments/${id}`), { status });

    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  const filteredItems =
    filter === "all"
      ? items
      : items.filter((item) => (item.status || "pending") === filter);

  if (loading) {
    return <p>Loading bookings...</p>;
  }

  return (
    <div className={css.wrapper}>
      <div className={css.topbar}>
        <div>
          <h1>Bookings</h1>
          <p>Manage client appointments</p>
        </div>

        <div className={css.filters}>
          {["all", "pending", "confirmed", "cancelled"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={filter === status ? css.activeFilter : css.filterBtn}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className={css.list}>
        {filteredItems.map((item) => {
          const currentStatus = item.status || "pending";

          return (
            <div key={item.id} className={css.card}>
              <div className={css.info}>
                <div className={css.headerRow}>
                  <h3>{item.name}</h3>

                  <span className={css[currentStatus]}>{currentStatus}</span>
                </div>

                <div className={css.meta}>
                  <span>{item.email}</span>
                  <span>{item.phone}</span>
                </div>

                <p>
                  <strong>Psychologist:</strong> {item.psychologistName}
                </p>

                <p>
                  <strong>Date:</strong> {item.date} at {item.time}
                </p>

                {item.comment && (
                  <p className={css.comment}>
                    <strong>Comment:</strong> {item.comment}
                  </p>
                )}
              </div>

              <div className={css.actions}>
                <button
                  onClick={() => changeStatus(item.id, "confirmed")}
                  className={css.confirmBtn}
                  disabled={currentStatus === "confirmed"}
                >
                  Confirm
                </button>

                <button
                  onClick={() => changeStatus(item.id, "cancelled")}
                  className={css.cancelBtn}
                  disabled={currentStatus === "cancelled"}
                >
                  Cancel
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
