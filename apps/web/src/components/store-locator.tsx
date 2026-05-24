const storeDistanceFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
  style: 'unit',
  unit: 'kilometer',
  unitDisplay: 'long',
});

export function formatStoreDistanceCopy(distanceKm: number): string {
  return `${storeDistanceFormatter.format(Math.max(0, distanceKm))} from Stockholm center`;
}
