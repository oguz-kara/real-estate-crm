// Soft-score weights (sum 100). The office retunes priorities here only.
export const MATCH_SCORE_WEIGHTS = {
  features: 40,
  sqm: 25,
  budget: 20,
  freshness: 15,
} as const;

export const SUSPICIOUSLY_CHEAP_POINTS = 8;
export const FRESHNESS_TIERS = [
  { maxDays: 30, points: 15 },
  { maxDays: 90, points: 8 },
] as const;
export const FRESHNESS_FLOOR_POINTS = 3;
