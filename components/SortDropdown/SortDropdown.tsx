"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LuArrowDownUp, LuRotateCcw, LuSlidersHorizontal } from "react-icons/lu";
import styles from "./SortDropdown.module.css";

const sortOptions = [
  { value: "name-asc", label: "Name A-Z" },
  { value: "name-desc", label: "Name Z-A" },
  { value: "rating-desc", label: "Highest rating" },
  { value: "rating-asc", label: "Lowest rating" },
] as const;

const priceOptions = [
  { value: "all", label: "Any price" },
  { value: "lt10", label: "Under $10" },
  { value: "gt10", label: "$10 and up" },
] as const;

const ratingOptions = [
  { value: "all", label: "Any rating" },
  { value: "popular", label: "4.5+ rating" },
  { value: "not-popular", label: "Below 4.5" },
] as const;

export default function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "name-asc";
  const currentPrice = searchParams.get("price") || "all";
  const currentRating = searchParams.get("rating") || "all";
  const hasActiveFilters =
    currentSort !== "name-asc" ||
    currentPrice !== "all" ||
    currentRating !== "all";

  const updateParam = (key: "sort" | "price" | "rating", value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (
      (key === "sort" && value === "name-asc") ||
      ((key === "price" || key === "rating") && value === "all")
    ) {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    const query = params.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const resetFilters = () => {
    router.replace(pathname, { scroll: false });
  };

  return (
    <section className={styles.wrapper} aria-label="Catalog controls">
      <div className={styles.header}>
        <div className={styles.title}>
          <LuSlidersHorizontal aria-hidden="true" />
          <span>Filters</span>
        </div>

        <button
          type="button"
          className={styles.resetButton}
          onClick={resetFilters}
          disabled={!hasActiveFilters}
        >
          <LuRotateCcw aria-hidden="true" />
          Reset
        </button>
      </div>

      <div className={styles.controls}>
        <label className={styles.control}>
          <span>
            <LuArrowDownUp aria-hidden="true" />
            Sort by
          </span>
          <select
            value={currentSort}
            onChange={(event) => updateParam("sort", event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.control}>
          <span>Price</span>
          <select
            value={currentPrice}
            onChange={(event) => updateParam("price", event.target.value)}
          >
            {priceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.control}>
          <span>Rating</span>
          <select
            value={currentRating}
            onChange={(event) => updateParam("rating", event.target.value)}
          >
            {ratingOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}
