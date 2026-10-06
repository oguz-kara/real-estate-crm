import { describe, expect, test } from 'vitest';

import { matchesHardCriteria } from 'src/matching/matches-hard-criteria';
import { type MatchProperty, type MatchRequest } from 'src/matching/match-types';

const BASE_REQUEST: MatchRequest = {
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

const BASE_PROPERTY: MatchProperty = {
  id: 'prop-1',
  name: 'Test ilan',
  status: 'ACTIVE',
  category: 'KONUT',
  listingType: 'SATILIK',
  priceMicros: 8_500_000_000_000,
  district: 'Bornova',
  rooms: 'R3_1',
  sqmNet: 110,
  createdAt: '2026-10-01T00:00:00Z',
  amenities: ['ASANSOR', 'OTOPARK'],
};

describe('matchesHardCriteria', () => {
  test('a criteria-less request matches every active property (open by design)', () => {
    expect(matchesHardCriteria(BASE_REQUEST, BASE_PROPERTY)).toBe(true);
  });

  test('rule 1: non-active property never matches', () => {
    expect(
      matchesHardCriteria(BASE_REQUEST, { ...BASE_PROPERTY, status: 'SOLD' }),
    ).toBe(false);
  });

  test('rules 2-3: category and listing type must equal when set', () => {
    expect(
      matchesHardCriteria({ ...BASE_REQUEST, category: 'ARSA' }, BASE_PROPERTY),
    ).toBe(false);
    expect(
      matchesHardCriteria({ ...BASE_REQUEST, listingType: 'KIRALIK' }, BASE_PROPERTY),
    ).toBe(false);
    expect(
      matchesHardCriteria(
        { ...BASE_REQUEST, category: 'KONUT', listingType: 'SATILIK' },
        BASE_PROPERTY,
      ),
    ).toBe(true);
  });

  test('rule 4: budget cap, including the null-price cases', () => {
    const capped = { ...BASE_REQUEST, budgetMaxMicros: 8_000_000_000_000 };
    expect(matchesHardCriteria(capped, BASE_PROPERTY)).toBe(false);
    expect(
      matchesHardCriteria(
        { ...BASE_REQUEST, budgetMaxMicros: 9_000_000_000_000 },
        BASE_PROPERTY,
      ),
    ).toBe(true);
    // priced-out-of-verification: null price is eliminated under a cap...
    expect(
      matchesHardCriteria(capped, { ...BASE_PROPERTY, priceMicros: null }),
    ).toBe(false);
    // ...but stays a candidate when the request has no cap
    expect(
      matchesHardCriteria(BASE_REQUEST, { ...BASE_PROPERTY, priceMicros: null }),
    ).toBe(true);
  });

  test('rule 5: districts are Turkish-case-insensitive and trimmed', () => {
    for (const districts of ['bornova', 'BORNOVA', ' Bornova , Karşıyaka']) {
      expect(
        matchesHardCriteria({ ...BASE_REQUEST, districts }, BASE_PROPERTY),
      ).toBe(true);
    }
    expect(
      matchesHardCriteria({ ...BASE_REQUEST, districts: 'Karşıyaka' }, BASE_PROPERTY),
    ).toBe(false);
    // null district on the property cannot satisfy a district list
    expect(
      matchesHardCriteria(
        { ...BASE_REQUEST, districts: 'Bornova' },
        { ...BASE_PROPERTY, district: null },
      ),
    ).toBe(false);
  });

  test('rule 6: rooms list, null property rooms eliminated when list set', () => {
    expect(
      matchesHardCriteria({ ...BASE_REQUEST, rooms: ['R3_1', 'R4_1'] }, BASE_PROPERTY),
    ).toBe(true);
    expect(
      matchesHardCriteria({ ...BASE_REQUEST, rooms: ['R2_1'] }, BASE_PROPERTY),
    ).toBe(false);
    expect(
      matchesHardCriteria(
        { ...BASE_REQUEST, rooms: ['R3_1'] },
        { ...BASE_PROPERTY, rooms: null },
      ),
    ).toBe(false);
  });

  test('rule 7: a single excluded feature on the property eliminates it', () => {
    expect(
      matchesHardCriteria(
        { ...BASE_REQUEST, excludedFeatures: ['ASANSOR'] },
        BASE_PROPERTY,
      ),
    ).toBe(false);
    expect(
      matchesHardCriteria(
        { ...BASE_REQUEST, excludedFeatures: ['HAVUZ'] },
        BASE_PROPERTY,
      ),
    ).toBe(true);
  });
});
