import { describe, expect, test } from 'vitest';

import { parseCoordinates } from 'src/import/parse-coordinates';

describe('parseCoordinates', () => {
  test.each([
    ['38.468, 27.224', { latitude: 38.468, longitude: 27.224 }],
    ['-', { latitude: null, longitude: null }],
    ['', { latitude: null, longitude: null }],
    [null, { latitude: null, longitude: null }],
    ['38.468', { latitude: null, longitude: null }],
    ['38.468, ', { latitude: null, longitude: null }],
    [',', { latitude: null, longitude: null }],
  ])('%j', (raw, expected) => {
    expect(parseCoordinates(raw)).toEqual(expected);
  });
});
