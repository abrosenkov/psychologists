"use client";

import { useState } from "react";
import clsx from "clsx";
import css from "./PsychologistCard.module.css";
import Image from "next/image";
import { FaHeart, FaStar, FaRegHeart } from "react-icons/fa";

interface Psychologist {
  id: string;
  name: string;
  avatar_url: string;
  specialization: string;
  experience: number;
  license: string;
  rating: number;
  price_per_hour: number;
  initial_consultation: string;
  about: string;
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
      <div className={css.metaInfo}>
        <div className={css.meta}>
          <FaStar className={css.starIcon} size={16} /> Rating:{" "}
          {psychologist.rating} | Price / 1 hour:{" "}
          <span>${psychologist.price_per_hour}</span>
        </div>
        <button
          type="button"
          className={clsx(css.favoriteButton, isFavorite && css.favoriteActive)}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          onClick={onToggleFavorite}
        >
          {isFavorite ? <FaHeart size={26} /> : <FaRegHeart size={26} />}
        </button>
      </div>
      <div className={css.avatar}>
        <Image
          className={css.avatarImage}
          src={psychologist.avatar_url}
          alt={psychologist.name}
          width={96}
          height={96}
        />
      </div>

      <div className={css.info}>
        <div className={css.nameInfo}>
          <p className={css.nameSubTitle}>Psychologist</p>
          <h3 className={css.name}>{psychologist.name}</h3>
        </div>

        <div className={css.tags}>
          <span>Experience: {psychologist.experience} years</span>
          <span>License: {psychologist.license}</span>
          <span>Specialization: {psychologist.specialization}</span>
        </div>

        <p className={expanded ? css.fullText : css.shortText}>
          {psychologist.about}
        </p>

        <button
          className={css.readMore}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? "Read less" : "Read more"}
        </button>

        {expanded && (
          <div className={css.extra}>
            <p>Initial consultation: {psychologist.initial_consultation}</p>
          </div>
        )}
      </div>
    </div>
  );
}
