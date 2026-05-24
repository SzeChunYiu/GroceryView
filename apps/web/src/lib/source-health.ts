export type SourceHealthStatus = "healthy" | "watch" | "breach";

export type SourceHealthMetric = {
  label: string;
  value: number;
  target: number;
  unit: "%" | "hours";
  direction: "at-least" | "at-most";
};

export type SourceHealth = {
  source: string;
  owner: string;
  cadence: string;
  coverage: SourceHealthMetric;
  freshness: SourceHealthMetric;
  successRate: SourceHealthMetric;
};

export const sourceHealthSla: SourceHealth[] = [
  {
    source: "Retailer catalogs",
    owner: "Ingestion Ops",
    cadence: "Hourly",
    coverage: {
      label: "Catalog coverage",
      value: 96.8,
      target: 95,
      unit: "%",
      direction: "at-least",
    },
    freshness: {
      label: "Median freshness",
      value: 1.4,
      target: 2,
      unit: "hours",
      direction: "at-most",
    },
    successRate: {
      label: "Ingestion success",
      value: 99.1,
      target: 98,
      unit: "%",
      direction: "at-least",
    },
  },
  {
    source: "Store inventory",
    owner: "Ingestion Ops",
    cadence: "Every 30 minutes",
    coverage: {
      label: "Store coverage",
      value: 94.2,
      target: 96,
      unit: "%",
      direction: "at-least",
    },
    freshness: {
      label: "Median freshness",
      value: 2.6,
      target: 2,
      unit: "hours",
      direction: "at-most",
    },
    successRate: {
      label: "Ingestion success",
      value: 97.4,
      target: 98,
      unit: "%",
      direction: "at-least",
    },
  },
  {
    source: "Price feeds",
    owner: "Pricing Data",
    cadence: "Hourly",
    coverage: {
      label: "Price coverage",
      value: 98.5,
      target: 97,
      unit: "%",
      direction: "at-least",
    },
    freshness: {
      label: "Median freshness",
      value: 0.9,
      target: 2,
      unit: "hours",
      direction: "at-most",
    },
    successRate: {
      label: "Ingestion success",
      value: 99.4,
      target: 98,
      unit: "%",
      direction: "at-least",
    },
  },
  {
    source: "Promotion feeds",
    owner: "Merchandising Data",
    cadence: "Daily",
    coverage: {
      label: "Promotion coverage",
      value: 92.7,
      target: 90,
      unit: "%",
      direction: "at-least",
    },
    freshness: {
      label: "Median freshness",
      value: 14.5,
      target: 24,
      unit: "hours",
      direction: "at-most",
    },
    successRate: {
      label: "Ingestion success",
      value: 98.2,
      target: 97,
      unit: "%",
      direction: "at-least",
    },
  },
];

export function isMetricMeetingTarget(metric: SourceHealthMetric): boolean {
  return metric.direction === "at-least"
    ? metric.value >= metric.target
    : metric.value <= metric.target;
}

export function getSourceHealthStatus(source: SourceHealth): SourceHealthStatus {
  const passingMetrics = [source.coverage, source.freshness, source.successRate].filter(
    isMetricMeetingTarget,
  ).length;

  if (passingMetrics === 3) {
    return "healthy";
  }

  return passingMetrics === 2 ? "watch" : "breach";
}

export function getSlaSummary(sources: SourceHealth[] = sourceHealthSla) {
  const healthy = sources.filter((source) => getSourceHealthStatus(source) === "healthy").length;
  const watch = sources.filter((source) => getSourceHealthStatus(source) === "watch").length;
  const breach = sources.filter((source) => getSourceHealthStatus(source) === "breach").length;

  return {
    total: sources.length,
    healthy,
    watch,
    breach,
  };
}

export function formatMetricValue(metric: SourceHealthMetric): string {
  const value = Number.isInteger(metric.value) ? metric.value.toFixed(0) : metric.value.toFixed(1);
  return metric.unit === "%" ? `${value}%` : `${value}h`;
}
