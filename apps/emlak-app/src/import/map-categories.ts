import { SAHIBINDEN_LABEL_TO_VALUE } from 'src/constants/property-options';
import { type ImportIssue } from 'src/import/raw-listing.type';

export type MappedCategories = {
  category: string | null;
  subType: string | null;
  listingType: string | null;
  issues: ImportIssue[];
};

const IGNORED_TOKENS = new Set(['Emlak']);

export const mapCategories = (
  raw: string | null | undefined,
): MappedCategories => {
  const result: MappedCategories = {
    category: null,
    subType: null,
    listingType: null,
    issues: [],
  };

  const tokens = (raw ?? '')
    .split(',')
    .map((token) => token.trim())
    .filter((token) => token.length > 0 && !IGNORED_TOKENS.has(token));

  for (const token of tokens) {
    const category = SAHIBINDEN_LABEL_TO_VALUE.category[token];
    if (category !== undefined) {
      result.category = category;
      continue;
    }

    const listingType = SAHIBINDEN_LABEL_TO_VALUE.listingType[token];
    if (listingType !== undefined) {
      result.listingType = listingType;
      continue;
    }

    const subType = SAHIBINDEN_LABEL_TO_VALUE.subType[token];
    if (subType !== undefined) {
      result.subType = subType;
      continue;
    }

    result.issues.push({
      externalId: null,
      field: 'Kategoriler',
      raw: token,
      reason: 'UNMAPPED_VALUE',
    });
  }

  return result;
};
