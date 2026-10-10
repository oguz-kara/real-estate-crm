import {
  FRESHNESS_FLOOR_POINTS,
  FRESHNESS_TIERS,
  MATCH_SCORE_WEIGHTS,
  SUSPICIOUSLY_CHEAP_POINTS,
} from 'src/constants/match-scoring';
import { type MatchProperty, type MatchRequest } from 'src/matching/match-types';

const DAY_MS = 86_400_000;

export const scoreMatch = (
  request: MatchRequest,
  property: MatchProperty,
  now: number,
): number => {
  let score = 0;

  if (request.features === null || request.features.length === 0) {
    score += MATCH_SCORE_WEIGHTS.features;
  } else {
    const covered = request.features.filter((feature) =>
      property.amenities.includes(feature),
    ).length;
    score += (covered / request.features.length) * MATCH_SCORE_WEIGHTS.features;
  }

  if (request.sqmNetMin === null) {
    score += MATCH_SCORE_WEIGHTS.sqm;
  } else if (property.sqmNet !== null) {
    const ratio = Math.min(property.sqmNet / request.sqmNetMin, 1);
    score += ratio * MATCH_SCORE_WEIGHTS.sqm;
  }

  if (
    request.budgetMinMicros === null ||
    (property.priceMicros !== null && property.priceMicros >= request.budgetMinMicros)
  ) {
    score += MATCH_SCORE_WEIGHTS.budget;
  } else {
    score += SUSPICIOUSLY_CHEAP_POINTS;
  }

  const ageDays = (now - Date.parse(property.createdAt)) / DAY_MS;
  const tier = FRESHNESS_TIERS.find((candidate) => ageDays <= candidate.maxDays);
  score += tier === undefined ? FRESHNESS_FLOOR_POINTS : tier.points;

  return Math.max(0, Math.min(100, Math.round(score)));
};
