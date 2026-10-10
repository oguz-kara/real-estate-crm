import { describe, expect, test } from 'vitest';

import {
  PROPERTY_FIELD_IDS,
  PROPERTY_UNIVERSAL_IDENTIFIER,
} from 'src/constants/property-field-ids';
import {
  PROPERTY_MULTI_SELECT_OPTIONS,
  PROPERTY_SELECT_OPTIONS,
  SAHIBINDEN_LABEL_TO_VALUE,
} from 'src/constants/property-options';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

const ALL_OPTION_SETS = {
  ...PROPERTY_SELECT_OPTIONS,
  ...PROPERTY_MULTI_SELECT_OPTIONS,
};

describe('property option sets', () => {
  test('every option list is non-empty with unique values and contiguous positions', () => {
    for (const [fieldName, options] of Object.entries(ALL_OPTION_SETS)) {
      expect(options.length, fieldName).toBeGreaterThan(0);
      const values = options.map((option) => option.value);
      expect(new Set(values).size, fieldName).toBe(values.length);
      options.forEach((option, index) => {
        expect(option.position, `${fieldName}:${option.value}`).toBe(index);
      });
    }
  });

  test('label lookup resolves raw sahibinden labels', () => {
    expect(SAHIBINDEN_LABEL_TO_VALUE.heating['Kombi (Doğalgaz)']).toBe(
      'KOMBI_DOGALGAZ',
    );
    expect(SAHIBINDEN_LABEL_TO_VALUE.buildingAge['6-10 arası']).toBe(
      'AGE_6_10',
    );
    expect(SAHIBINDEN_LABEL_TO_VALUE.exteriorFeatures['Asansör']).toBe(
      'ASANSOR',
    );
  });

  test('field ids are unique valid uuids', () => {
    const ids = [PROPERTY_UNIVERSAL_IDENTIFIER, ...Object.values(PROPERTY_FIELD_IDS)];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(id).toMatch(UUID_PATTERN);
    }
  });
});
