// Explicit NaN check: `parseInt(...) || null` would turn the valid floor
// count 0 into null, which is the old import script's known bug.
export const parseFloor = (raw: string | null | undefined): number | null => {
  if (raw === null || raw === undefined || raw.trim() === '') {
    return null;
  }

  const parsed = Number(raw.trim());

  return Number.isInteger(parsed) ? parsed : null;
};
