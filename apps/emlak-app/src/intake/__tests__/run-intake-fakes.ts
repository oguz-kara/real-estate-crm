import { type IntakeAgentRunner, type IntakeClient } from 'src/intake/run-intake';
import { type RawExtraction } from 'src/intake/raw-extraction';

export const NOW = Date.parse('2026-10-07T10:00:00.000Z');

export const AHMET_NODE = {
  id: 'p1',
  name: { firstName: 'Ahmet', lastName: 'Yılmaz' },
  phones: {
    primaryPhoneNumber: '5324567890',
    primaryPhoneCallingCode: '+90',
    additionalPhones: [],
  },
};

export const EMPTY_RAW: RawExtraction = {
  category: '',
  listingType: '',
  rooms: '',
  districts: '',
  features: '',
  excludedFeatures: '',
  budgetMin: '',
  budgetMax: '',
  budgetCurrency: '',
  sqmNetMin: '',
  leftover: '',
  evidence: '',
};

export type RecordedMutation = Record<string, { __args: { data: Record<string, unknown> } }>;

export const makeClient = (personNode: Record<string, unknown> | null) => {
  const mutations: RecordedMutation[] = [];
  const client: IntakeClient = {
    query: async (payload) => {
      if (!('people' in payload)) {
        throw new Error(`unexpected query ${Object.keys(payload).join()}`);
      }

      return { people: { edges: personNode === null ? [] : [{ node: personNode }] } };
    },
    mutation: async (payload) => {
      mutations.push(payload as RecordedMutation);

      return {
        createBuyerRequest: { id: 'draft-1' },
        createTask: { id: 'task-1' },
        createTaskTarget: { id: 'target' },
      };
    },
  };

  return { client, mutations };
};

export const makeRunAgent = (
  responses: Array<{ success: boolean; result?: unknown; error?: string }>,
) => {
  const prompts: string[] = [];
  const runAgent: IntakeAgentRunner = async (prompt) => {
    prompts.push(prompt);

    return responses[Math.min(prompts.length - 1, responses.length - 1)];
  };

  return { runAgent, prompts };
};

export const textResponse = (raw: Partial<RawExtraction>) => ({
  success: true,
  result: { response: JSON.stringify({ ...EMPTY_RAW, ...raw }) },
});

export const dataOf = (mutation: RecordedMutation, key: string): Record<string, unknown> =>
  mutation[key].__args.data;
