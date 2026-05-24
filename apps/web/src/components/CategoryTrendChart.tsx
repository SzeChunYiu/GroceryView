export type CategoryTrendPoint = {
  averagePrice: number;
  index: number;
  itemCount: number;
  month: string;
};

type CategoryTrendChartProps = {
  points: CategoryTrendPoint[];
};

export function CategoryTrendChart({ points }: CategoryTrendChartProps) {
  const width = 640;
  const height = 220;
  const padding = 28;
  const minIndex = Math.min(...points.map((point) => point.index));
  const maxIndex = Math.max(...points.map((point) => point.index));
  const indexRange = Math.max(1, maxIndex - minIndex);
  const xStep = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const coordinates = points.map((point, index) => {
    const x = padding + index * xStep;
    const y = height - padding - ((point.index - minIndex) / indexRange) * (height - padding * 2);

    return { ...point, x, y };
  });
  const linePoints = coordinates.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <div className="overflow-hidden rounded-3xl border border-cyan-100 bg-white shadow-sm">
      <svg aria-label="Six-month average category price index trend" className="h-auto w-full" role="img" viewBox={`0 0 ${width} ${height}`}>
        <polyline fill="none" points={linePoints} stroke="#0e7490" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4" />
        {coordinates.map((point) => (
          <g key={point.month}>
            <circle cx={point.x} cy={point.y} fill="#0891b2" r="5" />
            <text fill="#475569" fontSize="12" fontWeight="700" textAnchor="middle" x={point.x} y={height - 8}>
              {point.month}
            </text>
            <text fill="#0f172a" fontSize="12" fontWeight="900" textAnchor="middle" x={point.x} y={Math.max(14, point.y - 10)}>
              {point.index.toFixed(1)}
            </text>
          </g>
        ))}
      </svg>
      <div className="grid gap-2 border-t border-cyan-100 bg-cyan-50/60 p-4 text-xs font-bold text-cyan-950 sm:grid-cols-3">
        {points.slice(-3).map((point) => (
          <p key={point.month}>{point.month}: index {point.index.toFixed(1)} · avg {point.averagePrice.toFixed(2)} SEK · {point.itemCount} items</p>
        ))}
      </div>
    </div>
  );
}
