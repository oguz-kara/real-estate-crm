// "28.500 TL" → micros. Returns a plain number: safe up to ~9 trilyon TL,
// far beyond any listing price.
export const parsePrice = (raw: string | null | undefined): number | null => {
  if (raw === null || raw === undefined) {
    return null;
  }

  const digits = raw.replace(/\D/g, '');

  if (digits.length === 0) {
    return null;
  }

  return Number(digits) * 1_000_000;
};
