import { describe, expect, test } from 'vitest';

import { runMatchSweep } from 'src/matching/run-match-sweep';
import { type SweepClient } from 'src/follow-up/run-sweep';

const NOW = Date.parse('2026-10-06T12:00:00Z');

const REQUEST_1 = {
  id: 'req-1',
  name: 'Ali — Satılık Daire',
  status: 'AKTIF',
  category: 'KONUT',
  listingType: 'SATILIK',
  budgetMax: { amountMicros: null },
  budgetMin: { amountMicros: null },
  districts: null,
  rooms: null,
  excludedFeatures: null,
  features: null,
  sqmNetMin: null,
};
const REQUEST_2 = { ...REQUEST_1, id: 'req-2', name: 'Veli — Arsa', category: 'ARSA' };

const KONUT_PROPERTY = {
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
  interiorFeatures: null,
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

const makeStub = (options: { failFor?: string } = {}) => {
  const mutations: Array<Record<string, unknown>> = [];
  const client: SweepClient = {
    query: async (payload) => {
      if ('buyerRequests' in payload) {
        const args = (payload.buyerRequests as { __args: Record<string, unknown> }).__args;
        const filter = JSON.stringify(args.filter ?? {});
        // single-request fetch (by id) vs the sweep's AKTIF listing
        if (filter.includes('req-1')) return { buyerRequests: page([REQUEST_1]) };
        if (filter.includes('req-2')) return { buyerRequests: page([REQUEST_2]) };
        return { buyerRequests: page([REQUEST_1, REQUEST_2]) };
      }
      if ('properties' in payload) {
        const args = (payload.properties as { __args: Record<string, unknown> }).__args;
        const filter = JSON.stringify(args.filter ?? {});
        if (options.failFor === 'KONUT' && filter.includes('KONUT')) {
          throw new Error('properties query refused');
        }
        return { properties: page(filter.includes('ARSA') ? [] : [KONUT_PROPERTY]) };
      }
      if ('propertyMatches' in payload) {
        return { propertyMatches: page([]) };
      }
      throw new Error(`unexpected query ${Object.keys(payload).join()}`);
    },
    mutation: async (payload) => {
      mutations.push(payload);
      return { createPropertyMatch: { id: 'm' }, createTask: { id: 't-1' } };
    },
  };
  return { client, mutations };
};

describe('runMatchSweep', () => {
  test('one task per request with new matches, none for requests without', async () => {
    const { client, mutations } = makeStub();
    const result = await runMatchSweep(client, NOW);

    expect(result.requestsScanned).toBe(2);
    expect(result.matchesCreated).toBe(1);
    expect(result.tasksCreated).toBe(1);

    const tasks = mutations.filter((m) => 'createTask' in m) as Array<{
      createTask: { __args: { data: { title: string } } };
    }>;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].createTask.__args.data.title).toContain('Ali — Satılık Daire');
    expect(tasks[0].createTask.__args.data.title).toContain('1');

    const target = mutations.find((m) => 'createTaskTarget' in m) as {
      createTaskTarget: { __args: { data: Record<string, unknown> } };
    };
    expect(target.createTaskTarget.__args.data).toMatchObject({
      targetBuyerRequestId: 'req-1',
    });
  });

  test('one failing request does not abort the sweep (Review Focus 5)', async () => {
    const { client } = makeStub({ failFor: 'KONUT' });
    const result = await runMatchSweep(client, NOW);

    expect(result.errors).toBe(1);
    expect(result.errorSamples[0]).toContain('req-1');
    expect(result.requestsScanned).toBe(2);
  });
});
