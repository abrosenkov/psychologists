"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import clsx from "clsx";
import css from "./PsychologistCard.module.css";
import { FaHeart, FaStar, FaRegHeart, FaRegStar } from "react-icons/fa";
import { Button } from "../UI/Button/Button";
import { Psychologist } from "@/types/psychologist";
import AppointmentForm from "../AppointmentForm/AppointmentForm";
import Modal from "../Modal/Modal";
import { push, ref, set } from "firebase/database";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/useAuthStore";
import { recalculatePsychologistRating } from "@/lib/reviewRating";
import { getPsychologistRating } from "@/lib/psychologistFilters";
import toast from "react-hot-toast";

interface PsychologistCardProps {
  psychologist: Psychologist;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

function AvatarImage({ psychologist }: { psychologist: Psychologist }) {
  const normalizedSrc = psychologist.avatar_url?.trim() || "";
  const [failedSrc, setFailedSrc] = useState("");

  if (!normalizedSrc || failedSrc === normalizedSrc) {
    return (
      <div className={css.avatarPlaceholder}>
        {(psychologist.name.charAt(0) || "?").toUpperCase()}
      </div>
    );
  }

  return (
    <img
      className={css.avatarImage}
      src={normalizedSrc}
      alt={psychologist.name}
      onError={() => setFailedSrc(normalizedSrc)}
    />
  );
}

const getTextValue = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const getPriceLabel = (value: unknown) => {
  const price = Number(value);

  return Number.isFinite(price) ? `${price}$` : "On request";
};

export default function PsychologistCard({
  psychologist,
  isFavorite,
  onToggleFavorite,
}: PsychologistCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const [isReviewOpen, setIsReviewOpen] = useState(false);

  const [reviewForm, setReviewForm] = useState({
    rating: "5",
    comment: "",
  });

  const user = useAuthStore((state) => state.user);
  const rating = getPsychologistRating(psychologist) ?? 0;
  const characteristics = [
    { label: "Experience", value: getTextValue(psychologist.experience) },
    { label: "License", value: getTextValue(psychologist.license) },
    {
      label: "Specialization",
      value: getTextValue(psychologist.specialization),
    },
    {
      label: "Initial consultation",
      value: getTextValue(psychologist.initial_consultation),
    },
  ].filter((item) => item.value);
  const aboutText =
    getTextValue(psychologist.about) ||
    "Detailed profile information is not available yet.";

  const handleAppointmentOpen = () => {
    if (!user) {
      toast.error("Please log in or register to book an appointment.");
      return;
    }

    setIsOpen(true);
  };

  const handleReviewOpen = () => {
    if (!user) {
      toast.error("Please log in or register to leave a review.");
      return;
    }

    setIsReviewOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!user) {
      toast.error("Please log in or register to leave a review.");
      return;
    }

    const trimmedComment = reviewForm.comment.trim();

    if (!trimmedComment) {
      toast.error("Please write your review before submitting.");
      return;
    }

    const reviewRef = push(ref(db, `psychologists/${psychologist.id}/reviews`));

    await set(reviewRef, {
      userId: user.uid,
      userName: user?.displayName || user?.email || "Anonymous",
      rating: Number(reviewForm.rating),
      text: trimmedComment,
      status: "pending",
      createdAt: Date.now(),
    });

    await recalculatePsychologistRating(psychologist.id);

    setReviewForm({
      rating: "5",
      comment: "",
    });

    setIsReviewOpen(false);
    toast.success("Review sent for moderation.");
  };

  const approvedReviews = useMemo(
    () =>
      psychologist.reviews
        ? Object.values(psychologist.reviews).filter(
            (review) => review.status === "approved" || !review.status
          )
        : [],
    [psychologist.reviews]
  );

  return (
    <div className={css.card}>
      <div className={css.avatarWrapper}>
        <div className={css.avatar}>
          <AvatarImage psychologist={psychologist} />
          <div className={css.onlineBadge}></div>
        </div>
      </div>

      <div className={css.info}>
        <div className={css.cardHeader}>
          <div className={css.nameInfo}>
            <p className={css.nameSubTitle}>Psychologist</p>
            <h3 className={css.name}>{psychologist.name}</h3>
          </div>

          <div className={css.metaInfo}>
            <div className={css.meta}>
              <div className={css.metaRating}>
                <FaStar className={css.starIcon} size={16} />
                <span>Rating: {rating}</span>
              </div>
              <span className={css.metaSeparator}>|</span>
              <div className={css.metaPrice}>
                Price / 1 hour:{" "}
                <span className={css.priceValue}>
                  {getPriceLabel(psychologist.price_per_hour)}
                </span>
              </div>
            </div>
            <button
              type="button"
              className={clsx(
                css.favoriteButton,
                isFavorite && css.favoriteActive
              )}
              onClick={onToggleFavorite}
            >
              {isFavorite ? <FaHeart size={26} /> : <FaRegHeart size={26} />}
            </button>
          </div>
        </div>

        {characteristics.length > 0 && (
          <div className={css.tags}>
            {characteristics.map((item) => (
              <div className={css.tag} key={item.label}>
                <span>{item.label}:</span> {item.value}
              </div>
            ))}
          </div>
        )}

        <p className={css.aboutText}>{aboutText}</p>

        {!expanded ? (
          <button className={css.readMore} onClick={() => setExpanded(true)}>
            Read more
          </button>
        ) : (
          <div className={css.expandedContent}>
            <div className={css.reviewsList}>
              {approvedReviews.map((review, index) => {
                const authorName =
                  review.userName || review.reviewer || "Guest";
                const reviewText = review.text || review.comment || "";
                return (
                  <div key={index} className={css.reviewItem}>
                    <div className={css.reviewHeader}>
                      <div className={css.reviewAvatar}>
                        {(authorName[0] || "G").toUpperCase()}
                      </div>
                      <div className={css.reviewInfo}>
                        <p className={css.reviewerName}>{authorName}</p>
                        <div className={css.reviewRating}>
                          <FaStar className={css.starIcon} size={16} />
                          <span>{review.rating}</span>
                        </div>
                      </div>
                    </div>
                    <p className={css.reviewText}>{reviewText}</p>
                  </div>
                );
              })}
            </div>

            <Button
              onClick={handleAppointmentOpen}
              className={css.appointmentBtn}
              type="button"
            >
              Make an appointment
            </Button>
            <Button
              onClick={handleReviewOpen}
              className={css.reviewBtn}
              type="button"
            >
              Leave review
            </Button>
            <Modal isOpen={isOpen} onCloseModal={() => setIsOpen(false)}>
              <AppointmentForm
                onClose={() => setIsOpen(false)}
                psychologist={psychologist}
              />
            </Modal>
            <Modal
              isOpen={isReviewOpen}
              onCloseModal={() => setIsReviewOpen(false)}
            >
              <div className={css.reviewModal}>
                <h2>Leave review</h2>

                <div className={css.ratingPicker} role="radiogroup" aria-label="Rating">
                  {[1, 2, 3, 4, 5].map((value) => {
                    const isSelected = Number(reviewForm.rating) >= value;

                    return (
                      <button
                        key={value}
                        type="button"
                        className={css.ratingStarButton}
                        aria-label={`${value} star${value > 1 ? "s" : ""}`}
                        aria-checked={Number(reviewForm.rating) === value}
                        role="radio"
                        onClick={() =>
                          setReviewForm({
                            ...reviewForm,
                            rating: String(value),
                          })
                        }
                      >
                        {isSelected ? <FaStar /> : <FaRegStar />}
                      </button>
                    );
                  })}
                  <span className={css.ratingLabel}>{reviewForm.rating}/5</span>
                </div>

                <textarea
                  placeholder="Your review"
                  value={reviewForm.comment}
                  onChange={(e) =>
                    setReviewForm({
                      ...reviewForm,
                      comment: e.target.value,
                    })
                  }
                />

                <Button onClick={handleReviewSubmit} type="button">
                  Submit
                </Button>
              </div>
            </Modal>
          </div>
        )}
      </div>
    </div>
  );
}
