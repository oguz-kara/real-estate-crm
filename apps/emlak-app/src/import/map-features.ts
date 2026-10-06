import {
  AMENITY_LABEL_ALIASES,
  AMENITY_LABEL_TO_FIELD_VALUE,
} from 'src/constants/property-options';
import { STRUCTURAL_FEATURE_KEYS } from 'src/import/structural-feature-keys';
import { type ImportIssue } from 'src/import/raw-listing.type';

export type MappedFeatures = {
  fields: Record<string, string[]>;
  issues: ImportIssue[];
};

export const mapFeatures = (
  ozellikler: Record<string, string | null>,
): MappedFeatures => {
  const fields: Record<string, string[]> = {};
  const issues: ImportIssue[] = [];

  for (const [rawKey, rawValue] of Object.entries(ozellikler)) {
    const trimmedKey = rawKey.trim();
    const key = AMENITY_LABEL_ALIASES[trimmedKey] ?? trimmedKey;
    const value = rawValue === null ? null : rawValue.trim();

    if (value === null || value === '' || STRUCTURAL_FEATURE_KEYS.has(key)) {
      continue;
    }

    const amenity = AMENITY_LABEL_TO_FIELD_VALUE[key];

    if (amenity === undefined) {
      issues.push({
        externalId: null,
        field: key,
        raw: value,
        reason: 'UNMAPPED_KEY',
      });
      continue;
    }

    if (value !== 'Evet' && value !== 'Var') {
      issues.push({
        externalId: null,
        field: key,
        raw: value,
        reason: 'UNMAPPED_VALUE',
      });
      continue;
    }

    const [fieldName, optionValue] = amenity;
    const existing = fields[fieldName] ?? [];
    // spelling variants of the same amenity must not duplicate the value
    if (!existing.includes(optionValue)) {
      fields[fieldName] = [...existing, optionValue];
    }
  }

  return { fields, issues };
};
