import { describe, expect, test } from 'vitest';

import { computeFollowUpStatus } from 'src/follow-up/compute-follow-up-status';

const NOW = Date.parse('2026-10-06T12:00:00Z');
const daysAgo = (days: number) =>
  new Date(NOW - days * 86_400_000).toISOString();

describe('computeFollowUpStatus', () => {
  test('no stage → null (skip / clear)', () => {
    expect(
      computeFollowUpStatus({ stage: null, lastTouchedAt: daysAgo(99), now: NOW }),
    ).toBeNull();
  });

  test('never touched → immediately due, whatever the stage', () => {
    for (const stage of ['SICAK', 'ILIK', 'UZUN_VADELI']) {
      expect(
        computeFollowUpStatus({ stage, lastTouchedAt: null, now: NOW }),
      ).toBe('VADESI_GELDI');
    }
  });

  test.each([
    ['SICAK', 1, 'TAKIPTE'],
    ['SICAK', 4, 'VADESI_GELDI'],
    ['SICAK', 7, 'GECIKMIS'],
    ['ILIK', 6, 'TAKIPTE'],
    ['ILIK', 8, 'VADESI_GELDI'],
    ['ILIK', 15, 'GECIKMIS'],
    ['UZUN_VADELI', 29, 'TAKIPTE'],
    ['UZUN_VADELI', 31, 'VADESI_GELDI'],
    ['UZUN_VADELI', 61, 'GECIKMIS'],
  ])('%s stage, touched %i days ago → %s', (stage, days, expected) => {
    expect(
      computeFollowUpStatus({ stage, lastTouchedAt: daysAgo(days), now: NOW }),
    ).toBe(expected);
  });

  test('exactly at the threshold counts as due', () => {
    expect(
      computeFollowUpStatus({ stage: 'SICAK', lastTouchedAt: daysAgo(3), now: NOW }),
    ).toBe('VADESI_GELDI');
  });

  test('unknown stage value → null (defensive skip)', () => {
    expect(
      computeFollowUpStatus({ stage: 'BILINMEYEN', lastTouchedAt: daysAgo(1), now: NOW }),
    ).toBeNull();
  });
});
