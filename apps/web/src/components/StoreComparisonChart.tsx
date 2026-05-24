"use client";

import { useEffect, useMemo, useState } from "react";

type StoreComparisonDatum = {
  label: string;
  value: number;
  color: string;
};

function getThemeMode(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  const isDarkClass = document.documentElement.classList.contains("dark");
  const isDarkQuery = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isDarkClass || isDarkQuery ? "dark" : "light";
}

export function StoreComparisonChart({
  data,
  title = "Store comparison",
}: {
  data?: StoreComparisonDatum[];
  title?: string;
}) {
  const [themeMode, setThemeMode] = useState<"light" | "dark">(() => getThemeMode());
  const palette = themeMode === "dark"
    ? {
        border: "rgba(244, 244, 245, 0.16)",
        grid: "rgba(244, 244, 245, 0.08)",
        text: "#d4d4d8",
      }
    : {
        border: "rgba(82, 82, 91, 0.22)",
        grid: "rgba(82, 82, 91, 0.08)",
        text: "#52525b",
      };

  useEffect(() => {
    const updateTheme = () => setThemeMode(getThemeMode());
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    mediaQuery.addEventListener("change", updateTheme);

    updateTheme();
    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener("change", updateTheme);
    };
  }, []);

  const values = useMemo(() => data ?? [], [data]);
  const max = Math.max(1, ...values.map((item) => item.value));

  return (
    <section
      className="rounded-3xl border p-6"
      style={{
        borderColor: palette.border,
        background: themeMode === "dark" ? "#09090b" : "#fff",
      }}
      aria-label={title}
    >
      <h2 className="mb-4 text-xl font-semibold" style={{ color: palette.text }}>
        {title}
      </h2>
      <div className="space-y-3">
        {values.map((item) => (
          <div key={item.label} className="flex items-center gap-3">
            <span className="w-28 text-sm" style={{ color: palette.text }}>
              {item.label}
            </span>
            <div className="h-3 flex-1 rounded-full" style={{ background: themeMode === "dark" ? "#3f3f46" : "#e4e4e7" }}>
              <div
                className="h-3 rounded-full"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className="w-20 text-right text-sm" style={{ color: palette.text }}>
              {item.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t pt-3 text-xs" style={{ borderColor: palette.grid, color: palette.text }}>
        Axis and background colors follow theme preference.
      </div>
    </section>
  );
}
