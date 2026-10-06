import { SAHIBINDEN_LABEL_TO_VALUE } from 'src/constants/property-options';
import { parseBoolean } from 'src/import/parse-boolean';
import { parseFloor } from 'src/import/parse-floor';
import { parsePrice } from 'src/import/parse-price';
import { type ImportIssue } from 'src/import/raw-listing.type';

type StructuralResult = {
  fields: Record<string, unknown>;
  issues: ImportIssue[];
};

const SELECT_KEYS: Record<string, string> = {
  'Oda Sayısı': 'rooms',
  'Bina Yaşı': 'buildingAge',
  'Bulunduğu Kat': 'floorLocation',
  Isıtma: 'heating',
  'Tapu Durumu': 'deedStatus',
  Kimden: 'fromWho',
  'Kullanım Durumu': 'usageStatus',
  'İmar Durumu': 'zoningStatus',
};

const INT_KEYS: Record<string, string> = {
  'm² (Brüt)': 'sqmGross',
  'm² (Net)': 'sqmNet',
  'Kat Sayısı': 'totalFloors',
  'Banyo Sayısı': 'bathroomCount',
};

const BOOLEAN_KEYS: Record<string, string> = {
  Balkon: 'balcony',
  Eşyalı: 'furnished',
  Takas: 'exchangeable',
  Takaslı: 'exchangeable',
  'Site İçerisinde': 'inSite',
};

const CURRENCY_KEYS: Record<string, string> = {
  Aidat: 'dues',
  'Aidat (TL)': 'dues',
};

const TEXT_KEYS: Record<string, string> = {
  'Site Adı': 'siteName',
  'Ada No': 'blockNo',
  'Parsel No': 'parcelNo',
  'Kaks (Emsal)': 'kaks',
  Gabari: 'gabari',
};

// Known export keys we deliberately drop: 'Emlak Tipi' duplicates
// Kategoriler, 'Gayrimenkul Sahibi' is the owner's personal name (tracked
// through the owner relation instead, never imported as plain text).
const DISCARDED_KEYS = new Set(['Emlak Tipi', 'Gayrimenkul Sahibi']);

export const STRUCTURAL_FEATURE_KEYS: ReadonlySet<string> = new Set([
  ...Object.keys(SELECT_KEYS),
  ...Object.keys(INT_KEYS),
  ...Object.keys(BOOLEAN_KEYS),
  ...Object.keys(CURRENCY_KEYS),
  ...Object.keys(TEXT_KEYS),
  'Krediye Uygun',
  ...DISCARDED_KEYS,
]);

export const applyStructuralFeatures = (
  ozellikler: Record<string, string | null>,
): StructuralResult => {
  const fields: Record<string, unknown> = {};
  const issues: ImportIssue[] = [];

  const reportUnmappedValue = (key: string, raw: string) => {
    issues.push({ externalId: null, field: key, raw, reason: 'UNMAPPED_VALUE' });
  };

  for (const [key, value] of Object.entries(ozellikler)) {
    if (value === null || DISCARDED_KEYS.has(key)) {
      continue;
    }

    const selectField = SELECT_KEYS[key];
    if (selectField !== undefined) {
      const optionValue = SAHIBINDEN_LABEL_TO_VALUE[selectField][value];
      if (optionValue === undefined) {
        reportUnmappedValue(key, value);
      } else {
        fields[selectField] = optionValue;
      }
      continue;
    }

    const intField = INT_KEYS[key];
    if (intField !== undefined) {
      const parsed = parseFloor(value);
      if (parsed === null) {
        reportUnmappedValue(key, value);
      } else {
        fields[intField] = parsed;
      }
      continue;
    }

    const booleanField = BOOLEAN_KEYS[key];
    if (booleanField !== undefined) {
      const parsed = parseBoolean(value);
      if (parsed === null) {
        reportUnmappedValue(key, value);
      } else {
        fields[booleanField] = parsed;
      }
      continue;
    }

    const currencyField = CURRENCY_KEYS[key];
    if (currencyField !== undefined) {
      const amountMicros = parsePrice(value);
      if (amountMicros === null) {
        reportUnmappedValue(key, value);
      } else {
        fields[currencyField] = { amountMicros, currencyCode: 'TRY' };
      }
      continue;
    }

    const textField = TEXT_KEYS[key];
    if (textField !== undefined) {
      fields[textField] = value;
      continue;
    }

    if (key === 'Krediye Uygun') {
      const parsed = parseBoolean(value);
      if (parsed === null) {
        reportUnmappedValue(key, value);
      } else {
        fields.creditEligible = parsed ? 'UYGUN' : 'UYGUN_DEGIL';
      }
    }
  }

  return { fields, issues };
};
