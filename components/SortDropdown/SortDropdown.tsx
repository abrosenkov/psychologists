"use client";

import { useState, useRef, useEffect, useId } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import styles from "./SortDropdown.module.css";

const options = [
  { type: "sort", value: "name-asc", label: "A to Z" },
  { type: "sort", value: "name-desc", label: "Z to A" },
  { type: "price", value: "lt10", label: "Less than 10$" },
  { type: "price", value: "gt10", label: "Greater than 10$" },
  { type: "rating", value: "popular", label: "Popular" },
  { type: "rating", value: "not-popular", label: "Not popular" },
  { type: "reset", value: "all", label: "Show all" },
] as const;

export default function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const listId = useId();

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

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);

  const handleSelect = (option: (typeof options)[number]) => {
    const params = new URLSearchParams(searchParams.toString());

    if (option.type === "reset") {
      params.delete("sort");
      params.delete("price");
      params.delete("rating");
    } else {
      params.delete("sort");
      params.delete("price");
      params.delete("rating");

      params.set(option.type, option.value);
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });

    setIsOpen(false);
  };

  const selectedParts: string[] = [];

  const priceLabel = options.find(
    (o) => o.type === "price" && o.value === currentPrice
  )?.label;

  if (priceLabel) selectedParts.push(priceLabel);

  if (currentRating === "popular") {
    selectedParts.push("Popular");
  } else if (currentRating === "not-popular") {
    selectedParts.push("Not popular");
  } else if (currentSort) {
    selectedParts.push(
      options.find((o) => o.type === "sort" && o.value === currentSort)
        ?.label || "A to Z"
    );
  }

  const selectedLabel = selectedParts.length
    ? selectedParts.join(" · ")
    : "A to Z";

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <span className={styles.labelTitle}>Filters</span>

      <button
        type="button"
        className={styles.selectHeader}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-controls={listId}
        aria-label={`Filters, current: ${selectedLabel}`}
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
      </button>

      <ul
        id={listId}
        role="listbox"
        aria-label="Filter options"
        className={`${styles.dropdown} ${isOpen ? styles.dropdownVisible : ""}`}
      >
        {options.map((opt) => {
          const isActive =
            (opt.type === "sort" && opt.value === currentSort) ||
            (opt.type === "price" && opt.value === currentPrice) ||
            (opt.type === "rating" && opt.value === currentRating);

          return (
            <li
              key={`${opt.type}-${opt.value}`}
              role="option"
              aria-selected={isActive}
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
