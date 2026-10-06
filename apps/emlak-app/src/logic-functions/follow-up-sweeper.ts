import { defineLogicFunction } from 'twenty-sdk/define';
import { CoreApiClient } from 'twenty-client-sdk/core';

import { resolveLabel } from 'src/constants/app-locale';
import { type FollowUpStatus } from 'src/constants/follow-up-thresholds';
import { computeFollowUpStatus } from 'src/follow-up/compute-follow-up-status';
import { latestTouch } from 'src/follow-up/latest-touch';
import { shouldCreateTask } from 'src/follow-up/should-create-task';

const PAGE_SIZE = 50;

type TrackedPerson = {
  id: string;
  name: { firstName: string | null; lastName: string | null } | null;
  followUpStage: string | null;
  followUpStatus: string | null;
  lastTouchedAt: string | null;
  followUpTaskCreatedAt: string | null;
  noteTargets?: { edges?: Array<{ node: { note: { createdAt: string } | null } }> };
  taskTargets?: {
    edges?: Array<{ node: { task: { status: string | null; updatedAt: string } | null } }>;
  };
};

type SweepResult = {
  scanned: number;
  takipte: number;
  vadesiGeldi: number;
  gecikmis: number;
  cleared: number;
  tasksCreated: number;
  errors: number;
  errorSamples: string[];
};

const fetchTrackedPeople = async (
  client: CoreApiClient,
): Promise<TrackedPerson[]> => {
  const people: TrackedPerson[] = [];
  let after: string | undefined;

  for (;;) {
    const result = (await client.query({
      people: {
        __args: {
          // stage-less people with a leftover status must still be fetched
          // so un-enrolling clears them out of the follow-up view
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
            // touches ride along: notes and tasks targeting the person
            noteTargets: {
              __args: { first: 200 },
              edges: { node: { note: { createdAt: true } } },
            },
            taskTargets: {
              __args: { first: 200 },
              edges: { node: { task: { status: true, updatedAt: true } } },
            },
          },
        },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    })) as {
      people?: {
        edges?: Array<{ node: TrackedPerson }>;
        pageInfo?: { hasNextPage?: boolean; endCursor?: string };
      };
    };

    people.push(...(result.people?.edges ?? []).map((edge) => edge.node));

    if (!result.people?.pageInfo?.hasNextPage || !result.people.pageInfo.endCursor) {
      return people;
    }
    after = result.people.pageInfo.endCursor;
  }
};

const touchDatesOf = (person: TrackedPerson) => ({
  notes: (person.noteTargets?.edges ?? [])
    .map((edge) => edge.node.note?.createdAt)
    .filter((date): date is string => date !== undefined),
  doneTasks: (person.taskTargets?.edges ?? [])
    .map((edge) => edge.node.task)
    .filter(
      (task): task is { status: string; updatedAt: string } =>
        task !== null && task !== undefined && task.status === 'DONE',
    )
    .map((task) => task.updatedAt),
});

const createLapseTask = async (
  client: CoreApiClient,
  person: TrackedPerson,
  daysSinceTouch: number | null,
  nowIso: string,
) => {
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
          title: resolveLabel({ tr: `Takip: ${personName}`, en: `Follow up: ${personName}` }),
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
  })) as { createTask?: { id: string } };

  const taskId = created.createTask?.id;
  if (taskId !== undefined) {
    await client.mutation({
      createTaskTarget: {
        __args: { data: { taskId, targetPersonId: person.id } },
        id: true,
      },
    });
  }
};

export const followUpSweeperHandler = async (): Promise<SweepResult> => {
  const client = new CoreApiClient();
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const result: SweepResult = {
    scanned: 0,
    takipte: 0,
    vadesiGeldi: 0,
    gecikmis: 0,
    cleared: 0,
    tasksCreated: 0,
    errors: 0,
    errorSamples: [],
  };

  const people = await fetchTrackedPeople(client);
  result.scanned = people.length;

  for (const person of people) {
      try {
        const touch = touchDatesOf(person);
        const lastTouchedAt = latestTouch(touch.notes, touch.doneTasks);
        const nextStatus = computeFollowUpStatus({
          stage: person.followUpStage,
          lastTouchedAt,
          now,
        });

        if (nextStatus === null) {
          // stage was cleared: un-enroll fully so the person leaves the view
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
          nextStatus: nextStatus as FollowUpStatus,
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

  return result;
};

export default defineLogicFunction({
  universalIdentifier: '9fa63498-f40a-4364-8b81-9bf302bf3dbe',
  name: 'follow-up-sweeper',
  description:
    'Takip taraması: takip aşaması dolu her kişi için son teması (not veya ' +
    'tamamlanan görev) bulur, Takipte/Vadesi Geldi/Gecikmiş durumunu yazar ve ' +
    'eşik ilk aşıldığında bir kez takip görevi oluşturur. Her gece 03:15\'te ' +
    'kendiliğinden çalışır; buradan elle de tetiklenebilir.',
  timeoutSeconds: 300,
  cronTriggerSettings: { pattern: '15 3 * * *' },
  toolTriggerSettings: { inputSchema: { type: 'object', properties: {} } },
  handler: followUpSweeperHandler,
});
