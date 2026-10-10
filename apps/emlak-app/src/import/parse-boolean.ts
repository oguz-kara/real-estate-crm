const TRUE_VALUES = new Set(['Var', 'Evet', 'true']);
const FALSE_VALUES = new Set(['Yok', 'Hayır', 'false']);

export const parseBoolean = (
  raw: string | null | undefined,
): boolean | null => {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim();

  if (TRUE_VALUES.has(trimmed)) {
    return true;
  }
  if (FALSE_VALUES.has(trimmed)) {
    return false;
  }

  return null;
};
