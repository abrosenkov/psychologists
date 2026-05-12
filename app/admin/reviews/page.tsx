"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { get, ref, remove, update } from "firebase/database";
import css from "./page.module.css";
import { recalculatePsychologistRating } from "@/lib/reviewRating";
import Loader from "@/components/Loader/Loader";
import Modal from "@/components/Modal/Modal";
import toast from "react-hot-toast";

interface ReviewItem {
  id: string;
  psychologistId: string;
  psychologistName: string;
  userName: string;
  rating: number;
  text: string;
  status: "pending" | "approved" | "rejected";
  createdAt: number;
}

type ReviewStatusFilter = "all" | ReviewItem["status"];
type ReviewSort = "newest" | "oldest" | "rating-desc" | "rating-asc" | "name";

export default function AdminReviewsPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<ReviewStatusFilter>("all");
  const [psychologistFilter, setPsychologistFilter] = useState("all");
  const [sort, setSort] = useState<ReviewSort>("newest");
  const [query, setQuery] = useState("");
  const [reviewToDelete, setReviewToDelete] = useState<ReviewItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
            createdAt: current.createdAt || 0,
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

  const deleteReview = async () => {
    if (!reviewToDelete) return;

    setIsDeleting(true);

    try {
      await remove(
        ref(
          db,
          `psychologists/${reviewToDelete.psychologistId}/reviews/${reviewToDelete.id}`
        )
      );

      await recalculatePsychologistRating(reviewToDelete.psychologistId);

      setItems((prev) =>
        prev.filter(
          (item) =>
            !(
              item.id === reviewToDelete.id &&
              item.psychologistId === reviewToDelete.psychologistId
            )
        )
      );
      setReviewToDelete(null);
      toast.success("Review deleted.");
    } catch {
      toast.error("Failed to delete review.");
    } finally {
      setIsDeleting(false);
    }
  };

  const psychologistOptions = useMemo(
    () =>
      Array.from(
        new Map(
          items.map((item) => [
            item.psychologistId,
            {
              id: item.psychologistId,
              name: item.psychologistName,
            },
          ])
        ).values()
      ).sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return items
      .filter((item) => {
        if (statusFilter !== "all" && item.status !== statusFilter) {
          return false;
        }

        if (
          psychologistFilter !== "all" &&
          item.psychologistId !== psychologistFilter
        ) {
          return false;
        }

        if (!normalizedQuery) return true;

        return [
          item.userName,
          item.psychologistName,
          item.text,
          String(item.rating),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      })
      .sort((a, b) => {
        switch (sort) {
          case "oldest":
            return a.createdAt - b.createdAt;
          case "rating-desc":
            return b.rating - a.rating;
          case "rating-asc":
            return a.rating - b.rating;
          case "name":
            return a.psychologistName.localeCompare(b.psychologistName);
          case "newest":
          default:
            return b.createdAt - a.createdAt;
        }
      });
  }, [items, psychologistFilter, query, sort, statusFilter]);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className={css.wrapper}>
      <div className={css.topbar}>
        <div>
          <h1>Reviews</h1>
          <p>Moderate user feedback</p>
        </div>
      </div>

      <section className={css.controls} aria-label="Review filters">
        <div className={css.searchBox}>
          <span>Search</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, psychologist, review text"
          />
        </div>

        <div className={css.filterGroup}>
          <span>Status</span>
          <div className={css.statusFilters}>
            {["all", "pending", "approved", "rejected"].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status as ReviewStatusFilter)}
                className={
                  statusFilter === status ? css.activeFilter : css.filterBtn
                }
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <label className={css.controlField}>
          Psychologist
          <select
            value={psychologistFilter}
            onChange={(event) => setPsychologistFilter(event.target.value)}
          >
            <option value="all">All psychologists</option>
            {psychologistOptions.map((psychologist) => (
              <option key={psychologist.id} value={psychologist.id}>
                {psychologist.name}
              </option>
            ))}
          </select>
        </label>

        <label className={css.controlField}>
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as ReviewSort)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="rating-desc">Highest rating</option>
            <option value="rating-asc">Lowest rating</option>
            <option value="name">Psychologist name</option>
          </select>
        </label>
      </section>

      <div className={css.list}>
        {visibleItems.length === 0 && (
          <div className={css.emptyState}>No reviews match these filters.</div>
        )}

        {visibleItems.map((item) => (
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

              <button
                type="button"
                onClick={() => setReviewToDelete(item)}
                className={css.deleteBtn}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        isOpen={Boolean(reviewToDelete)}
        onCloseModal={() => !isDeleting && setReviewToDelete(null)}
      >
        <div className={css.confirmModal}>
          <h2>Delete review?</h2>
          <p>
            This will permanently remove the review from{" "}
            {reviewToDelete?.psychologistName}.
          </p>

          <div className={css.confirmActions}>
            <button
              type="button"
              className={css.deleteConfirmBtn}
              onClick={deleteReview}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>

            <button
              type="button"
              className={css.cancelBtn}
              onClick={() => setReviewToDelete(null)}
              disabled={isDeleting}
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
