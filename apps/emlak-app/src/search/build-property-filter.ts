import { PROPERTY_MULTI_SELECT_OPTIONS } from 'src/constants/property-options';
import { type PropertySearchParams } from 'src/search/property-search-params.type';

type FilterNode = Record<string, unknown>;

// feature value → owning multi-select field; an ambiguous value (e.g.
// SPOR_SALONU exists in two groups) resolves to the first declaring field
const FEATURE_VALUE_TO_FIELD: Record<string, string> = {};
for (const [fieldName, options] of Object.entries(PROPERTY_MULTI_SELECT_OPTIONS)) {
  for (const option of options) {
    FEATURE_VALUE_TO_FIELD[option.value] ??= fieldName;
  }
}

export const buildPropertyFilter = (
  params: PropertySearchParams,
): FilterNode => {
  const conditions: FilterNode[] = [];

  if (params.category !== undefined) {
    conditions.push({ category: { in: [params.category] } });
  }
  if (params.subTypes !== undefined && params.subTypes.length > 0) {
    conditions.push({ subType: { in: params.subTypes } });
  }
  if (params.listingType !== undefined) {
    conditions.push({ listingType: { in: [params.listingType] } });
  }
  if (params.status !== undefined) {
    conditions.push({ status: { in: [params.status] } });
  }
  if (params.districts !== undefined && params.districts.length > 0) {
    conditions.push({ district: { in: params.districts } });
  }
  if (params.neighborhoodContains !== undefined) {
    conditions.push({
      neighborhood: { ilike: `%${params.neighborhoodContains}%` },
    });
  }
  if (params.priceMin !== undefined) {
    conditions.push({ price: { amountMicros: { gte: params.priceMin } } });
  }
  if (params.priceMax !== undefined) {
    conditions.push({ price: { amountMicros: { lte: params.priceMax } } });
  }
  if (params.sqmNetMin !== undefined) {
    conditions.push({ sqmNet: { gte: params.sqmNetMin } });
  }
  if (params.sqmNetMax !== undefined) {
    conditions.push({ sqmNet: { lte: params.sqmNetMax } });
  }
  if (params.rooms !== undefined && params.rooms.length > 0) {
    conditions.push({ rooms: { in: params.rooms } });
  }
  if (params.buildingAges !== undefined && params.buildingAges.length > 0) {
    conditions.push({ buildingAge: { in: params.buildingAges } });
  }
  if (params.heatings !== undefined && params.heatings.length > 0) {
    conditions.push({ heating: { in: params.heatings } });
  }
  if (params.furnished !== undefined) {
    conditions.push({ furnished: { eq: params.furnished } });
  }

  if (params.features !== undefined && params.features.length > 0) {
    if (params.featuresMode === 'all') {
      for (const feature of params.features) {
        const fieldName = FEATURE_VALUE_TO_FIELD[feature];
        if (fieldName !== undefined) {
          conditions.push({ [fieldName]: { containsAny: [feature] } });
        }
      }
    } else {
      const byField: Record<string, string[]> = {};
      for (const feature of params.features) {
        const fieldName = FEATURE_VALUE_TO_FIELD[feature];
        if (fieldName !== undefined) {
          byField[fieldName] = [...(byField[fieldName] ?? []), feature];
        }
      }
      for (const [fieldName, values] of Object.entries(byField)) {
        conditions.push({ [fieldName]: { containsAny: values } });
      }
    }
  }

  return conditions.length === 0 ? {} : { and: conditions };
};

export const buildOrderBy = (
  params: Pick<PropertySearchParams, 'sortBy' | 'sortDirection'>,
): FilterNode[] => {
  const direction =
    params.sortDirection === 'asc' ? 'AscNullsLast' : 'DescNullsLast';

  if (params.sortBy === 'price') {
    return [{ price: { amountMicros: direction } }];
  }
  if (params.sortBy === 'sqmNet') {
    return [{ sqmNet: direction }];
  }

  return [{ createdAt: direction }];
};
