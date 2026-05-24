"use client";

import { useEffect, useMemo, useState } from "react";

type Point = number;

type SparklineProps = {
  points?: Point[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  showGrid?: boolean;
};

function getThemeMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const isDark = document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isDark ? "dark" : "light";
}

export function Sparkline({
  points = [10, 22, 14, 18, 25, 16, 30, 28, 33, 31, 24, 20, 27],
  width = 280,
  height = 56,
  strokeWidth = 2,
  showGrid = true,
}: SparklineProps) {
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => getThemeMode());

  useEffect(() => {
    const updateTheme = () => setThemeMode(getThemeMode());
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    mediaQuery.addEventListener("change", updateTheme);
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", updateTheme);
    };
  }, []);

  const colors = useMemo(
    () =>
      themeMode === "dark"
        ? {
            background: "#09090b",
            axis: "rgba(244, 244, 245, 0.24)",
            line: "#38bdf8",
            text: "#d4d4d8",
            grid: "rgba(244, 244, 245, 0.12)",
          }
        : {
            background: "#ffffff",
            axis: "rgba(82, 82, 91, 0.24)",
            line: "#0284c7",
            text: "#52525b",
            grid: "rgba(113, 113, 122, 0.12)",
          },
    [themeMode],
  );

  const pointsPath = useMemo(() => {
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = Math.max(1, max - min);

    const stepX = width / Math.max(1, points.length - 1);
    return points
      .map((point, index) => {
        const x = index * stepX;
        const y = height - ((point - min) / range) * height;
        return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [height, points, width]);

  const gridTicks = showGrid
    ? Array.from({ length: 4 }).map((_, index) => {
        const y = (height / 3) * index;
        return <line key={`grid-${index}`} x1={0} x2={width} y1={y} y2={y} stroke={colors.grid} strokeWidth={1} />;
      })
    : null;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Sparkline">
      <rect width={width} height={height} fill={colors.background} />
      {showGrid ? <g>{gridTicks}</g> : null}
      <line x1={0} y1={height - 1} x2={width} y2={height - 1} stroke={colors.axis} />
      <path d={pointsPath} fill="none" stroke={colors.line} strokeWidth={strokeWidth} strokeLinecap="round" />
      <text x={4} y={12} fill={colors.text} fontSize={10}>
        Sparkline
      </text>
    </svg>
  );
}
