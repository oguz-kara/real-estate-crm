export type ParsedAddress = {
  city: string | null;
  district: string | null;
  neighborhood: string | null;
};

// "İzmir / Bornova / Erzene Mah." — parts assign left-to-right; anything
// beyond the third slash stays inside the neighborhood.
export const parseAddress = (raw: string | null | undefined): ParsedAddress => {
  const parts = (raw ?? '')
    .split('/')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  return {
    city: parts[0] ?? null,
    district: parts[1] ?? null,
    neighborhood: parts.length > 2 ? parts.slice(2).join(' / ') : null,
  };
};
