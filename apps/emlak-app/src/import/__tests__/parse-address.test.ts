import { describe, expect, test } from 'vitest';

import { parseAddress } from 'src/import/parse-address';

describe('parseAddress', () => {
  test.each([
    [
      'İzmir / Bornova / Erzene Mah.',
      { city: 'İzmir', district: 'Bornova', neighborhood: 'Erzene Mah.' },
    ],
    ['İzmir / Bornova', { city: 'İzmir', district: 'Bornova', neighborhood: null }],
    ['İzmir', { city: 'İzmir', district: null, neighborhood: null }],
    [
      'İzmir / Bornova / Erzene Mah. / Ek Bölge',
      { city: 'İzmir', district: 'Bornova', neighborhood: 'Erzene Mah. / Ek Bölge' },
    ],
    ['', { city: null, district: null, neighborhood: null }],
    [null, { city: null, district: null, neighborhood: null }],
  ])('%j', (raw, expected) => {
    expect(parseAddress(raw)).toEqual(expected);
  });
});
