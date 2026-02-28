"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SortDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get("sort") || "name-asc";
  const limit = searchParams.get("limit") || 3;

  const handleChange = (e) => {
    const newSort = e.target.value;

    const params = new URLSearchParams(searchParams);
    params.set("sort", newSort);
    params.set("limit", limit);

    router.replace(`/psychologists?${params.toString()}`);
    router.refresh();
  };

  return (
    <select value={currentSort} onChange={handleChange}>
      <option value="name-asc">A to Z</option>
      <option value="name-desc">Z to A</option>
      <option value="price-asc">Price ↑</option>
      <option value="price-desc">Price ↓</option>
      <option value="rating-desc">Popular</option>
      <option value="rating-asc">Not popular</option>
    </select>
  );
}