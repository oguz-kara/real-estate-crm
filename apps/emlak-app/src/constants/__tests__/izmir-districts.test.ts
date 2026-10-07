import { describe, expect, test } from 'vitest';

import { canonicalizeDistrict, IZMIR_DISTRICTS } from 'src/constants/izmir-districts';

describe('izmir districts', () => {
  test('has 30 districts and canonicalizes aliases case/diacritic-insensitively', () => {
    expect(IZMIR_DISTRICTS).toHaveLength(30);
    expect(canonicalizeDistrict('ALACATI')).toBe('Çeşme');
    expect(canonicalizeDistrict('cesme merkez')).toBe('Çeşme');
    expect(canonicalizeDistrict('Gümüldür')).toBe('Menderes');
    expect(canonicalizeDistrict('Mordoğan')).toBe('Karaburun');
    expect(canonicalizeDistrict('Bornova')).toBe('Bornova');
    expect(canonicalizeDistrict('Brnv')).toBeNull();
    expect(canonicalizeDistrict('İstanbul')).toBeNull();
  });
});
