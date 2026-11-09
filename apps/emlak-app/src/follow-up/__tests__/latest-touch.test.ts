import { describe, expect, test } from 'vitest';

import { latestTouch } from 'src/follow-up/latest-touch';

describe('latestTouch', () => {
  test('picks the newest date across both lists', () => {
    expect(
      latestTouch(
        ['2026-10-01T00:00:00Z', '2026-10-03T00:00:00Z'],
        ['2026-10-02T00:00:00Z'],
      ),
    ).toBe('2026-10-03T00:00:00Z');
  });

  test('one empty list is fine', () => {
    expect(latestTouch([], ['2026-10-02T00:00:00Z'])).toBe('2026-10-02T00:00:00Z');
  });

  test('both empty → null (never touched)', () => {
    expect(latestTouch([], [])).toBeNull();
  });
});
