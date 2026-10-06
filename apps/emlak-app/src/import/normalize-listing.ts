import { mapCategories } from 'src/import/map-categories';
import { mapFeatures } from 'src/import/map-features';
import { parseAddress } from 'src/import/parse-address';
import { parseCoordinates } from 'src/import/parse-coordinates';
import { parsePrice } from 'src/import/parse-price';
import { applyStructuralFeatures } from 'src/import/structural-feature-keys';
import { type ImportIssue, type RawListing } from 'src/import/raw-listing.type';

export type NormalizedListing = {
  record: Record<string, unknown>;
  issues: ImportIssue[];
};

const setIfDefined = (
  record: Record<string, unknown>,
  key: string,
  value: unknown,
) => {
  if (value !== null && value !== undefined && value !== '') {
    record[key] = value;
  }
};

export const normalizeListing = (raw: RawListing): NormalizedListing => {
  const externalId = raw['İlan no'] ?? null;
  const record: Record<string, unknown> = {
    externalSource: 'SAHIBINDEN',
  };
  const issues: ImportIssue[] = [];

  setIfDefined(record, 'externalId', externalId);
  setIfDefined(record, 'name', raw.Başlık);
  setIfDefined(record, 'description', raw.Açıklama);

  const categories = mapCategories(raw.Kategoriler);
  setIfDefined(record, 'category', categories.category);
  setIfDefined(record, 'subType', categories.subType);
  setIfDefined(record, 'listingType', categories.listingType);
  issues.push(...categories.issues);

  const amountMicros = parsePrice(raw.Fiyat);
  if (amountMicros !== null) {
    record.price = { amountMicros, currencyCode: 'TRY' };
  }

  const address = parseAddress(raw.Adres);
  setIfDefined(record, 'city', address.city);
  setIfDefined(record, 'district', address.district);
  setIfDefined(record, 'neighborhood', address.neighborhood);

  const coordinates = parseCoordinates(raw.Konum);
  setIfDefined(record, 'latitude', coordinates.latitude);
  setIfDefined(record, 'longitude', coordinates.longitude);

  const ozellikler = raw.Özellikler ?? {};
  const structural = applyStructuralFeatures(ozellikler);
  Object.assign(record, structural.fields);
  issues.push(...structural.issues);

  const amenities = mapFeatures(ozellikler);
  Object.assign(record, amenities.fields);
  issues.push(...amenities.issues);

  if (raw['Aktif Görsel Listesi']) {
    record.imageFiles = raw['Aktif Görsel Listesi'];
  }
  if (raw['Video Listesi']) {
    record.videoFiles = raw['Video Listesi'];
  }

  const issuesWithId = issues.map((issue) => ({ ...issue, externalId }));

  if (issuesWithId.length > 0) {
    record.importNotes = {
      unmapped: issuesWithId.map(({ field, raw: rawValue, reason }) => ({
        field,
        raw: rawValue,
        reason,
      })),
    };
  }

  return { record, issues: issuesWithId };
};
