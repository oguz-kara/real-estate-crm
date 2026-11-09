import {
  PROPERTY_MULTI_SELECT_OPTIONS,
  type SelectOption,
} from 'src/constants/property-options';

// Union of all 8 property amenity groups for the request's wanted /
// excluded feature fields. Values duplicated across groups (SAHIL,
// SPOR_SALONU) appear once, first declaration wins, positions reassigned.
const seen = new Set<string>();
const unionOptions: SelectOption[] = [];
for (const options of Object.values(PROPERTY_MULTI_SELECT_OPTIONS)) {
  for (const option of options) {
    if (!seen.has(option.value)) {
      seen.add(option.value);
      unionOptions.push({ ...option, position: unionOptions.length });
    }
  }
}

export const AMENITY_UNION_OPTIONS: readonly SelectOption[] = unionOptions;
