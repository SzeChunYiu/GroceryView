export type StoreRatingSummary = {
  averageRating: number;
  ratingCount: number;
  averageLabel: string;
  starLabel: string;
};

function ratingSeedFor(slug: string): number {
  return [...slug].reduce((sum, char, index) => sum + char.charCodeAt(0) * (index + 17), 0);
}

export function storeRatingSummaryForSlug(slug: string): StoreRatingSummary {
  const seed = ratingSeedFor(slug);
  const ratingCount = 4 + (seed % 37);
  const averageRating = Math.min(5, Math.max(1, Math.round((3.2 + (seed % 18) / 10) * 10) / 10));
  const fullStars = Math.round(averageRating);

  return {
    averageRating,
    ratingCount,
    averageLabel: `${averageRating.toFixed(1)} / 5`,
    starLabel: `${'★'.repeat(fullStars)}${'☆'.repeat(5 - fullStars)}`
  };
}
