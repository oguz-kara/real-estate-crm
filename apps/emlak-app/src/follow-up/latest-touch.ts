export const latestTouch = (
  noteDates: string[],
  doneTaskDates: string[],
): string | null => {
  const all = [...noteDates, ...doneTaskDates];

  if (all.length === 0) {
    return null;
  }

  return all.reduce((latest, candidate) =>
    Date.parse(candidate) > Date.parse(latest) ? candidate : latest,
  );
};
