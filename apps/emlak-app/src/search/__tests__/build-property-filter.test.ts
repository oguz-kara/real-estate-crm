import { describe, expect, test } from 'vitest';

import {
  buildOrderBy,
  buildPropertyFilter,
} from 'src/search/build-property-filter';

describe('buildPropertyFilter', () => {
  test('empty params produce an empty filter, not a crash', () => {
    expect(buildPropertyFilter({})).toEqual({});
  });

  test('price bounds land on amountMicros in micros', () => {
    expect(buildPropertyFilter({ priceMin: 1_000_000, priceMax: 30_000 * 1e6 })).toEqual({
      and: [
        { price: { amountMicros: { gte: 1_000_000 } } },
        { price: { amountMicros: { lte: 30_000_000_000 } } },
      ],
    });
  });

  test('array params become in-filters', () => {
    expect(
      buildPropertyFilter({ districts: ['Bornova', 'Karşıyaka'], rooms: ['R3_1'] }),
    ).toEqual({
      and: [
        { district: { in: ['Bornova', 'Karşıyaka'] } },
        { rooms: { in: ['R3_1'] } },
      ],
    });
  });

  test('features any mode uses one containsAny', () => {
    expect(
      buildPropertyFilter({ features: ['ASANSOR', 'OTOPARK'], featuresMode: 'any' }),
    ).toEqual({
      and: [{ exteriorFeatures: { containsAny: ['ASANSOR', 'OTOPARK'] } }],
    });
  });

  test('features all mode ANDs one containsAny per value', () => {
    expect(
      buildPropertyFilter({ features: ['ASANSOR', 'KLIMA'], featuresMode: 'all' }),
    ).toEqual({
      and: [
        { exteriorFeatures: { containsAny: ['ASANSOR'] } },
        { interiorFeatures: { containsAny: ['KLIMA'] } },
      ],
    });
  });

  test('the spec example: Bornova, ≤30.000 TL, kiralık, 3+1, eşyalı konut', () => {
    const filter = buildPropertyFilter({
      category: 'KONUT',
      listingType: 'KIRALIK',
      districts: ['Bornova'],
      priceMax: 30_000 * 1e6,
      rooms: ['R3_1'],
      furnished: true,
    });

    expect(filter).toEqual({
      and: [
        { category: { in: ['KONUT'] } },
        { listingType: { in: ['KIRALIK'] } },
        { district: { in: ['Bornova'] } },
        { price: { amountMicros: { lte: 30_000_000_000 } } },
        { rooms: { in: ['R3_1'] } },
        { furnished: { eq: true } },
      ],
    });
  });

  test('neighborhoodContains becomes a case-insensitive like', () => {
    expect(buildPropertyFilter({ neighborhoodContains: 'erzene' })).toEqual({
      and: [{ neighborhood: { ilike: '%erzene%' } }],
    });
  });
});

describe('buildOrderBy', () => {
  test('defaults to newest first', () => {
    expect(buildOrderBy({})).toEqual([{ createdAt: 'DescNullsLast' }]);
  });

  test('price ascending', () => {
    expect(buildOrderBy({ sortBy: 'price', sortDirection: 'asc' })).toEqual([
      { price: { amountMicros: 'AscNullsLast' } },
    ]);
  });

  test('sqmNet descending', () => {
    expect(buildOrderBy({ sortBy: 'sqmNet', sortDirection: 'desc' })).toEqual([
      { sqmNet: 'DescNullsLast' },
    ]);
  });
});
