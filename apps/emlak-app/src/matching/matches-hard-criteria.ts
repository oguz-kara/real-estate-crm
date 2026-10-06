import { type MatchProperty, type MatchRequest } from 'src/matching/match-types';

const normalizeDistrict = (value: string): string =>
  value.trim().toLocaleLowerCase('tr-TR');

export const matchesHardCriteria = (
  request: MatchRequest,
  property: MatchProperty,
): boolean => {
  if (property.status !== 'ACTIVE') {
    return false;
  }

  if (request.category !== null && property.category !== request.category) {
    return false;
  }

  if (request.listingType !== null && property.listingType !== request.listingType) {
    return false;
  }

  if (request.budgetMaxMicros !== null) {
    // a price that cannot be verified cannot satisfy a budget cap
    if (property.priceMicros === null || property.priceMicros > request.budgetMaxMicros) {
      return false;
    }
  }

  if (request.districts !== null && request.districts.trim() !== '') {
    const wanted = request.districts
      .split(',')
      .map(normalizeDistrict)
      .filter((district) => district !== '');
    const actual = property.district === null ? null : normalizeDistrict(property.district);
    if (actual === null || !wanted.includes(actual)) {
      return false;
    }
  }

  if (request.rooms !== null && request.rooms.length > 0) {
    if (property.rooms === null || !request.rooms.includes(property.rooms)) {
      return false;
    }
  }

  if (request.excludedFeatures !== null && request.excludedFeatures.length > 0) {
    if (request.excludedFeatures.some((feature) => property.amenities.includes(feature))) {
      return false;
    }
  }

  return true;
};
