import { describe, expect, test } from 'vitest';

import { runFollowUpSweep, type SweepClient } from 'src/follow-up/run-sweep';

const NOW = Date.parse('2026-10-06T12:00:00Z');
const daysAgo = (days: number) => new Date(NOW - days * 86_400_000).toISOString();

type Call = { kind: 'query' | 'mutation'; payload: Record<string, unknown> };

type StubConfig = {
  peoplePages: Array<Array<Record<string, unknown>>>;
  noteTargetPages?: Array<Array<{ targetPersonId: string; createdAt: string }>>;
  taskTargetPages?: Array<Array<{ targetPersonId: string; status: string; updatedAt: string }>>;
  failCreateTaskFor?: string[];
  createTaskReturnsNoId?: boolean;
};

const person = (
  id: string,
  stage: string | null,
  overrides: Record<string, unknown> = {},
) => ({
  id,
  name: { firstName: 'TT', lastName: id },
  followUpStage: stage,
  followUpStatus: null,
  lastTouchedAt: null,
  followUpTaskCreatedAt: null,
  ...overrides,
});

const makeStub = (config: StubConfig) => {
  const calls: Call[] = [];
  let taskCounter = 0;

  const pageOf = <TNode>(pages: TNode[][], index: number) => ({
    edges: (pages[index] ?? []).map((node) => ({ node })),
    pageInfo: {
      hasNextPage: index + 1 < pages.length,
      endCursor: index + 1 < pages.length ? `cursor-${index + 1}` : null,
    },
  });

  const cursorIndex = (args: Record<string, unknown> | undefined) => {
    const after = args?.after as string | undefined;
    return after === undefined ? 0 : Number(after.split('-')[1]);
  };

  const client: SweepClient = {
    query: async (payload) => {
      calls.push({ kind: 'query', payload });
      if ('people' in payload) {
        const args = (payload.people as { __args?: Record<string, unknown> }).__args;
        return { people: pageOf(config.peoplePages, cursorIndex(args)) };
      }
      if ('noteTargets' in payload) {
        const args = (payload.noteTargets as { __args?: Record<string, unknown> }).__args;
        const pages = (config.noteTargetPages ?? [[]]).map((page) =>
          page.map((entry) => ({
            targetPersonId: entry.targetPersonId,
            note: { createdAt: entry.createdAt },
          })),
        );
        return { noteTargets: pageOf(pages, cursorIndex(args)) };
      }
      if ('taskTargets' in payload) {
        const args = (payload.taskTargets as { __args?: Record<string, unknown> }).__args;
        const pages = (config.taskTargetPages ?? [[]]).map((page) =>
          page.map((entry) => ({
            targetPersonId: entry.targetPersonId,
            task: { status: entry.status, updatedAt: entry.updatedAt },
          })),
        );
        return { taskTargets: pageOf(pages, cursorIndex(args)) };
      }
      throw new Error(`unexpected query ${Object.keys(payload).join()}`);
    },
    mutation: async (payload) => {
      calls.push({ kind: 'mutation', payload });
      if ('createTask' in payload) {
        const title = (
          payload.createTask as { __args: { data: { title: string } } }
        ).__args.data.title;
        const failing = (config.failCreateTaskFor ?? []).find((id) =>
          title.includes(id),
        );
        if (failing !== undefined) {
          throw new Error(`createTask refused for ${failing}`);
        }
        if (config.createTaskReturnsNoId) {
          return { createTask: {} };
        }
        taskCounter += 1;
        return { createTask: { id: `task-${taskCounter}` } };
      }
      return {};
    },
  };

  return { client, calls };
};

const personUpdates = (calls: Call[], personId: string) =>
  calls
    .filter((call) => call.kind === 'mutation' && 'updatePerson' in call.payload)
    .map(
      (call) =>
        (call.payload.updatePerson as {
          __args: { id: string; data: Record<string, unknown> };
        }).__args,
    )
    .filter((args) => args.id === personId);

describe('runFollowUpSweep', () => {
  test('people fetch pages to exhaustion (Review Focus 5)', async () => {
    const { client } = makeStub({
      peoplePages: [
        [person('p1', 'SICAK'), person('p2', 'ILIK')],
        [person('p3', 'UZUN_VADELI')],
      ],
    });
    const result = await runFollowUpSweep(client, NOW);
    expect(result.scanned).toBe(3);
  });

  test('touch queries page to exhaustion: a note on the second page still counts', async () => {
    const { client } = makeStub({
      peoplePages: [[person('p1', 'SICAK')]],
      noteTargetPages: [
        [{ targetPersonId: 'p1', createdAt: daysAgo(40) }],
        [{ targetPersonId: 'p1', createdAt: daysAgo(1) }],
      ],
    });
    const result = await runFollowUpSweep(client, NOW);
    expect(result.takipte).toBe(1);
    expect(result.tasksCreated).toBe(0);
  });

  test('only DONE tasks count as touches', async () => {
    const { client } = makeStub({
      peoplePages: [[person('p1', 'SICAK')]],
      taskTargetPages: [
        [
          { targetPersonId: 'p1', status: 'TODO', updatedAt: daysAgo(0) },
          { targetPersonId: 'p1', status: 'DONE', updatedAt: daysAgo(10) },
        ],
      ],
    });
    const result = await runFollowUpSweep(client, NOW);
    expect(result.gecikmis).toBe(1);
  });

  test('one failing task creation does not abort the sweep and writes no marker (Review Focus 3)', async () => {
    const { client, calls } = makeStub({
      peoplePages: [[person('p1', 'SICAK'), person('p2', 'SICAK')]],
      failCreateTaskFor: ['p1'],
    });
    const result = await runFollowUpSweep(client, NOW);
    expect(result.errors).toBe(1);
    expect(result.errorSamples[0]).toContain('p1');
    expect(result.tasksCreated).toBe(1);
    expect(personUpdates(calls, 'p1')).toHaveLength(0);
    expect(personUpdates(calls, 'p2')).toHaveLength(1);
  });

  test('createTask without an id counts as an error, never a phantom marker', async () => {
    const { client, calls } = makeStub({
      peoplePages: [[person('p1', 'SICAK')]],
      createTaskReturnsNoId: true,
    });
    const result = await runFollowUpSweep(client, NOW);
    expect(result.tasksCreated).toBe(0);
    expect(result.errors).toBe(1);
    expect(personUpdates(calls, 'p1')).toHaveLength(0);
  });

  test('unknown stage is skipped untouched, not wiped (drifted option set)', async () => {
    const { client, calls } = makeStub({
      peoplePages: [
        [person('p1', 'COK_SICAK', { followUpStatus: 'TAKIPTE' })],
      ],
    });
    const result = await runFollowUpSweep(client, NOW);
    expect(result.skippedUnknownStage).toBe(1);
    expect(personUpdates(calls, 'p1')).toHaveLength(0);
  });

  test('stage cleared → status, touch and marker are nulled (un-enroll)', async () => {
    const { client, calls } = makeStub({
      peoplePages: [
        [person('p1', null, { followUpStatus: 'VADESI_GELDI' })],
      ],
    });
    const result = await runFollowUpSweep(client, NOW);
    expect(result.cleared).toBe(1);
    expect(personUpdates(calls, 'p1')[0].data).toEqual({
      followUpStatus: null,
      lastTouchedAt: null,
      followUpTaskCreatedAt: null,
    });
  });

  test('the lapse task is created before the marker is written', async () => {
    const { client, calls } = makeStub({
      peoplePages: [[person('p1', 'SICAK')]],
    });
    await runFollowUpSweep(client, NOW);
    const order = calls
      .filter((call) => call.kind === 'mutation')
      .map((call) => Object.keys(call.payload)[0]);
    expect(order.indexOf('createTask')).toBeLessThan(order.indexOf('updatePerson'));
  });
});
