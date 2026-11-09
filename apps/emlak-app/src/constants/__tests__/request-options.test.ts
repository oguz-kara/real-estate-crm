import { describe, expect, test } from 'vitest';

import { PROPERTY_MULTI_SELECT_OPTIONS } from 'src/constants/property-options';
import { AMENITY_UNION_OPTIONS } from 'src/constants/request-options';

describe('AMENITY_UNION_OPTIONS', () => {
  test('values duplicated across groups (SAHIL, SPOR_SALONU) appear exactly once', () => {
    const values = AMENITY_UNION_OPTIONS.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
    expect(values.filter((value) => value === 'SAHIL')).toHaveLength(1);
    expect(values.filter((value) => value === 'SPOR_SALONU')).toHaveLength(1);
  });

  test('positions are contiguous and the union covers every group value', () => {
    AMENITY_UNION_OPTIONS.forEach((option, index) => {
      expect(option.position).toBe(index);
    });
    const unionValues = new Set(AMENITY_UNION_OPTIONS.map((option) => option.value));
    for (const options of Object.values(PROPERTY_MULTI_SELECT_OPTIONS)) {
      for (const option of options) {
        expect(unionValues.has(option.value)).toBe(true);
      }
    }
  });
});
