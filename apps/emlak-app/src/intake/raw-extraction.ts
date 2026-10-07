// Twenty's agent JSON schema only allows flat primitive properties, so the
// extractor returns every field as a string ('' = absent) and the code does
// all parsing and validation.
export type RawExtraction = {
  category: string;
  listingType: string;
  rooms: string;
  districts: string;
  features: string;
  excludedFeatures: string;
  budgetMin: string;
  budgetMax: string;
  budgetCurrency: string;
  sqmNetMin: string;
  leftover: string;
  evidence: string;
};

export const RAW_EXTRACTION_KEYS: readonly (keyof RawExtraction)[] = [
  'category',
  'listingType',
  'rooms',
  'districts',
  'features',
  'excludedFeatures',
  'budgetMin',
  'budgetMax',
  'budgetCurrency',
  'sqmNetMin',
  'leftover',
  'evidence',
];

const toRecord = (value: unknown): Record<string, unknown> | null => {
  if (typeof value === 'string') {
    try {
      return toRecord(JSON.parse(value));
    } catch {
      return null;
    }
  }
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, unknown>;
};

export const parseRawExtraction = (value: unknown): RawExtraction | null => {
  const record = toRecord(value);
  if (record === null) {
    return null;
  }
  const entries = RAW_EXTRACTION_KEYS.map((key) => {
    const field = record[key];
    if (field === undefined || field === null) {
      return [key, ''];
    }

    return [key, typeof field === 'string' ? field.trim() : JSON.stringify(field)];
  });

  return Object.fromEntries(entries) as RawExtraction;
};
