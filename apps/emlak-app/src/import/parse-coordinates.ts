export type ParsedCoordinates = {
  latitude: number | null;
  longitude: number | null;
};

export const parseCoordinates = (
  raw: string | null | undefined,
): ParsedCoordinates => {
  // Number('') is 0, so an empty component must be rejected before the
  // conversion or a trailing comma yields coordinate 0 (null island)
  const parts = (raw ?? '')
    .split(',')
    .map((part) => part.trim())
    .map((part) => (part === '' ? Number.NaN : Number(part)));

  if (parts.length !== 2 || parts.some((part) => Number.isNaN(part))) {
    return { latitude: null, longitude: null };
  }

  return { latitude: parts[0], longitude: parts[1] };
};
