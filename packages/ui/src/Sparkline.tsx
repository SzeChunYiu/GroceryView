export type SparklineProps = {
  ariaLabel: string;
  className?: string;
  height?: number;
  points: number[];
  stroke?: string;
  title?: string;
  width?: number;
};

function sparklinePath(points: number[], width: number, height: number) {
  if (points.length < 2) return null;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  return points
    .map((price, index) => {
      const x = (index / (points.length - 1)) * width;
      const y = height - ((price - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function Sparkline({
  ariaLabel,
  className = 'h-11 w-full overflow-visible motion-reduce:transition-none',
  height = 44,
  points,
  stroke = '#059669',
  title = ariaLabel,
  width = 160
}: Readonly<SparklineProps>) {
  const path = sparklinePath(points, width, height);

  if (!path) return null;

  return (
    <svg
      aria-label={ariaLabel}
      className={className}
      data-chart-motion="static"
      preserveAspectRatio="none"
      role="img"
      viewBox={`0 0 ${width} ${height}`}
    >
      <title>{title}</title>
      <path d={`M 0 ${height} L ${width} ${height}`} fill="none" stroke="#e2e8f0" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      <path d={path} fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
