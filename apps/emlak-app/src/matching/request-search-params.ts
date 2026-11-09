import { type MatchRequest } from 'src/matching/match-types';
import { type PropertySearchParams } from 'src/search/property-search-params.type';

// Hard criteria the server can filter; districts (Turkish-case-insensitive)
// and excluded features are checked in code on the fetched rows.
export const buildRequestSearchParams = (
  request: MatchRequest,
): PropertySearchParams => ({
  status: 'ACTIVE',
  ...(request.category === null ? {} : { category: request.category }),
  ...(request.listingType === null ? {} : { listingType: request.listingType }),
  ...(request.budgetMaxMicros === null ? {} : { priceMax: request.budgetMaxMicros }),
  ...(request.rooms === null || request.rooms.length === 0
    ? {}
    : { rooms: request.rooms }),
});
