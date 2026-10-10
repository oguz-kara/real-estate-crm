import { describe, expect, test } from 'vitest';

import { AHMET_NODE, makeClient, makeRunAgent, NOW, textResponse } from 'src/intake/__tests__/run-intake-fakes';
import { handleIntakeRequest } from 'src/intake/handle-intake-request';

describe('handleIntakeRequest', () => {
  test('returns 200 with the intake result', async () => {
    const { client } = makeClient(AHMET_NODE);
    const { runAgent } = makeRunAgent([textResponse({ districts: 'Bornova' })]);
    const response = await handleIntakeRequest(
      { personId: 'p1', text: 'Bornova tarafında ev bakıyor', source: 'TELEFON' },
      { client, runAgent, now: NOW },
    );
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ draftId: 'draft-1', outcome: 'ok' });
  });

  test('maps validation errors to 400 and a missing person to 404', async () => {
    const { runAgent } = makeRunAgent([textResponse({})]);
    const short = await handleIntakeRequest(
      { personId: 'p1', text: 'kısa' },
      { client: makeClient(AHMET_NODE).client, runAgent, now: NOW },
    );
    expect(short).toEqual({ status: 400, body: { error: 'text must be at least 10 characters' } });
    const missing = await handleIntakeRequest(
      { personId: 'nope', text: 'Bornova tarafında ev bakıyor' },
      { client: makeClient(null).client, runAgent, now: NOW },
    );
    expect(missing).toEqual({ status: 404, body: { error: 'person not found' } });
  });

  test('treats a non-object body as a 400 and an unexpected failure as a 500', async () => {
    const { runAgent } = makeRunAgent([textResponse({})]);
    const bad = await handleIntakeRequest('x', { client: makeClient(AHMET_NODE).client, runAgent, now: NOW });
    expect(bad.status).toBe(400);
    const broken = await handleIntakeRequest(
      { personId: 'p1', text: 'Bornova tarafında ev bakıyor' },
      {
        client: {
          query: async () => {
            throw new Error('db down');
          },
          mutation: async () => ({}),
        },
        runAgent,
        now: NOW,
      },
    );
    expect(broken).toEqual({ status: 500, body: { error: 'intake failed' } });
  });
});
