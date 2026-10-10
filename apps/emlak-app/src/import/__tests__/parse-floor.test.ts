import { describe, expect, test } from 'vitest';

import { parseFloor } from 'src/import/parse-floor';

describe('parseFloor', () => {
  // '0' is a valid floor count value: the old import script's
  // `parseInt(...) || null` turned it into null — regression guard.
  test.each([
    ['0', 0],
    ['3', 3],
    ['21', 21],
    ['Bahçe Katı', null],
    ['', null],
    [null, null],
  ])('%j → %j', (raw, expected) => {
    expect(parseFloor(raw)).toBe(expected);
  });
});
