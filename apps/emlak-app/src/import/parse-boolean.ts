const TRUE_VALUES = new Set(['Var', 'Evet', 'true']);
const FALSE_VALUES = new Set(['Yok', 'Hayır', 'false']);

export const parseBoolean = (
  raw: string | null | undefined,
): boolean | null => {
  if (raw === null || raw === undefined) {
    return null;
  }
  if (TRUE_VALUES.has(raw)) {
    return true;
  }
  if (FALSE_VALUES.has(raw)) {
    return false;
  }

  return null;
};
