import { describe, expect, test } from 'vitest';

import { buildRequestSearchParams } from 'src/matching/request-search-params';
import { type MatchRequest } from 'src/matching/match-types';

describe('buildRequestSearchParams', () => {
  test('maps hard criteria, pins ACTIVE, keeps districts and exclusions out of the filter', () => {
    const request: MatchRequest = {
      status: 'AKTIF',
      category: 'KONUT',
      listingType: 'SATILIK',
      budgetMaxMicros: 10_000_000_000_000,
      budgetMinMicros: null,
      districts: 'Bornova, Karşıyaka',
      rooms: ['R3_1'],
      excludedFeatures: ['ASANSOR'],
      features: ['OTOPARK'],
      sqmNetMin: 90,
    };

    expect(buildRequestSearchParams(request)).toEqual({
      status: 'ACTIVE',
      category: 'KONUT',
      listingType: 'SATILIK',
      priceMax: 10_000_000_000_000,
      rooms: ['R3_1'],
    });
  });

  test('empty request maps to just the ACTIVE pin', () => {
    const request: MatchRequest = {
      status: 'AKTIF',
      category: null,
      listingType: null,
      budgetMaxMicros: null,
      budgetMinMicros: null,
      districts: null,
      rooms: null,
      excludedFeatures: null,
      features: null,
      sqmNetMin: null,
    };
    expect(buildRequestSearchParams(request)).toEqual({ status: 'ACTIVE' });
  });
});
