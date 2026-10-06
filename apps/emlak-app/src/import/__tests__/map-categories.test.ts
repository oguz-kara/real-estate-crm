import { describe, expect, test } from 'vitest';

import { mapCategories } from 'src/import/map-categories';

describe('mapCategories', () => {
  test('rental apartment', () => {
    const result = mapCategories('Emlak, Konut, Kiralık, Daire');
    expect(result.category).toBe('KONUT');
    expect(result.subType).toBe('DAIRE');
    expect(result.listingType).toBe('KIRALIK');
    expect(result.issues).toEqual([]);
  });

  test('land for sale', () => {
    const result = mapCategories('Emlak, Arsa, Satılık, İmarlı Arsa');
    expect(result.category).toBe('ARSA');
    expect(result.subType).toBe('IMARLI_ARSA');
    expect(result.listingType).toBe('SATILIK');
  });

  test('unknown token reported, known parts still mapped', () => {
    const result = mapCategories('Emlak, Konut, Kiralık, Bilinmeyen Tip');
    expect(result.category).toBe('KONUT');
    expect(result.listingType).toBe('KIRALIK');
    expect(result.subType).toBeNull();
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0].reason).toBe('UNMAPPED_VALUE');
    expect(result.issues[0].raw).toBe('Bilinmeyen Tip');
  });

  test('null input', () => {
    const result = mapCategories(null);
    expect(result).toEqual({
      category: null,
      subType: null,
      listingType: null,
      issues: [],
    });
  });
});
