import { describe, expect, test } from 'vitest';

import { parseBoolean } from 'src/import/parse-boolean';

describe('parseBoolean', () => {
  test.each([
    ['Var', true],
    ['Yok', false],
    ['Evet', true],
    ['Hayır', false],
    ['true', true],
    ['false', false],
    [null, null],
    ['', null],
    ['belirsiz', null],
  ])('%j → %j', (raw, expected) => {
    expect(parseBoolean(raw)).toBe(expected);
  });
});
