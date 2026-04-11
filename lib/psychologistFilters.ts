import type { Psychologist } from "@/types/psychologist";

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

/** Top-level `rating` or average of `reviews[].rating` if missing/invalid. */
export function getPsychologistRating(p: Psychologist): number | null {
  const direct = parseNumber(p.rating);
  if (direct !== null) return direct;

  const reviews = p.reviews;
  if (!Array.isArray(reviews) || reviews.length === 0) return null;

  let sum = 0;
  let count = 0;
  for (const r of reviews) {
    const x = parseNumber(r.rating);
    if (x !== null) {
      sum += x;
      count += 1;
    }
  }
  return count > 0 ? sum / count : null;
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

export function sortPsychologists(psychologists: Psychologist[], sort: string): Psychologist[] {
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

/** Popular / not-popular filters imply sort by rating (high→low or low→high). */
export function sortKeyForListing(
  sortFromUrl: string | undefined,
  ratingFilter: string | undefined
): string {
  if (ratingFilter === "popular") return "rating-desc";
  if (ratingFilter === "not-popular") return "rating-asc";
  return sortFromUrl && sortFromUrl !== "" ? sortFromUrl : "name-asc";
}
