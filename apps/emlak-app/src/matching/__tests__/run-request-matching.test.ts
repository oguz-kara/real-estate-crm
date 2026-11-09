import { describe, expect, test } from 'vitest';

import { runRequestMatching } from 'src/matching/run-request-matching';
import { type SweepClient } from 'src/follow-up/run-sweep';

const NOW = Date.parse('2026-10-06T12:00:00Z');

type StubConfig = {
  request?: Record<string, unknown> | null;
  properties?: Array<Record<string, unknown>>;
  existingMatches?: Array<Record<string, unknown>>;
  failPropertiesQuery?: boolean;
  // one entry per createPropertyMatch call: an error message to throw, or null
  createFailures?: Array<string | null>;
};

const REQUEST = {
  id: 'req-1',
  name: 'Ali — Satılık Daire',
  status: 'AKTIF',
  category: 'KONUT',
  listingType: 'SATILIK',
  budgetMax: { amountMicros: 10_000_000_000_000 },
  budgetMin: { amountMicros: null },
  districts: 'Bornova',
  rooms: ['R3_1'],
  excludedFeatures: null,
  features: null,
  sqmNetMin: null,
};

const PROPERTY = {
  id: 'prop-1',
  name: 'Bornova 3+1',
  status: 'ACTIVE',
  category: 'KONUT',
  listingType: 'SATILIK',
  price: { amountMicros: 8_000_000_000_000 },
  district: 'Bornova',
  rooms: 'R3_1',
  sqmNet: 110,
  createdAt: '2026-10-01T00:00:00Z',
  interiorFeatures: ['KLIMA'],
  exteriorFeatures: null,
  neighborhoodFeatures: null,
  transportFeatures: null,
  view: null,
  infrastructure: null,
  facade: null,
  businessFeatures: null,
};

const page = (nodes: Array<Record<string, unknown>>) => ({
  edges: nodes.map((node) => ({ node })),
  pageInfo: { hasNextPage: false, endCursor: null },
});

const makeStub = (config: StubConfig) => {
  const mutations: Array<Record<string, unknown>> = [];
  const client: SweepClient = {
    query: async (payload) => {
      if ('buyerRequests' in payload) {
        return { buyerRequests: page(config.request ? [config.request] : []) };
      }
      if ('properties' in payload) {
        if (config.failPropertiesQuery) {
          throw new Error('properties query refused');
        }
        return { properties: page(config.properties ?? []) };
      }
      if ('propertyMatches' in payload) {
        return { propertyMatches: page(config.existingMatches ?? []) };
      }
      throw new Error(`unexpected query ${Object.keys(payload).join()}`);
    },
    mutation: async (payload) => {
      mutations.push(payload);
      if ('createPropertyMatch' in payload) {
        const failure = config.createFailures?.shift();
        if (failure != null) {
          throw new Error(failure);
        }
      }
      return { createPropertyMatch: { id: 'match-x' } };
    },
  };
  return { client, mutations };
};

describe('runRequestMatching', () => {
  test('a new matching property births a YENI match with its score', async () => {
    const { client, mutations } = makeStub({ request: REQUEST, properties: [PROPERTY] });
    const result = await runRequestMatching(client, 'req-1', NOW);

    expect(result.created).toBe(1);
    expect(result.topMatches[0]).toMatchObject({ propertyId: 'prop-1', score: 100 });
    const create = mutations.find((m) => 'createPropertyMatch' in m) as {
      createPropertyMatch: { __args: { data: Record<string, unknown> } };
    };
    expect(create.createPropertyMatch.__args.data).toMatchObject({
      requestId: 'req-1',
      propertyId: 'prop-1',
      status: 'YENI',
      score: 100,
    });
  });

  test('an existing pair only refreshes the score — status is never touched', async () => {
    const { client, mutations } = makeStub({
      request: REQUEST,
      properties: [PROPERTY],
      existingMatches: [
        {
          id: 'match-1',
          name: 'Ali — Satılık Daire ↔ Bornova 3+1',
          propertyId: 'prop-1',
          score: 80,
          status: 'BEGENMEDI',
        },
      ],
    });
    const result = await runRequestMatching(client, 'req-1', NOW);

    expect(result.created).toBe(0);
    expect(result.refreshed).toBe(1);
    const update = mutations.find((m) => 'updatePropertyMatch' in m) as {
      updatePropertyMatch: { __args: { id: string; data: Record<string, unknown> } };
    };
    expect(update.updatePropertyMatch.__args.id).toBe('match-1');
    expect(Object.keys(update.updatePropertyMatch.__args.data)).toEqual(['score']);
  });

  test('an unchanged existing pair produces no mutations at all', async () => {
    const { client, mutations } = makeStub({
      request: REQUEST,
      properties: [PROPERTY],
      existingMatches: [
        {
          id: 'match-1',
          name: 'Ali — Satılık Daire ↔ Bornova 3+1',
          propertyId: 'prop-1',
          score: 100,
          status: 'GOSTERILDI',
        },
      ],
    });
    const result = await runRequestMatching(client, 'req-1', NOW);
    expect(result.created).toBe(0);
    expect(result.refreshed).toBe(0);
    expect(mutations).toHaveLength(0);
  });

  test('a hard-eliminated property is never written', async () => {
    const { client, mutations } = makeStub({
      request: REQUEST,
      properties: [{ ...PROPERTY, district: 'Karaburun' }],
    });
    const result = await runRequestMatching(client, 'req-1', NOW);
    expect(result.matched).toBe(0);
    expect(mutations).toHaveLength(0);
  });

  test('topMatches carry price, district, status and isNew for the tool output', async () => {
    const { client } = makeStub({ request: REQUEST, properties: [PROPERTY] });
    const result = await runRequestMatching(client, 'req-1', NOW);

    expect(result.topMatches[0]).toEqual({
      propertyId: 'prop-1',
      propertyName: 'Bornova 3+1',
      priceTl: 8_000_000,
      district: 'Bornova',
      score: 100,
      status: 'YENI',
      isNew: true,
    });
    expect(result.newMatches).toEqual(result.topMatches);
  });

  test('a unique-index collision means the pair already exists — tolerated, loop continues', async () => {
    const secondProperty = { ...PROPERTY, id: 'prop-2', name: 'Bornova 3+1 B' };
    const { client, mutations } = makeStub({
      request: REQUEST,
      properties: [PROPERTY, secondProperty],
      createFailures: ['duplicate key value violates unique constraint', null],
    });
    const result = await runRequestMatching(client, 'req-1', NOW);

    expect(result.created).toBe(1);
    expect(result.errors).toBe(0);
    expect(mutations.filter((m) => 'createPropertyMatch' in m)).toHaveLength(2);
  });

  test('a transient write error is counted and does not lose the other creations', async () => {
    const secondProperty = { ...PROPERTY, id: 'prop-2', name: 'Bornova 3+1 B' };
    const { client } = makeStub({
      request: REQUEST,
      properties: [PROPERTY, secondProperty],
      createFailures: ['socket hang up', null],
    });
    const result = await runRequestMatching(client, 'req-1', NOW);

    expect(result.created).toBe(1);
    expect(result.errors).toBe(1);
    expect(result.newMatches).toHaveLength(1);
  });

  test('a non-active request is skipped entirely', async () => {
    const { client, mutations } = makeStub({
      request: { ...REQUEST, status: 'SONUCLANDI' },
      properties: [PROPERTY],
    });
    const result = await runRequestMatching(client, 'req-1', NOW);
    expect(result).toMatchObject({ considered: 0, matched: 0, created: 0 });
    expect(mutations).toHaveLength(0);
  });
});
