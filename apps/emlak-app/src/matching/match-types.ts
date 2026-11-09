export type MatchRequest = {
  status: string | null;
  category: string | null;
  listingType: string | null;
  budgetMaxMicros: number | null;
  budgetMinMicros: number | null;
  districts: string | null;
  rooms: string[] | null;
  excludedFeatures: string[] | null;
  features: string[] | null;
  sqmNetMin: number | null;
};

export type MatchProperty = {
  id: string;
  name: string | null;
  status: string | null;
  category: string | null;
  listingType: string | null;
  priceMicros: number | null;
  district: string | null;
  rooms: string | null;
  sqmNet: number | null;
  createdAt: string;
  // union of the property's 8 amenity multi-select arrays
  amenities: string[];
};
