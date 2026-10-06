import { defineLogicFunction } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import {
  buildOrderBy,
  buildPropertyFilter,
} from 'src/search/build-property-filter';
import { type PropertySearchParams } from 'src/search/property-search-params.type';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

type SearchPropertiesInput = Omit<
  PropertySearchParams,
  'priceMin' | 'priceMax'
> & {
  // TL for the caller; converted to micros before filtering
  priceMin?: number;
  priceMax?: number;
};

export const searchPropertiesHandler = async (
  input: SearchPropertiesInput,
) => {
  const params: PropertySearchParams = {
    ...input,
    priceMin: input.priceMin === undefined ? undefined : input.priceMin * 1_000_000,
    priceMax: input.priceMax === undefined ? undefined : input.priceMax * 1_000_000,
  };

  const limit = Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT);
  const filter = buildPropertyFilter(params);
  const orderBy = buildOrderBy(params);

  const coreApiClient = new CoreApiClient();
  const queryResult = (await coreApiClient.query({
    properties: {
      __args: {
        ...(Object.keys(filter).length > 0 ? { filter } : {}),
        orderBy,
        first: limit,
      },
      edges: {
        node: {
          id: true,
          name: true,
          price: { amountMicros: true, currencyCode: true },
          category: true,
          listingType: true,
          district: true,
          neighborhood: true,
          rooms: true,
          sqmNet: true,
          status: true,
        },
      },
    },
  })) as {
    properties?: { edges?: Array<{ node: Record<string, unknown> }> };
  };

  const results = (queryResult.properties?.edges ?? []).map(
    (edge) => edge.node,
  );

  return { count: results.length, results };
};

export default defineLogicFunction({
  universalIdentifier: 'fe3cf6a5-6c2d-4c8e-80d2-ca62b5d76018',
  name: 'search-properties',
  description:
    'Portföy (emlak ilanı) arama. Kategori, ilan tipi, ilçe, fiyat aralığı (TL), ' +
    'metrekare, oda sayısı, bina yaşı, ısıtma ve özelliklere (örn. ASANSOR, OTOPARK) ' +
    'göre filtreler; eşleşen portföyleri fiyat ve konum bilgisiyle döndürür. ' +
    'Fiyatlar TL cinsinden verilir. Seçenek değerleri SCREAMING_SNAKE kimliklerdir ' +
    '(örn. category KONUT, rooms R3_1 = "3+1", buildingAge AGE_6_10 = "6-10 arası").',
  timeoutSeconds: 30,
  toolTriggerSettings: {
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          enum: ['KONUT', 'ISYERI', 'ARSA', 'BINA', 'DEVREMULK', 'TURISTIK_TESIS'],
        },
        subTypes: { type: 'array', items: { type: 'string' } },
        listingType: {
          type: 'string',
          enum: ['SATILIK', 'KIRALIK', 'DEVREN_SATILIK', 'DEVREN_KIRALIK'],
        },
        status: {
          type: 'string',
          enum: ['ACTIVE', 'OPTIONED', 'SOLD', 'RENTED', 'PASSIVE'],
        },
        districts: {
          type: 'array',
          items: { type: 'string' },
          description: 'İlçe adları, örn. ["Bornova"]',
        },
        neighborhoodContains: { type: 'string' },
        priceMin: { type: 'number', description: 'TL cinsinden alt sınır' },
        priceMax: { type: 'number', description: 'TL cinsinden üst sınır' },
        sqmNetMin: { type: 'number' },
        sqmNetMax: { type: 'number' },
        rooms: {
          type: 'array',
          items: { type: 'string' },
          description: 'Örn. ["R3_1"] = 3+1',
        },
        buildingAges: { type: 'array', items: { type: 'string' } },
        heatings: { type: 'array', items: { type: 'string' } },
        furnished: { type: 'boolean' },
        features: {
          type: 'array',
          items: { type: 'string' },
          description: 'Özellik kimlikleri, örn. ["ASANSOR", "DENIZ"]',
        },
        featuresMode: { type: 'string', enum: ['any', 'all'] },
        sortBy: { type: 'string', enum: ['price', 'createdAt', 'sqmNet'] },
        sortDirection: { type: 'string', enum: ['asc', 'desc'] },
        limit: { type: 'number' },
      },
    },
  },
  handler: searchPropertiesHandler,
});
