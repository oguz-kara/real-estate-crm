import {
  FOLLOW_UP_THRESHOLD_DAYS,
  type FollowUpStatus,
} from 'src/constants/follow-up-thresholds';

const DAY_MS = 86_400_000;

// null means "not tracked": the sweeper skips the person, clearing any
// stale status so un-enrolled people leave the follow-up view
export const computeFollowUpStatus = (input: {
  stage: string | null;
  lastTouchedAt: string | null;
  now: number;
}): FollowUpStatus | null => {
  const thresholdDays =
    input.stage === null ? undefined : FOLLOW_UP_THRESHOLD_DAYS[input.stage];

  if (thresholdDays === undefined) {
    return null;
  }

  if (input.lastTouchedAt === null) {
    return 'VADESI_GELDI';
  }

  const daysSinceTouch = Math.floor(
    (input.now - Date.parse(input.lastTouchedAt)) / DAY_MS,
  );

  if (daysSinceTouch < thresholdDays) {
    return 'TAKIPTE';
  }
  if (daysSinceTouch < thresholdDays * 2) {
    return 'VADESI_GELDI';
  }

  return 'GECIKMIS';
};
