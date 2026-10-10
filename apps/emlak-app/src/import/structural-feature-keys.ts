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
  'Bulunduğu Kat': 'floorLocation',
  Isıtma: 'heating',
  'Tapu Durumu': 'deedStatus',
  Kimden: 'fromWho',
  'Kullanım Durumu': 'usageStatus',
  'İmar Durumu': 'zoningStatus',
  Mutfak: 'kitchenType',
  'Yapının Durumu': 'buildingCondition',
  Türü: 'subType',
};

const INT_KEYS: Record<string, string> = {
  'm² (Brüt)': 'sqmGross',
  'm² (Net)': 'sqmNet',
  'm²': 'sqmGross',
  'Kat Sayısı': 'totalFloors',
  'Banyo Sayısı': 'bathroomCount',
  'Açık Alan m²': 'openAreaSqm',
  'Açık Alan (m2)': 'openAreaSqm',
  'Kapalı Alan m²': 'closedAreaSqm',
  'Kapalı Alan (m2)': 'closedAreaSqm',
  'Bölüm & Oda Sayısı': 'sectionRoomCount',
  'Yatak Sayısı': 'bedCount',
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
  'm² Fiyatı': 'pricePerSqm',
  'Depozito (TL)': 'deposit',
};

const TEXT_KEYS: Record<string, string> = {
  'Site Adı': 'siteName',
  'Taşınmaz Numarası': 'immovableNumber',
  'Ada No': 'blockNo',
  'Parsel No': 'parcelNo',
  'Kaks (Emsal)': 'kaks',
  Gabari: 'gabari',
};

// Known export keys we deliberately drop: 'Emlak Tipi' duplicates
// Kategoriler, 'Gayrimenkul Sahibi' is the owner's personal name (tracked
// through the owner relation instead, never imported as plain text).
// 'Durumu' and 'Kategori' duplicate Kategoriler; bare 'Depozito' carries
// only Evet/Hayır noise (the amount arrives as 'Depozito (TL)')
const DISCARDED_KEYS = new Set([
  'Emlak Tipi',
  'Gayrimenkul Sahibi',
  'Durumu',
  'Kategori',
  'Depozito',
]);

export const STRUCTURAL_FEATURE_KEYS: ReadonlySet<string> = new Set([
  ...Object.keys(SELECT_KEYS),
  ...Object.keys(INT_KEYS),
  ...Object.keys(BOOLEAN_KEYS),
  ...Object.keys(CURRENCY_KEYS),
  ...Object.keys(TEXT_KEYS),
  'Krediye Uygun',
  'Krediye Uygunluk',
  'Bina Yaşı',
  ...DISCARDED_KEYS,
]);

// sahibinden now exports exact years ('8', '28'); the range select keeps
// its buckets for filtering while buildingAgeYears keeps the exact value
const bucketBuildingAge = (years: number): string => {
  if (years <= 5) return `AGE_${years}`;
  if (years <= 10) return 'AGE_6_10';
  if (years <= 15) return 'AGE_11_15';
  if (years <= 20) return 'AGE_16_20';
  if (years <= 25) return 'AGE_21_25';
  if (years <= 30) return 'AGE_26_30';
  return 'AGE_31_PLUS';
};

export const applyStructuralFeatures = (
  ozellikler: Record<string, string | null>,
): StructuralResult => {
  const fields: Record<string, unknown> = {};
  const issues: ImportIssue[] = [];

  const reportUnmappedValue = (key: string, raw: string) => {
    issues.push({ externalId: null, field: key, raw, reason: 'UNMAPPED_VALUE' });
  };

  for (const [rawKey, rawValue] of Object.entries(ozellikler)) {
    const key = rawKey.trim();
    const value = rawValue === null ? null : rawValue.trim();

    if (value === null || value === '' || DISCARDED_KEYS.has(key)) {
      continue;
    }

    if (key === 'Bina Yaşı') {
      const years = parseFloor(value);
      if (years !== null) {
        fields.buildingAge = bucketBuildingAge(years);
        fields.buildingAgeYears = years;
        continue;
      }
      const optionValue = SAHIBINDEN_LABEL_TO_VALUE.buildingAge[value];
      if (optionValue === undefined) {
        reportUnmappedValue(key, value);
      } else {
        fields.buildingAge = optionValue;
      }
      continue;
    }

    // on işyeri/tesis listings 'Mutfak' is a yes-flag, not the kitchen type
    if (key === 'Mutfak' && (value === 'Evet' || value === 'Var')) {
      fields.businessFeatures = ['MUTFAK'];
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

    if (key === 'Krediye Uygun' || key === 'Krediye Uygunluk') {
      if (value === 'Bilinmiyor') {
        fields.creditEligible = 'BILINMIYOR';
        continue;
      }
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
