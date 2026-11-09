import { TALEP_CIKARICI_AGENT_UNIVERSAL_IDENTIFIER } from 'src/constants/intake-ids';
import { INTAKE_MIN_TEXT_LENGTH } from 'src/constants/intake-limits';
import { PROPERTY_SELECT_OPTIONS } from 'src/constants/property-options';
import { resolveLabel } from 'src/constants/app-locale';
import { buildIntakePrompt, INTAKE_MODEL_ID } from 'src/intake/intake-response-schema';
import { maskPii, type PersonIdentity } from 'src/intake/mask-pii';
import { CRITERIA_FIELDS, type Money, normalizeDraft, type NormalizedDraft } from 'src/intake/normalize-draft';
import { parseRawExtraction, type RawExtraction } from 'src/intake/raw-extraction';

export type IntakeClient = {
  query: (payload: Record<string, unknown>) => Promise<unknown>;
  mutation: (payload: Record<string, unknown>) => Promise<unknown>;
};

export type IntakeAgentRunner = (
  prompt: string,
) => Promise<{ success: boolean; result?: unknown; error?: string | null }>;

export const INTAKE_SOURCES = ['WHATSAPP', 'TELEFON', 'YUZ_YUZE', 'DEFTER', 'DIGER'] as const;

export type IntakeSource = (typeof INTAKE_SOURCES)[number];

export type IntakeInput = { personId: string; text: string; source?: IntakeSource };

export type IntakeOutcome = 'ok' | 'extraction-failed';

export type IntakeResult = {
  draftId: string;
  missingFields: string[];
  summary: string;
  outcome: IntakeOutcome;
};

export type IntakeExtraction = {
  maskedText: string;
  evidence: Record<string, string>;
  missingFields: string[];
  unmapped: string[];
  model: string;
  agentUniversalIdentifier: string;
  extractedAt: string;
  outcome: IntakeOutcome;
};

export class IntakeError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404,
  ) {
    super(message);
  }
}

const MAX_AGENT_ATTEMPTS = 2;

type PersonNode = {
  id: string;
  name?: { firstName?: string | null; lastName?: string | null } | null;
  phones?: {
    primaryPhoneNumber?: string | null;
    primaryPhoneCallingCode?: string | null;
    additionalPhones?: Array<{ number?: string | null; callingCode?: string | null }> | null;
  } | null;
};

const validateInput = (input: IntakeInput): { personId: string; text: string; source?: IntakeSource } => {
  const personId = typeof input.personId === 'string' ? input.personId.trim() : '';
  const text = typeof input.text === 'string' ? input.text.trim() : '';
  if (personId === '') {
    throw new IntakeError('personId is required', 400);
  }
  if (text.length < INTAKE_MIN_TEXT_LENGTH) {
    throw new IntakeError(`text must be at least ${INTAKE_MIN_TEXT_LENGTH} characters`, 400);
  }
  if (input.source !== undefined && !INTAKE_SOURCES.includes(input.source)) {
    throw new IntakeError('unknown source', 400);
  }

  return { personId, text, source: input.source };
};

const fetchPerson = async (client: IntakeClient, personId: string): Promise<PersonNode> => {
  const result = (await client.query({
    people: {
      __args: { filter: { id: { eq: personId } }, first: 1 },
      edges: {
        node: {
          id: true,
          name: { firstName: true, lastName: true },
          phones: {
            primaryPhoneNumber: true,
            primaryPhoneCallingCode: true,
            additionalPhones: true,
          },
        },
      },
    },
  })) as { people?: { edges?: Array<{ node: PersonNode }> } };
  const node = result.people?.edges?.[0]?.node;
  if (node === undefined) {
    throw new IntakeError('person not found', 404);
  }

  return node;
};

const toIdentity = (person: PersonNode): PersonIdentity => {
  const phoneEntries = [
    { number: person.phones?.primaryPhoneNumber, callingCode: person.phones?.primaryPhoneCallingCode },
    ...(person.phones?.additionalPhones ?? []),
  ];
  const phones = phoneEntries.flatMap((phone) => {
    const number = (phone.number ?? '').trim();

    return number === '' ? [] : [number, `${phone.callingCode ?? ''}${number}`];
  });

  return {
    firstName: person.name?.firstName?.trim() || null,
    lastName: person.name?.lastName?.trim() || null,
    phones,
  };
};

const displayName = (identity: PersonIdentity): string | null => {
  const name = [identity.firstName, identity.lastName].filter((part) => part !== null).join(' ');

  return name === '' ? null : name;
};

const extractWithRetry = async (
  runAgent: IntakeAgentRunner,
  maskedText: string,
): Promise<RawExtraction | null> => {
  for (let attempt = 0; attempt < MAX_AGENT_ATTEMPTS; attempt++) {
    try {
      const run = await runAgent(buildIntakePrompt(maskedText));
      if (!run.success) {
        console.warn(`talep-cikarici run failed: ${run.error ?? 'unknown error'}`);
        continue;
      }
      const payload = run.result as { response?: unknown } | null | undefined;
      const raw = parseRawExtraction(
        typeof payload?.response === 'string' ? payload.response : payload,
      );
      if (raw !== null) {
        return raw;
      }
      console.warn('talep-cikarici returned no parsable json object');
    } catch (error) {
      // a thrown runner is a failed attempt like any other
      console.warn(`talep-cikarici call threw: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  return null;
};

const optionLabel = (field: 'listingType' | 'rooms', value: string): string =>
  PROPERTY_SELECT_OPTIONS[field].find((option) => option.value === value)?.label ?? value;

const formatMoney = (money: Money): string =>
  `${new Intl.NumberFormat('tr-TR').format(money.amountMicros / 1_000_000)} ${money.currencyCode}`;

const buildSummary = (draft: NormalizedDraft | null): string => {
  const parts = draft === null
    ? []
    : [
        draft.listingType === null ? '' : optionLabel('listingType', draft.listingType),
        draft.districts ?? '',
        draft.budgetMax === null ? '' : formatMoney(draft.budgetMax),
        draft.rooms.map((room) => optionLabel('rooms', room)).join(', '),
      ].filter((part) => part !== '');

  return parts.length > 0
    ? parts.join(' · ')
    : resolveLabel({
        tr: 'Metinde talep kriteri bulunamadı; taslak yalnızca kaynak metinle açıldı.',
        en: 'No request criteria found in the text; the draft only holds the source text.',
      });
};

const criteriaData = (draft: NormalizedDraft): Record<string, unknown> => {
  const values: Record<string, unknown> = {
    category: draft.category,
    listingType: draft.listingType,
    rooms: draft.rooms,
    districts: draft.districts,
    features: draft.features,
    excludedFeatures: draft.excludedFeatures,
    budgetMin: draft.budgetMin,
    budgetMax: draft.budgetMax,
    sqmNetMin: draft.sqmNetMin,
    notes: draft.notes,
  };

  return Object.fromEntries(
    Object.entries(values).filter(
      ([, value]) => value !== null && !(Array.isArray(value) && value.length === 0),
    ),
  );
};

const createReviewTask = async (
  client: IntakeClient,
  options: { draftId: string; personId: string; personName: string; missingFields: string[]; nowIso: string },
): Promise<void> => {
  const missingText =
    options.missingFields.length === 0 ? '-' : options.missingFields.join(', ');
  const created = (await client.mutation({
    createTask: {
      __args: {
        data: {
          title: resolveLabel({
            tr: `Taslak talebi onayla: ${options.personName}`,
            en: `Approve draft request: ${options.personName}`,
          }),
          bodyV2: {
            markdown: resolveLabel({
              tr: `Metinden çıkarılan taslak talebi kaynak metinle karşılaştırıp düzeltin, sonra durumunu Aktif yapın.\n\nEksik alanlar: ${missingText}\n\nOnay listesi: Talepler → Onay Bekleyen Talepler`,
              en: `Compare the extracted draft request with its source text, fix it, then set its status to Active.\n\nMissing fields: ${missingText}\n\nApproval list: Buyer Requests → Requests Awaiting Approval`,
            }),
          },
          status: 'TODO',
          dueAt: options.nowIso,
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
    createTaskTarget: { __args: { data: { taskId, targetBuyerRequestId: options.draftId } }, id: true },
  });
  await client.mutation({
    createTaskTarget: { __args: { data: { taskId, targetPersonId: options.personId } }, id: true },
  });
};

export const runIntake = async (
  client: IntakeClient,
  runAgent: IntakeAgentRunner,
  input: IntakeInput,
  now: number,
): Promise<IntakeResult> => {
  const { personId, text, source } = validateInput(input);
  const person = await fetchPerson(client, personId);
  const identity = toIdentity(person);
  const nowIso = new Date(now).toISOString();

  const masked = maskPii(text, identity);
  const raw = masked.leak ? null : await extractWithRetry(runAgent, masked.maskedText);
  const draft = raw === null ? null : normalizeDraft(raw);
  const outcome: IntakeOutcome = draft === null ? 'extraction-failed' : 'ok';
  const missingFields = draft?.missingFields ?? [...CRITERIA_FIELDS];

  const extraction: IntakeExtraction = {
    // a leaking mask is never persisted either
    maskedText: masked.leak ? '' : masked.maskedText,
    evidence: draft?.evidence ?? {},
    missingFields,
    unmapped: masked.leak ? ['maskeleme eksik'] : (draft?.unmapped ?? []),
    model: INTAKE_MODEL_ID,
    agentUniversalIdentifier: TALEP_CIKARICI_AGENT_UNIVERSAL_IDENTIFIER,
    extractedAt: nowIso,
    outcome,
  };

  const personName = displayName(identity);
  const created = (await client.mutation({
    createBuyerRequest: {
      __args: {
        data: {
          name: personName === null ? 'Talep' : `${personName} talebi`,
          status: 'TASLAK',
          buyerId: personId,
          ...(source === undefined ? {} : { source }),
          sourceText: text,
          extraction,
          ...(draft === null ? {} : criteriaData(draft)),
        },
      },
      id: true,
    },
  })) as { createBuyerRequest?: { id?: string } };
  const draftId = created.createBuyerRequest?.id;
  if (draftId === undefined) {
    throw new Error('createBuyerRequest returned no id');
  }

  // The draft already exists and shows up in the approval view; failing the
  // call now would make the user retry and create a duplicate.
  try {
    await createReviewTask(client, {
      draftId,
      personId,
      personName: personName ?? 'Talep',
      missingFields,
      nowIso,
    });
  } catch (error) {
    console.warn(
      `review task for draft ${draftId} could not be created: ${error instanceof Error ? error.message : 'unknown error'}`,
    );
  }

  return { draftId, missingFields, summary: buildSummary(draft), outcome };
};
