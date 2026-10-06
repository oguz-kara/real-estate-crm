// Stage-based staleness thresholds in days (Pipedrive-style per-stage
// rotting; defaults follow the 3/7/30 real-estate cadence). Edit here to
// retune the office's rhythm — the sweeper reads only this map.
export const FOLLOW_UP_THRESHOLD_DAYS: Record<string, number> = {
  SICAK: 3,
  ILIK: 7,
  UZUN_VADELI: 30,
};

export type FollowUpStatus = 'TAKIPTE' | 'VADESI_GELDI' | 'GECIKMIS';
