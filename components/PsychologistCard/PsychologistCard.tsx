"use client";

import { useState } from "react";
import clsx from "clsx";
import css from "./PsychologistCard.module.css";
import Image from "next/image";
import { FaHeart, FaStar, FaRegHeart } from "react-icons/fa";
import { Button } from "../UI/Button/Button";

interface Review {
  reviewer: string;
  rating: number;
  comment: string;
}

interface Psychologist {
  id: string;
  name: string;
  avatar_url: string;
  specialization: string;
  experience: string;
  license: string;
  rating: number;
  price_per_hour: number;
  initial_consultation: string;
  about: string;
  reviews: Review[];
}

interface PsychologistCardProps {
  psychologist: Psychologist;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function PsychologistCard({
  psychologist,
  isFavorite,
  onToggleFavorite,
}: PsychologistCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={css.card}>
      <div className={css.avatarWrapper}>
        <div className={css.avatar}>
          <Image
            className={css.avatarImage}
            src={psychologist.avatar_url}
            alt={psychologist.name}
            width={96}
            height={96}
          />
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
                <span>Rating: {psychologist.rating}</span>
              </div>
              <span className={css.metaSeparator}>|</span>
              <div className={css.metaPrice}>
                Price / 1 hour:{" "}
                <span className={css.priceValue}>
                  {psychologist.price_per_hour}$
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

        <div className={css.tags}>
          <div className={css.tag}>
            <span>Experience:</span> {psychologist.experience}
          </div>
          <div className={css.tag}>
            <span>License:</span> {psychologist.license}
          </div>
          <div className={css.tag}>
            <span>Specialization:</span> {psychologist.specialization}
          </div>
          <div className={css.tag}>
            <span>Initial_consultation:</span>
            {psychologist.initial_consultation}
          </div>
        </div>

        <p className={css.aboutText}>{psychologist.about}</p>

        {!expanded ? (
          <button className={css.readMore} onClick={() => setExpanded(true)}>
            Read more
          </button>
        ) : (
          <div className={css.expandedContent}>
            <div className={css.reviewsList}>
              {psychologist.reviews?.map((review, index) => {
                const authorName = review.reviewer || "Guest";
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
                    <p className={css.reviewText}>{review.comment}</p>
                  </div>
                );
              })}
            </div>

            <Button className={css.appointmentBtn} type="button">
              Make an appointment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
