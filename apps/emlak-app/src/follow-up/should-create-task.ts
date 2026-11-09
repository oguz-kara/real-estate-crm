import { type FollowUpStatus } from 'src/constants/follow-up-thresholds';

// One task per lapse cycle: the marker records the last task's creation
// time, and only a touch newer than the marker re-arms creation.
export const shouldCreateTask = (input: {
  nextStatus: FollowUpStatus | null;
  lastTouchedAt: string | null;
  taskMarker: string | null;
}): boolean => {
  if (input.nextStatus !== 'VADESI_GELDI' && input.nextStatus !== 'GECIKMIS') {
    return false;
  }

  if (input.taskMarker === null) {
    return true;
  }

  return (
    input.lastTouchedAt !== null &&
    Date.parse(input.lastTouchedAt) > Date.parse(input.taskMarker)
  );
};
