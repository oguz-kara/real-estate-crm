import { resolveLabel } from 'src/constants/app-locale';
import { FOLLOW_UP_THRESHOLD_DAYS } from 'src/constants/follow-up-thresholds';
import { computeFollowUpStatus } from 'src/follow-up/compute-follow-up-status';
import { latestTouch } from 'src/follow-up/latest-touch';
import { shouldCreateTask } from 'src/follow-up/should-create-task';

// Minimal client surface so the whole sweep is testable with a stub;
// CoreApiClient satisfies it structurally.
export type SweepClient = {
  query: (payload: Record<string, unknown>) => Promise<unknown>;
  mutation: (payload: Record<string, unknown>) => Promise<unknown>;
};

export type SweepResult = {
  scanned: number;
  takipte: number;
  vadesiGeldi: number;
  gecikmis: number;
  cleared: number;
  skippedUnknownStage: number;
  tasksCreated: number;
  errors: number;
  errorSamples: string[];
};

// The server caps every top-level page at 60; nested relation selections
// are capped at 60 UNORDERED rows with the nested `first` ignored, which
// is why touches are fetched with top-level queries paged to exhaustion.
export const PAGE_SIZE = 60;

type TrackedPerson = {
  id: string;
  name: { firstName: string | null; lastName: string | null } | null;
  followUpStage: string | null;
  followUpStatus: string | null;
  lastTouchedAt: string | null;
  followUpTaskCreatedAt: string | null;
};

export type ConnectionPage<TNode> = {
  edges?: Array<{ node: TNode }>;
  pageInfo?: { hasNextPage?: boolean; endCursor?: string | null };
};

export const fetchAllPages = async <TNode>(
  fetchPage: (after: string | undefined) => Promise<ConnectionPage<TNode> | undefined>,
): Promise<TNode[]> => {
  const nodes: TNode[] = [];
  let after: string | undefined;

  for (;;) {
    const page = await fetchPage(after);
    nodes.push(...(page?.edges ?? []).map((edge) => edge.node));

    const endCursor = page?.pageInfo?.endCursor;
    if (!page?.pageInfo?.hasNextPage || endCursor === null || endCursor === undefined) {
      return nodes;
    }
    after = endCursor;
  }
};

const fetchTrackedPeople = (client: SweepClient): Promise<TrackedPerson[]> =>
  fetchAllPages(async (after) => {
    const result = (await client.query({
      people: {
        __args: {
          // stage-less people with leftover follow-up state must be fetched
          // too, so un-enrolling clears them out of the follow-up view
          filter: {
            or: [
              { followUpStage: { is: 'NOT_NULL' } },
              { followUpStatus: { is: 'NOT_NULL' } },
            ],
          },
          first: PAGE_SIZE,
          ...(after === undefined ? {} : { after }),
        },
        edges: {
          node: {
            id: true,
            name: { firstName: true, lastName: true },
            followUpStage: true,
            followUpStatus: true,
            lastTouchedAt: true,
            followUpTaskCreatedAt: true,
          },
        },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    })) as { people?: ConnectionPage<TrackedPerson> };

    return result.people;
  });

const fetchTouchDates = async (
  client: SweepClient,
  personIds: string[],
): Promise<Map<string, { notes: string[]; doneTasks: string[] }>> => {
  const touches = new Map<string, { notes: string[]; doneTasks: string[] }>();
  for (const personId of personIds) {
    touches.set(personId, { notes: [], doneTasks: [] });
  }

  const noteNodes = await fetchAllPages<{
    targetPersonId: string | null;
    note: { createdAt: string } | null;
  }>(async (after) => {
    const result = (await client.query({
      noteTargets: {
        __args: {
          filter: { targetPersonId: { in: personIds } },
          first: PAGE_SIZE,
          ...(after === undefined ? {} : { after }),
        },
        edges: { node: { targetPersonId: true, note: { createdAt: true } } },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    })) as {
      noteTargets?: ConnectionPage<{
        targetPersonId: string | null;
        note: { createdAt: string } | null;
      }>;
    };

    return result.noteTargets;
  });

  const taskNodes = await fetchAllPages<{
    targetPersonId: string | null;
    task: { status: string | null; updatedAt: string } | null;
  }>(async (after) => {
    const result = (await client.query({
      taskTargets: {
        __args: {
          filter: { targetPersonId: { in: personIds } },
          first: PAGE_SIZE,
          ...(after === undefined ? {} : { after }),
        },
        edges: {
          node: { targetPersonId: true, task: { status: true, updatedAt: true } },
        },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    })) as {
      taskTargets?: ConnectionPage<{
        targetPersonId: string | null;
        task: { status: string | null; updatedAt: string } | null;
      }>;
    };

    return result.taskTargets;
  });

  for (const node of noteNodes) {
    if (node.targetPersonId !== null && node.note !== null) {
      touches.get(node.targetPersonId)?.notes.push(node.note.createdAt);
    }
  }
  for (const node of taskNodes) {
    if (node.targetPersonId !== null && node.task !== null && node.task.status === 'DONE') {
      touches.get(node.targetPersonId)?.doneTasks.push(node.task.updatedAt);
    }
  }

  return touches;
};

const createLapseTask = async (
  client: SweepClient,
  person: TrackedPerson,
  daysSinceTouch: number | null,
  nowIso: string,
): Promise<void> => {
  const personName = [person.name?.firstName, person.name?.lastName]
    .filter((part) => part)
    .join(' ');
  const daysText =
    daysSinceTouch === null
      ? resolveLabel({ tr: 'hiç temas kaydı yok', en: 'no recorded touch yet' })
      : resolveLabel({
          tr: `${daysSinceTouch} gündür temas yok`,
          en: `${daysSinceTouch} days without contact`,
        });

  const created = (await client.mutation({
    createTask: {
      __args: {
        data: {
          title: resolveLabel({
            tr: `Takip: ${personName}`,
            en: `Follow up: ${personName}`,
          }),
          bodyV2: {
            markdown: resolveLabel({
              tr: `Aşama: ${person.followUpStage} — ${daysText}.`,
              en: `Stage: ${person.followUpStage} — ${daysText}.`,
            }),
          },
          status: 'TODO',
          dueAt: nowIso,
        },
      },
      id: true,
    },
  })) as { createTask?: { id?: string } };

  const taskId = created.createTask?.id;
  if (taskId === undefined) {
    // a marker must never be written for a task that does not exist
    throw new Error('createTask returned no id');
  }

  await client.mutation({
    createTaskTarget: {
      __args: { data: { taskId, targetPersonId: person.id } },
      id: true,
    },
  });
};

export const runFollowUpSweep = async (
  client: SweepClient,
  now: number,
): Promise<SweepResult> => {
  const nowIso = new Date(now).toISOString();
  const result: SweepResult = {
    scanned: 0,
    takipte: 0,
    vadesiGeldi: 0,
    gecikmis: 0,
    cleared: 0,
    skippedUnknownStage: 0,
    tasksCreated: 0,
    errors: 0,
    errorSamples: [],
  };

  const people = await fetchTrackedPeople(client);
  result.scanned = people.length;

  for (let start = 0; start < people.length; start += PAGE_SIZE) {
    const batch = people.slice(start, start + PAGE_SIZE);
    const touches = await fetchTouchDates(client, batch.map((person) => person.id));

    for (const person of batch) {
      try {
        // a stage the threshold map does not know is config drift, not an
        // un-enroll: leave the person untouched instead of wiping state
        if (
          person.followUpStage !== null &&
          FOLLOW_UP_THRESHOLD_DAYS[person.followUpStage] === undefined
        ) {
          result.skippedUnknownStage += 1;
          continue;
        }

        const touch = touches.get(person.id) ?? { notes: [], doneTasks: [] };
        const lastTouchedAt = latestTouch(touch.notes, touch.doneTasks);
        const nextStatus = computeFollowUpStatus({
          stage: person.followUpStage,
          lastTouchedAt,
          now,
        });

        if (nextStatus === null) {
          if (person.followUpStatus !== null || person.followUpTaskCreatedAt !== null) {
            await client.mutation({
              updatePerson: {
                __args: {
                  id: person.id,
                  data: {
                    followUpStatus: null,
                    lastTouchedAt: null,
                    followUpTaskCreatedAt: null,
                  },
                },
                id: true,
              },
            });
            result.cleared += 1;
          }
          continue;
        }

        if (nextStatus === 'TAKIPTE') result.takipte += 1;
        if (nextStatus === 'VADESI_GELDI') result.vadesiGeldi += 1;
        if (nextStatus === 'GECIKMIS') result.gecikmis += 1;

        const createTask = shouldCreateTask({
          nextStatus,
          lastTouchedAt,
          taskMarker: person.followUpTaskCreatedAt,
        });

        // the task comes first: the dedupe marker must never be written
        // for a task that failed to materialize
        if (createTask) {
          const daysSinceTouch =
            lastTouchedAt === null
              ? null
              : Math.floor((now - Date.parse(lastTouchedAt)) / 86_400_000);
          await createLapseTask(client, person, daysSinceTouch, nowIso);
          result.tasksCreated += 1;
        }

        const changedFields: Record<string, unknown> = {};
        if (person.followUpStatus !== nextStatus) changedFields.followUpStatus = nextStatus;
        if (person.lastTouchedAt !== lastTouchedAt) changedFields.lastTouchedAt = lastTouchedAt;
        if (createTask) changedFields.followUpTaskCreatedAt = nowIso;

        if (Object.keys(changedFields).length > 0) {
          await client.mutation({
            updatePerson: {
              __args: { id: person.id, data: changedFields },
              id: true,
            },
          });
        }
      } catch (error) {
        // one broken person must not abort the sweep
        console.error(`follow-up sweep failed for person ${person.id}`, error);
        result.errors += 1;
        if (result.errorSamples.length < 3) {
          result.errorSamples.push(
            `${person.id}: ${error instanceof Error ? error.message : String(error)}`.slice(0, 300),
          );
        }
      }
    }
  }

  return result;
};
