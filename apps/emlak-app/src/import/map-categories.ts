import { SAHIBINDEN_LABEL_TO_VALUE } from 'src/constants/property-options';
import { type ImportIssue } from 'src/import/raw-listing.type';

export type MappedCategories = {
  category: string | null;
  subType: string | null;
  listingType: string | null;
  issues: ImportIssue[];
};

const IGNORED_TOKENS = new Set(['Emlak']);

// raw export spellings that differ from our canonical labels
const TOKEN_ALIASES: Record<string, string> = {
  'İş Yeri': 'İşyeri',
};

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
    .map((token) => TOKEN_ALIASES[token] ?? token)
    .filter((token) => token.length > 0 && !IGNORED_TOKENS.has(token));

  for (const token of tokens) {
    // slots fill positionally: a label that is both a category and a
    // subType ("Bina", "Devremülk") lands in the first still-empty slot,
    // so the second occurrence keeps the subType instead of vanishing
    const category = SAHIBINDEN_LABEL_TO_VALUE.category[token];
    if (category !== undefined && result.category === null) {
      result.category = category;
      continue;
    }

    const listingType = SAHIBINDEN_LABEL_TO_VALUE.listingType[token];
    if (listingType !== undefined && result.listingType === null) {
      result.listingType = listingType;
      continue;
    }

    const subType = SAHIBINDEN_LABEL_TO_VALUE.subType[token];
    if (subType !== undefined && result.subType === null) {
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
