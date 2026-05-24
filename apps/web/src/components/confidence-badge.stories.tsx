import { ConfidenceBadge } from "./confidence-badge";

const meta = {
  title: "Components/ConfidenceBadge",
  component: ConfidenceBadge,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    level: {
      control: "select",
      options: ["high", "medium", "low"],
    },
  },
};

export default meta;

export const Default = {
  args: {
    level: "medium",
    label: "Medium confidence",
  },
};

export const WithData = {
  args: {
    level: "high",
    label: "High confidence",
    sampleSize: 42,
  },
};

export const EdgeCase = {
  args: {
    level: "low",
    label: "Limited evidence",
    sampleSize: 0,
  },
};
