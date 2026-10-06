import { PROPERTY_MULTI_SELECT_OPTIONS } from 'src/constants/property-options';
import { STRUCTURAL_FEATURE_KEYS } from 'src/import/structural-feature-keys';
import { type ImportIssue } from 'src/import/raw-listing.type';

export type MappedFeatures = {
  fields: Record<string, string[]>;
  issues: ImportIssue[];
};

// label → [multiSelectFieldName, optionValue], across all 6 amenity fields
const AMENITY_LABEL_INDEX: Record<string, readonly [string, string]> =
  Object.fromEntries(
    Object.entries(PROPERTY_MULTI_SELECT_OPTIONS).flatMap(
      ([fieldName, options]) =>
        options.map(
          (option) => [option.label, [fieldName, option.value]] as const,
        ),
    ),
  );

export const mapFeatures = (
  ozellikler: Record<string, string | null>,
): MappedFeatures => {
  const fields: Record<string, string[]> = {};
  const issues: ImportIssue[] = [];

  for (const [key, value] of Object.entries(ozellikler)) {
    if (value === null || STRUCTURAL_FEATURE_KEYS.has(key)) {
      continue;
    }

    const amenity = AMENITY_LABEL_INDEX[key];

    if (amenity === undefined) {
      issues.push({
        externalId: null,
        field: key,
        raw: value,
        reason: 'UNMAPPED_KEY',
      });
      continue;
    }

    if (value !== 'Evet') {
      issues.push({
        externalId: null,
        field: key,
        raw: value,
        reason: 'UNMAPPED_VALUE',
      });
      continue;
    }

    const [fieldName, optionValue] = amenity;
    fields[fieldName] = [...(fields[fieldName] ?? []), optionValue];
  }

  return { fields, issues };
};
