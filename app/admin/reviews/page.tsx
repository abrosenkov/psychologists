"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { get, ref, update } from "firebase/database";
import css from "./page.module.css";
import { recalculatePsychologistRating } from "@/lib/reviewRating";

interface ReviewItem {
  id: string;
  psychologistId: string;
  psychologistName: string;
  userName: string;
  rating: number;
  text: string;
  status: "pending" | "approved" | "rejected";
}

export default function AdminReviewsPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();
  }, []);

  const loadReviews = async () => {
    try {
      const snapshot = await get(ref(db, "psychologists"));

      if (!snapshot.exists()) {
        setItems([]);
        return;
      }

      const data = snapshot.val();
      const reviews: ReviewItem[] = [];

      Object.entries(data).forEach(([psychologistId, psychologist]) => {
        const psy = psychologist as any;

        if (!psy.reviews) return;

        Object.entries(psy.reviews).forEach(([reviewId, review]) => {
          const current = review as any;

          reviews.push({
            id: reviewId,
            psychologistId,
            psychologistName: psy.name,
            userName: current.userName || current.reviewer || "Anonymous",
            rating: current.rating || 5,
            text: current.text || current.comment || "",
            status: current.status || "approved",
          });
        });
      });

      setItems(reviews.reverse());
    } finally {
      setLoading(false);
    }
  };

  const changeReviewStatus = async (
    psychologistId: string,
    reviewId: string,
    status: "approved" | "rejected"
  ) => {
    await update(
      ref(db, `psychologists/${psychologistId}/reviews/${reviewId}`),
      { status }
    );

    await recalculatePsychologistRating(psychologistId);

    setItems((prev) =>
      prev.map((item) =>
        item.id === reviewId && item.psychologistId === psychologistId
          ? { ...item, status }
          : item
      )
    );
  };

  if (loading) {
    return <p>Loading reviews...</p>;
  }

  return (
    <div className={css.wrapper}>
      <div className={css.topbar}>
        <div>
          <h1>Reviews</h1>
          <p>Moderate user feedback</p>
        </div>
      </div>

      <div className={css.list}>
        {items.map((item) => (
          <div key={item.psychologistId + item.id} className={css.card}>
            <div className={css.info}>
              <div className={css.headerRow}>
                <h3>{item.userName}</h3>
                <span className={css[item.status]}>{item.status}</span>
              </div>

              <p>
                <strong>Psychologist:</strong> {item.psychologistName}
              </p>

              <p>
                <strong>Rating:</strong> ⭐{item.rating}
              </p>

              <p className={css.text}>{item.text}</p>
            </div>

            <div className={css.actions}>
              <button
                onClick={() =>
                  changeReviewStatus(item.psychologistId, item.id, "approved")
                }
                className={css.approveBtn}
                disabled={item.status === "approved"}
              >
                Approve
              </button>

              <button
                onClick={() =>
                  changeReviewStatus(item.psychologistId, item.id, "rejected")
                }
                className={css.rejectBtn}
                disabled={item.status === "rejected"}
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
