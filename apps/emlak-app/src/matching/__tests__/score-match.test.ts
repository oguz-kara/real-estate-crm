import { describe, expect, test } from 'vitest';

import { scoreMatch } from 'src/matching/score-match';
import { type MatchProperty, type MatchRequest } from 'src/matching/match-types';

const NOW = Date.parse('2026-10-06T12:00:00Z');
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

const EMPTY_REQUEST: MatchRequest = {
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

const property = (overrides: Partial<MatchProperty>): MatchProperty => ({
  id: 'p',
  name: 'ilan',
  status: 'ACTIVE',
  category: 'KONUT',
  listingType: 'SATILIK',
  priceMicros: 5_000_000_000_000,
  district: 'Bornova',
  rooms: 'R3_1',
  sqmNet: 110,
  createdAt: daysAgo(5),
  amenities: [],
  ...overrides,
});

describe('scoreMatch', () => {
  test('no soft criteria and a fresh listing → full 100', () => {
    expect(scoreMatch(EMPTY_REQUEST, property({}), NOW)).toBe(100);
  });

  test('features coverage is proportional (40-point component)', () => {
    const request = { ...EMPTY_REQUEST, features: ['ASANSOR', 'OTOPARK', 'KLIMA'] };
    expect(scoreMatch(request, property({ amenities: ['ASANSOR', 'OTOPARK', 'KLIMA'] }), NOW)).toBe(100);
    // 1/3 covered: 40×1/3 ≈ 13.3 → 100 - 40 + 13.33 = 73.33 → 73
    expect(scoreMatch(request, property({ amenities: ['ASANSOR'] }), NOW)).toBe(73);
    expect(scoreMatch(request, property({ amenities: [] }), NOW)).toBe(60);
  });

  test('sqm component: ratio below the ask, zero when property sqm unknown', () => {
    const request = { ...EMPTY_REQUEST, sqmNetMin: 100 };
    expect(scoreMatch(request, property({ sqmNet: 120 }), NOW)).toBe(100);
    // 80/100 × 25 = 20 → 95
    expect(scoreMatch(request, property({ sqmNet: 80 }), NOW)).toBe(95);
    expect(scoreMatch(request, property({ sqmNet: null }), NOW)).toBe(75);
  });

  test('suspiciously-cheap penalty (20 → 8)', () => {
    const request = { ...EMPTY_REQUEST, budgetMinMicros: 6_000_000_000_000 };
    expect(scoreMatch(request, property({ priceMicros: 7_000_000_000_000 }), NOW)).toBe(100);
    expect(scoreMatch(request, property({ priceMicros: 5_000_000_000_000 }), NOW)).toBe(88);
  });

  test('freshness tiers: 15 / 8 / 3', () => {
    expect(scoreMatch(EMPTY_REQUEST, property({ createdAt: daysAgo(10) }), NOW)).toBe(100);
    expect(scoreMatch(EMPTY_REQUEST, property({ createdAt: daysAgo(60) }), NOW)).toBe(93);
    expect(scoreMatch(EMPTY_REQUEST, property({ createdAt: daysAgo(200) }), NOW)).toBe(88);
  });

  test('score stays within 0-100 and is an integer', () => {
    const worst = scoreMatch(
      { ...EMPTY_REQUEST, features: ['A', 'B'], sqmNetMin: 100, budgetMinMicros: 9e15 },
      property({ amenities: [], sqmNet: null, priceMicros: 1, createdAt: daysAgo(400) }),
      NOW,
    );
    expect(worst).toBeGreaterThanOrEqual(0);
    expect(worst).toBeLessThanOrEqual(100);
    expect(Number.isInteger(worst)).toBe(true);
  });
});
