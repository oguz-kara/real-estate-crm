import { describe, expect, test } from 'vitest';

import { PROPERTY_MULTI_SELECT_OPTIONS } from 'src/constants/property-options';
import { mapFeatures } from 'src/import/map-features';
import { buildPropertyFilter } from 'src/search/build-property-filter';

// A label/value can legitimately appear in more than one amenity group
// (SAHIL, SPOR_SALONU). The import and the filter MUST resolve such
// duplicates to the same field, or search silently misses imported data.
describe('amenity placement consistency', () => {
  const allEntries = Object.entries(PROPERTY_MULTI_SELECT_OPTIONS).flatMap(
    ([fieldName, options]) =>
      options.map((option) => ({ fieldName, label: option.label, value: option.value })),
  );

  const duplicatedValues = [
    ...new Set(
      allEntries
        .map((entry) => entry.value)
        .filter((value, _, all) => all.filter((v) => v === value).length > 1),
    ),
  ];

  test('duplicated values exist in the option data (test precondition)', () => {
    expect(duplicatedValues).toEqual(
      expect.arrayContaining(['SAHIL', 'SPOR_SALONU']),
    );
  });

  test.each(duplicatedValues)(
    'import places %s in the same field the filter queries',
    (value) => {
      const label = allEntries.find((entry) => entry.value === value)?.label as string;

      const imported = mapFeatures({ [label]: 'Evet' });
      const importField = Object.keys(imported.fields)[0];

      const filter = buildPropertyFilter({ features: [value], featuresMode: 'all' });
      const conditions = (filter as { and: Array<Record<string, unknown>> }).and;
      const filterField = Object.keys(conditions[0])[0];

      expect(importField).toBe(filterField);
    },
  );
});
