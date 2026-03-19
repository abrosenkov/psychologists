"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./SortDropdown.module.css";

const options = [
  { type: "sort", value: "name-asc", label: "A to Z" },
  { type: "sort", value: "name-desc", label: "Z to A" },
  { type: "price", value: "lt10", label: "Less than 10$" },
  { type: "price", value: "gt10", label: "Greater than 10$" },
  { type: "rating", value: "popular", label: "Popular" },
  { type: "rating", value: "not-popular", label: "Not popular" },
  { type: "reset", value: "all", label: "Show all" },
];

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const currentSort = searchParams.get("sort");
  const currentPrice = searchParams.get("price");
  const currentRating = searchParams.get("rating");

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (option: (typeof options)[number]) => {
    const params = new URLSearchParams(searchParams.toString());
    const limit = searchParams.get("limit") || "3";

    params.delete("sort");
    params.delete("price");
    params.delete("rating");

    if (option.type !== "reset") {
      params.set(option.type, option.value);
    }

    params.set("limit", limit);

    router.replace(`?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const activeOption =
    options.find((o) => o.type === "price" && o.value === currentPrice) ||
    options.find((o) => o.type === "rating" && o.value === currentRating) ||
    options.find((o) => o.type === "sort" && o.value === currentSort) ||
    options.find((o) => o.type === "sort" && o.value === "name-asc");

  const selectedLabel = activeOption?.label || "Filters";

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <span className={styles.labelTitle}>Filters</span>

      <div
        className={styles.selectHeader}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedLabel}
        <span className={`${styles.arrow} ${isOpen ? styles.arrowRotate : ""}`}>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path
              d="M1 1.5L6 6.5L11 1.5"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <ul className={`${styles.dropdown} ${isOpen ? styles.dropdownVisible : ""}`}>
        {options.map((opt) => {
          const isActive =
            (opt.type === "sort" && opt.value === currentSort) ||
            (opt.type === "price" && opt.value === currentPrice) ||
            (opt.type === "rating" && opt.value === currentRating) ||
            (!currentSort &&
              !currentPrice &&
              !currentRating &&
              opt.type === "sort" &&
              opt.value === "name-asc");

          return (
            <li
              key={`${opt.type}-${opt.value}`}
              className={`${styles.option} ${isActive ? styles.selected : ""}`}
              onClick={() => handleSelect(opt)}
            >
              {opt.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}