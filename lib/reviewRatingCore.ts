import type { Review } from "@/types/psychologist";
import { parseNumber } from "@/lib/psychologistFilters";

type ReviewsValue = Record<string, Review> | Review[] | null | undefined;

export function getRatingReviews(reviews: ReviewsValue): Review[] {
  if (!reviews) return [];

  const reviewList = Array.isArray(reviews) ? reviews : Object.values(reviews);

  return reviewList.filter((review) => review.status !== "rejected");
}

export function calculateReviewsRating(reviews: ReviewsValue): number | null {
  const ratingReviews = getRatingReviews(reviews);

  let sum = 0;
  let count = 0;

  for (const review of ratingReviews) {
    const rating = parseNumber(review.rating);

    if (rating !== null) {
      sum += rating;
      count += 1;
    }
  }

  if (count === 0) return null;

  return Math.round((sum / count) * 10) / 10;
}
