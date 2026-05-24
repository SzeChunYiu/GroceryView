export type ReviewModerationScores = {
  confidenceScore: number;
  riskScore: number;
};

type ReviewAssignmentWithScores = {
  confidenceScore?: number;
  priority?: string;
  riskScore?: number;
  subjectType?: string;
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function formatModerationScore(score: number): string {
  return `${clampScore(score)}%`;
}

export function reviewAssignmentModerationScores(assignment: ReviewAssignmentWithScores): ReviewModerationScores {
  const priorityRisk = assignment.priority === 'urgent' ? 90 : assignment.priority === 'high' ? 75 : 45;
  const subjectConfidence = assignment.subjectType === 'community_report' ? 70 : 60;

  return {
    confidenceScore: clampScore(assignment.confidenceScore ?? subjectConfidence),
    riskScore: clampScore(assignment.riskScore ?? priorityRisk)
  };
}

export function moderationScoreSummary(scores: ReviewModerationScores): string {
  return `Risk score ${formatModerationScore(scores.riskScore)} · Confidence score ${formatModerationScore(scores.confidenceScore)}`;
}
