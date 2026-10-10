import { describe, expect, test } from 'vitest';

import { mapFeatures } from 'src/import/map-features';

describe('mapFeatures', () => {
  test('"Evet" amenity lands in its owning multi-select', () => {
    const result = mapFeatures({ Asansör: 'Evet', Metro: 'Evet' });
    expect(result.fields.exteriorFeatures).toEqual(['ASANSOR']);
    expect(result.fields.transportFeatures).toEqual(['METRO']);
    expect(result.issues).toEqual([]);
  });

  test('null values are skipped silently', () => {
    const result = mapFeatures({ Asansör: null, Sauna: null });
    expect(result.fields).toEqual({});
    expect(result.issues).toEqual([]);
  });

  test('unknown "Evet" key is reported as UNMAPPED_KEY', () => {
    const result = mapFeatures({ 'Bilinmeyen Anahtar': 'Evet' });
    expect(result.fields).toEqual({});
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      field: 'Bilinmeyen Anahtar',
      reason: 'UNMAPPED_KEY',
    });
  });

  test('known amenity with a non-"Evet" value is not added and reported', () => {
    const result = mapFeatures({ Asansör: 'Hayır' });
    expect(result.fields).toEqual({});
    expect(result.issues).toHaveLength(1);
    expect(result.issues[0]).toMatchObject({
      field: 'Asansör',
      raw: 'Hayır',
      reason: 'UNMAPPED_VALUE',
    });
  });

  test('structural keys are left for the structural mapper, not reported', () => {
    const result = mapFeatures({ 'm² (Net)': '110', Isıtma: 'Kombi (Doğalgaz)' });
    expect(result.fields).toEqual({});
    expect(result.issues).toEqual([]);
  });
});
