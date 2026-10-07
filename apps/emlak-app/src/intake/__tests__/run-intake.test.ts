import { describe, expect, test } from 'vitest';

import {
  AHMET_NODE,
  dataOf,
  makeClient,
  makeRunAgent,
  NOW,
  textResponse,
} from 'src/intake/__tests__/run-intake-fakes';
import { runIntake } from 'src/intake/run-intake';

const TEXT =
  "Ahmet Yılmaz 0532 456 78 90. İzmir Çeşme'de villa bakıyor. Bütçesi 1.2 milyon euroya kadar. 4 veya 5 oda, özel havuz ve bahçe. Yazlık, Haziran içinde almak istiyor.";

const CESME_RAW = {
  category: 'KONUT',
  listingType: 'SATILIK',
  rooms: '4 veya 5 oda',
  districts: 'Çeşme',
  features: 'özel havuz, bahçe',
  budgetMax: '1.2 milyon euro',
  budgetCurrency: 'EUR',
  leftover: 'Yazlık, Haziran içinde',
  evidence: '{"budgetMax":"1.2 milyon euroya kadar"}',
};

describe('runIntake', () => {
  test('happy path: masks, extracts, normalizes, creates TASLAK draft and a task with two targets', async () => {
    const { client, mutations } = makeClient(AHMET_NODE);
    const { runAgent, prompts } = makeRunAgent([textResponse(CESME_RAW)]);

    const result = await runIntake(client, runAgent, { personId: 'p1', text: TEXT, source: 'WHATSAPP' }, NOW);

    expect(result).toEqual({
      draftId: 'draft-1',
      missingFields: ['budgetMin', 'sqmNetMin'],
      summary: 'Satılık · Çeşme · 1.200.000 EUR · 4+1, 5+1',
      outcome: 'ok',
    });
    expect(prompts).toHaveLength(1);
    expect(prompts[0]).toContain('[MÜŞTERİ]');
    expect(prompts[0]).toContain('[TELEFON_1]');
    expect(prompts[0]).not.toMatch(/Ahmet|Yılmaz|532/);

    const draft = dataOf(mutations[0], 'createBuyerRequest');
    expect(draft).toMatchObject({
      name: 'Ahmet Yılmaz talebi',
      status: 'TASLAK',
      buyerId: 'p1',
      source: 'WHATSAPP',
      sourceText: TEXT,
      category: 'KONUT',
      listingType: 'SATILIK',
      rooms: ['R4_1', 'R5_1'],
      districts: 'Çeşme',
      features: ['MUSTAKIL_HAVUZLU', 'BAHCE'],
      budgetMax: { amountMicros: 1_200_000_000_000, currencyCode: 'EUR' },
      notes: '[otomatik] Yazlık, Haziran içinde',
    });
    expect(draft).not.toHaveProperty('budgetMin');
    expect(draft).not.toHaveProperty('sqmNetMin');
    const extraction = draft.extraction as Record<string, unknown>;
    expect(extraction).toMatchObject({
      outcome: 'ok',
      missingFields: ['budgetMin', 'sqmNetMin'],
      model: 'deepseek/deepseek-flash',
      extractedAt: '2026-10-07T10:00:00.000Z',
      evidence: { budgetMax: '1.2 milyon euroya kadar' },
    });
    expect(extraction.maskedText).not.toMatch(/Ahmet|532/);

    const task = dataOf(mutations[1], 'createTask');
    expect(task.title).toBe('Taslak talebi onayla: Ahmet Yılmaz');
    expect(task.status).toBe('TODO');
    expect(task.dueAt).toBe('2026-10-07T10:00:00.000Z');
    expect(JSON.stringify(task.bodyV2)).toContain('Onay Bekleyen Talepler');
    expect(JSON.stringify(task.bodyV2)).not.toContain('0532');
    expect(dataOf(mutations[2], 'createTaskTarget')).toEqual({ taskId: 'task-1', targetBuyerRequestId: 'draft-1' });
    expect(dataOf(mutations[3], 'createTaskTarget')).toEqual({ taskId: 'task-1', targetPersonId: 'p1' });
  });

  test('extraction failure after one retry still creates a draft with only sourceText', async () => {
    const { client, mutations } = makeClient(AHMET_NODE);
    const { runAgent, prompts } = makeRunAgent([{ success: false, error: 'boom' }]);

    const result = await runIntake(client, runAgent, { personId: 'p1', text: TEXT }, NOW);

    expect(prompts).toHaveLength(2);
    expect(result.outcome).toBe('extraction-failed');
    const draft = dataOf(mutations[0], 'createBuyerRequest');
    expect((draft.extraction as Record<string, unknown>).outcome).toBe('extraction-failed');
    expect(draft.sourceText).toBe(TEXT);
    expect(draft).not.toHaveProperty('category');
    expect(draft).not.toHaveProperty('source');
    expect(mutations.map((mutation) => Object.keys(mutation)[0])).toEqual([
      'createBuyerRequest',
      'createTask',
      'createTaskTarget',
      'createTaskTarget',
    ]);
  });

  test('invalid json from the agent counts as a failure, and a good retry recovers', async () => {
    const { client } = makeClient(AHMET_NODE);
    const { runAgent, prompts } = makeRunAgent([
      { success: true, result: { response: 'Üzgünüm, anlayamadım.' } },
      textResponse(CESME_RAW),
    ]);

    const result = await runIntake(client, runAgent, { personId: 'p1', text: TEXT }, NOW);

    expect(prompts).toHaveLength(2);
    expect(result.outcome).toBe('ok');
  });

  test('a throwing agent runner is treated like a failed run', async () => {
    const { client } = makeClient(AHMET_NODE);
    const result = await runIntake(
      client,
      async () => {
        throw new Error('network');
      },
      { personId: 'p1', text: TEXT },
      NOW,
    );
    expect(result.outcome).toBe('extraction-failed');
  });

  test('creates an empty draft for non-request text', async () => {
    const { client, mutations } = makeClient(AHMET_NODE);
    const { runAgent } = makeRunAgent([textResponse({})]);

    const result = await runIntake(client, runAgent, { personId: 'p1', text: 'Teşekkürler, görüşürüz, iyi günler.' }, NOW);

    expect(result.missingFields).toEqual(['category', 'listingType', 'rooms', 'districts', 'budgetMin', 'budgetMax', 'sqmNetMin']);
    expect(result.summary).toContain('talep kriteri bulunamadı');
    expect(result.outcome).toBe('ok');
    expect(dataOf(mutations[0], 'createBuyerRequest').status).toBe('TASLAK');
  });

  test('rejects short text with 400 and unknown person with 404, before any write', async () => {
    const { client, mutations } = makeClient(AHMET_NODE);
    const { runAgent } = makeRunAgent([textResponse(CESME_RAW)]);
    await expect(runIntake(client, runAgent, { personId: 'p1', text: '  kısa   ' }, NOW)).rejects.toMatchObject({ status: 400 });
    await expect(runIntake(client, runAgent, { personId: '', text: TEXT }, NOW)).rejects.toMatchObject({ status: 400 });
    await expect(
      runIntake(client, runAgent, { personId: 'p1', text: TEXT, source: 'FAKS' as never }, NOW),
    ).rejects.toMatchObject({ status: 400 });

    const missing = makeClient(null);
    await expect(runIntake(missing.client, runAgent, { personId: 'nope', text: TEXT }, NOW)).rejects.toMatchObject({ status: 404 });
    expect(mutations).toHaveLength(0);
    expect(missing.mutations).toHaveLength(0);
  });

  test('works for a person without a name: phones masked, task title uses "Talep"', async () => {
    const { client, mutations } = makeClient({ ...AHMET_NODE, name: { firstName: '', lastName: '' } });
    const { runAgent, prompts } = makeRunAgent([textResponse(CESME_RAW)]);

    await runIntake(client, runAgent, { personId: 'p1', text: TEXT }, NOW);

    expect(prompts[0]).not.toContain('532');
    expect(dataOf(mutations[0], 'createBuyerRequest').name).toBe('Talep');
    expect(dataOf(mutations[1], 'createTask').title).toBe('Taslak talebi onayla: Talep');
  });
});
