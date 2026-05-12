import type { Psychologist, Review } from "@/types/psychologist";

/** Parses numbers from Firebase (strings, comma decimals). */
export function parseNumber(value: unknown): number | null {
  if (value === "" || value === undefined || value === null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const normalized = String(value).trim().replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Average of non-rejected reviews, with top-level `rating` as legacy fallback. */
export function getPsychologistRating(p: Psychologist): number | null {
  const reviews = p.reviews;

  if (reviews) {
    const reviewList: Review[] = Array.isArray(reviews)
      ? reviews
      : Object.values(reviews);

    let sum = 0;
    let count = 0;
    for (const r of reviewList) {
      if (r.status === "rejected") continue;

      const x = parseNumber(r.rating);
      if (x !== null) {
        sum += x;
        count += 1;
      }
    }

    if (count > 0) return Math.round((sum / count) * 10) / 10;
  }

  return parseNumber(p.rating);
}

export function getPsychologistPrice(p: Psychologist): number | null {
  return parseNumber(p.price_per_hour);
}

export function filterPsychologists(
  psychologists: Psychologist[],
  filters: { price?: string; rating?: string }
): Psychologist[] {
  let filtered = [...psychologists];

  if (filters.price === "lt10") {
    filtered = filtered.filter((p) => {
      const price = getPsychologistPrice(p);
      return price !== null && price < 10;
    });
  }

  if (filters.price === "gt10") {
    filtered = filtered.filter((p) => {
      const price = getPsychologistPrice(p);
      return price !== null && price >= 10;
    });
  }

  if (filters.rating === "popular") {
    filtered = filtered.filter((p) => {
      const r = getPsychologistRating(p);
      return r !== null && r >= 4.5;
    });
  }

  if (filters.rating === "not-popular") {
    filtered = filtered.filter((p) => {
      const r = getPsychologistRating(p);
      return r === null || r < 4.5;
    });
  }

  return filtered;
}

function compareByRating(
  a: Psychologist,
  b: Psychologist,
  desc: boolean
): number {
  const ra = getPsychologistRating(a);
  const rb = getPsychologistRating(b);
  const aNull = ra === null;
  const bNull = rb === null;
  if (aNull && bNull) return a.name.localeCompare(b.name);
  if (aNull) return 1;
  if (bNull) return -1;
  const diff = desc ? rb - ra : ra - rb;
  if (diff !== 0) return diff;
  return a.name.localeCompare(b.name);
}

export function sortPsychologists(
  psychologists: Psychologist[],
  sort: string
): Psychologist[] {
  const sorted = [...psychologists];

  switch (sort) {
    case "name-asc":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "name-desc":
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case "rating-desc":
      sorted.sort((a, b) => compareByRating(a, b, true));
      break;
    case "rating-asc":
      sorted.sort((a, b) => compareByRating(a, b, false));
      break;
    default:
      break;
  }

  return sorted;
}

/** Catalog sort stays independent from active filters. */
export function sortKeyForListing(
  sortFromUrl: string | undefined,
  _ratingFilter: string | undefined
): string {
  return sortFromUrl && sortFromUrl !== "" ? sortFromUrl : "name-asc";
}
