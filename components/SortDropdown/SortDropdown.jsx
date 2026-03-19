"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styles from "./SortDropdown.module.css";

const options = [
  { value: "name-asc", label: "A to Z" },
  { value: "name-desc", label: "Z to A" },
  { value: "price-asc", label: "Less than 10$" },
  { value: "price-desc", label: "Greater than 10$" },
  { value: "rating-desc", label: "Popular" },
  { value: "rating-asc", label: "Not popular" },
  { value: "all", label: "Show all" },
];

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  const currentSort = searchParams.get("sort") || "name-asc";
  const limit = searchParams.get("limit") || 3;

  useEffect(() => {
    const handleClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (newSort) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", newSort);
    params.set("limit", limit);

    router.replace(`/psychologists?${params.toString()}`, { scroll: false });
    setIsOpen(false);
  };

  const selectedLabel = options.find((o) => o.value === currentSort)?.label || "Filters";

  return (
    <div className={styles.wrapper} ref={rootRef}>
      <span className={styles.labelTitle}>Filters</span>
      
      <div 
        className={`${styles.selectHeader} ${isOpen ? styles.activeHeader : ""}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {selectedLabel}
        <span className={`${styles.arrow} ${isOpen ? styles.arrowRotate : ""}`}>
          <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </div>

      {isOpen && (
        <ul className={styles.dropdown}>
          {options.map((opt) => (
            <li
              key={opt.value}
              className={`${styles.option} ${currentSort === opt.value ? styles.selected : ""}`}
              onClick={() => handleSelect(opt.value)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}