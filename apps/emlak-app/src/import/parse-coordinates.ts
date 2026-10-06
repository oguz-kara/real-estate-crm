export type ParsedCoordinates = {
  latitude: number | null;
  longitude: number | null;
};

export const parseCoordinates = (
  raw: string | null | undefined,
): ParsedCoordinates => {
  const parts = (raw ?? '').split(',').map((part) => Number(part.trim()));

  if (parts.length !== 2 || parts.some((part) => Number.isNaN(part))) {
    return { latitude: null, longitude: null };
  }

  return { latitude: parts[0], longitude: parts[1] };
};
