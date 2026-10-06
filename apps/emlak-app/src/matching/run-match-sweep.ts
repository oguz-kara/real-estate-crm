import { resolveLabel } from 'src/constants/app-locale';
import {
  type ConnectionPage,
  fetchAllPages,
  PAGE_SIZE,
  type SweepClient,
} from 'src/follow-up/run-sweep';
import { runRequestMatching } from 'src/matching/run-request-matching';

export type MatchSweepResult = {
  requestsScanned: number;
  matchesCreated: number;
  matchesRefreshed: number;
  tasksCreated: number;
  errors: number;
  errorSamples: string[];
};

type ActiveRequestNode = { id: string; name: string | null };

const fetchActiveRequests = (client: SweepClient): Promise<ActiveRequestNode[]> =>
  fetchAllPages(async (after) => {
    const result = (await client.query({
      buyerRequests: {
        __args: {
          filter: { status: { in: ['AKTIF'] } },
          first: PAGE_SIZE,
          ...(after === undefined ? {} : { after }),
        },
        edges: { node: { id: true, name: true } },
        pageInfo: { hasNextPage: true, endCursor: true },
      },
    })) as { buyerRequests?: ConnectionPage<ActiveRequestNode> };

    return result.buyerRequests;
  });

const createMatchTask = async (
  client: SweepClient,
  request: ActiveRequestNode,
  createdCount: number,
  topMatchNames: string[],
  nowIso: string,
): Promise<void> => {
  const requestName = request.name ?? request.id;
  const listText = topMatchNames.length === 0 ? '' : `\n\n- ${topMatchNames.join('\n- ')}`;

  const created = (await client.mutation({
    createTask: {
      __args: {
        data: {
          title: resolveLabel({
            tr: `Yeni eşleşme: ${requestName} (${createdCount} yeni portföy)`,
            en: `New match: ${requestName} (${createdCount} new properties)`,
          }),
          bodyV2: {
            markdown: resolveLabel({
              tr: `Bu talep için ${createdCount} yeni portföy eşleşti.${listText}`,
              en: `${createdCount} new properties matched this request.${listText}`,
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
    throw new Error('createTask returned no id');
  }

  await client.mutation({
    createTaskTarget: {
      __args: { data: { taskId, targetBuyerRequestId: request.id } },
      id: true,
    },
  });
};

export const runMatchSweep = async (
  client: SweepClient,
  now: number,
): Promise<MatchSweepResult> => {
  const nowIso = new Date(now).toISOString();
  const result: MatchSweepResult = {
    requestsScanned: 0,
    matchesCreated: 0,
    matchesRefreshed: 0,
    tasksCreated: 0,
    errors: 0,
    errorSamples: [],
  };

  const requests = await fetchActiveRequests(client);
  result.requestsScanned = requests.length;

  for (const request of requests) {
    try {
      const matching = await runRequestMatching(client, request.id, now);
      result.matchesCreated += matching.created;
      result.matchesRefreshed += matching.refreshed;

      // a task only when the run surfaced something the office has not
      // seen yet; refreshes alone never ping anyone
      if (matching.created > 0) {
        await createMatchTask(
          client,
          request,
          matching.created,
          matching.topMatches
            .map((match) => match.propertyName)
            .filter((name): name is string => name !== null),
          nowIso,
        );
        result.tasksCreated += 1;
      }
    } catch (error) {
      // one broken request must not abort the sweep
      console.error(`match sweep failed for request ${request.id}`, error);
      result.errors += 1;
      if (result.errorSamples.length < 3) {
        result.errorSamples.push(
          `${request.id}: ${error instanceof Error ? error.message : String(error)}`.slice(0, 300),
        );
      }
    }
  }

  return result;
};
