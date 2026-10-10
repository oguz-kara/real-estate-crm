import { describe, expect, test } from 'vitest';

import { parsePrice } from 'src/import/parse-price';

describe('parsePrice', () => {
  test.each([
    ['28.500 TL', 28_500_000_000],
    ['1.250.000 TL', 1_250_000_000_000],
    ['3.000.000.000 TL', 3_000_000_000_000_000],
    ['', null],
    ['TL', null],
    [null, null],
  ])('%j → %j', (raw, expected) => {
    expect(parsePrice(raw)).toBe(expected);
  });
});
