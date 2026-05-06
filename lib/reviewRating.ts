import { get, ref, update } from "firebase/database";
import { db } from "@/lib/firebase";
import { calculateReviewsRating } from "@/lib/reviewRatingCore";

export async function recalculatePsychologistRating(
  psychologistId: string
): Promise<number | null> {
  const snapshot = await get(ref(db, `psychologists/${psychologistId}/reviews`));
  const nextRating = calculateReviewsRating(snapshot.val());

  await update(ref(db, `psychologists/${psychologistId}`), {
    rating: nextRating ?? 0,
  });

  return nextRating;
}
