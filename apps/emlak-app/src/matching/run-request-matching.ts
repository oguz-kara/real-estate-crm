import { AMENITY_VALUE_TO_FIELD } from 'src/constants/property-options';
import {
  type ConnectionPage,
  fetchAllPages,
  PAGE_SIZE,
  type SweepClient,
} from 'src/follow-up/run-sweep';
import { matchesHardCriteria } from 'src/matching/matches-hard-criteria';
import { type MatchProperty, type MatchRequest } from 'src/matching/match-types';
import { buildRequestSearchParams } from 'src/matching/request-search-params';
import { scoreMatch } from 'src/matching/score-match';
import { buildPropertyFilter } from 'src/search/build-property-filter';

export type RequestMatchingResult = {
  requestId: string;
  requestName: string | null;
  considered: number;
  matched: number;
  created: number;
  refreshed: number;
  topMatches: Array<{ propertyId: string; propertyName: string | null; score: number }>;
};

const TOP_MATCHES_LIMIT = 5;

const AMENITY_FIELD_NAMES = [...new Set(Object.values(AMENITY_VALUE_TO_FIELD))];

type RequestNode = {
  id: string;
  name: string | null;
  status: string | null;
  category: string | null;
  listingType: string | null;
  budgetMax: { amountMicros: number | string | null } | null;
  budgetMin: { amountMicros: number | string | null } | null;
  districts: string | null;
  rooms: string[] | null;
  excludedFeatures: string[] | null;
  features: string[] | null;
  sqmNetMin: number | null;
};

type PropertyNode = {
  id: string;
  name: string | null;
  status: string | null;
  category: string | null;
  listingType: string | null;
  price: { amountMicros: number | string | null } | null;
  district: string | null;
  rooms: string | null;
  sqmNet: number | null;
  createdAt: string;
} & Record<string, unknown>;

type MatchNode = {
  id: string;
  name: string | null;
  propertyId: string | null;
  score: number | null;
  status: string | null;
};

const toMicros = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toMatchRequest = (node: RequestNode): MatchRequest => ({
  status: node.status,
  category: node.category,
  listingType: node.listingType,
  budgetMaxMicros: toMicros(node.budgetMax?.amountMicros),
  budgetMinMicros: toMicros(node.budgetMin?.amountMicros),
  districts: node.districts,
  rooms: node.rooms,
  excludedFeatures: node.excludedFeatures,
  features: node.features,
  sqmNetMin: node.sqmNetMin,
});

const toMatchProperty = (node: PropertyNode): MatchProperty => ({
  id: node.id,
  name: node.name,
  status: node.status,
  category: node.category,
  listingType: node.listingType,
  priceMicros: toMicros(node.price?.amountMicros),
  district: node.district,
  rooms: node.rooms,
  sqmNet: node.sqmNet,
  createdAt: node.createdAt,
  amenities: AMENITY_FIELD_NAMES.flatMap((fieldName) => {
    const values = node[fieldName];
    return Array.isArray(values) ? (values as string[]) : [];
  }),
});

const fetchRequest = async (
  client: SweepClient,
  requestId: string,
): Promise<RequestNode | undefined> => {
  const result = (await client.query({
    buyerRequests: {
      __args: { filter: { id: { eq: requestId } }, first: 1 },
      edges: {
        node: {
          id: true,
          name: true,
          status: true,
          category: true,
          listingType: true,
          budgetMax: { amountMicros: true },
          budgetMin: { amountMicros: true },
          districts: true,
          rooms: true,
          excludedFeatures: true,
          features: true,
          sqmNetMin: true,
        },
      },
    },
  })) as { buyerRequests?: ConnectionPage<RequestNode> };

  return result.buyerRequests?.edges?.[0]?.node;
};

const fetchCandidateProperties = (
  client: SweepClient,
  request: MatchRequest,
): Promise<PropertyNode[]> => {
  const filter = buildPropertyFilter(buildRequestSearchParams(request));

  return fetchAllPages(async (after) => {
    const result = (await client.query({
      properties: {
        __args: {
          filter,
          first: PAGE_SIZE,
          ...(after === undefined ? {} : { after }),
        },
        edges: {
          node: {
            id: true,
            name: true,
            status: true,
            category: true,
            listingType: true,
            price: { amountMicros: true },
            district: true,
            rooms: true,
            sqmNet: true,
            createdAt: true,
            ...Object.fromEntries(AMENITY_FIELD_NAMES.map((fieldName) => [fieldName, true])),
          },
        },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    })) as { properties?: ConnectionPage<PropertyNode> };

    return result.properties;
  });
};

const fetchExistingMatches = (
  client: SweepClient,
  requestId: string,
): Promise<MatchNode[]> =>
  fetchAllPages(async (after) => {
    const result = (await client.query({
      propertyMatches: {
        __args: {
          filter: { requestId: { eq: requestId } },
          first: PAGE_SIZE,
          ...(after === undefined ? {} : { after }),
        },
        edges: {
          node: { id: true, name: true, propertyId: true, score: true, status: true },
        },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    })) as { propertyMatches?: ConnectionPage<MatchNode> };

    return result.propertyMatches;
  });

export const runRequestMatching = async (
  client: SweepClient,
  requestId: string,
  now: number,
): Promise<RequestMatchingResult> => {
  const result: RequestMatchingResult = {
    requestId,
    requestName: null,
    considered: 0,
    matched: 0,
    created: 0,
    refreshed: 0,
    topMatches: [],
  };

  const requestNode = await fetchRequest(client, requestId);
  if (requestNode === undefined || requestNode.status !== 'AKTIF') {
    return result;
  }
  result.requestName = requestNode.name;

  const request = toMatchRequest(requestNode);
  const properties = await fetchCandidateProperties(client, request);
  result.considered = properties.length;

  const candidates = properties
    .map(toMatchProperty)
    .filter((property) => matchesHardCriteria(request, property))
    .map((property) => ({ property, score: scoreMatch(request, property, now) }))
    .sort((left, right) => right.score - left.score);
  result.matched = candidates.length;
  result.topMatches = candidates.slice(0, TOP_MATCHES_LIMIT).map((candidate) => ({
    propertyId: candidate.property.id,
    propertyName: candidate.property.name,
    score: candidate.score,
  }));

  const existingByPropertyId = new Map<string, MatchNode>();
  for (const match of await fetchExistingMatches(client, requestId)) {
    if (match.propertyId !== null) {
      existingByPropertyId.set(match.propertyId, match);
    }
  }

  for (const candidate of candidates) {
    const existing = existingByPropertyId.get(candidate.property.id);
    const matchName = `${requestNode.name ?? 'Talep'} ↔ ${candidate.property.name ?? 'Portföy'}`;

    if (existing === undefined) {
      await client.mutation({
        createPropertyMatch: {
          __args: {
            data: {
              name: matchName,
              requestId,
              propertyId: candidate.property.id,
              score: candidate.score,
              status: 'YENI',
            },
          },
          id: true,
        },
      });
      result.created += 1;
      continue;
    }

    // the score and name follow the data, the status belongs to the office:
    // BEGENMEDI and friends are never overwritten after birth
    const changedFields: Record<string, unknown> = {};
    if (Number(existing.score) !== candidate.score) changedFields.score = candidate.score;
    if (existing.name !== matchName) changedFields.name = matchName;

    if (Object.keys(changedFields).length > 0) {
      await client.mutation({
        updatePropertyMatch: {
          __args: { id: existing.id, data: changedFields },
          id: true,
        },
      });
      result.refreshed += 1;
    }
  }

  return result;
};
