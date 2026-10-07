import { containsPii, type PersonIdentity } from '../../src/intake/mask-pii';
import { type AnyOf, type DraftExpectation, type IntakeScenario } from './scenario.type';

export const EVAL_PERSON: PersonIdentity = {
  firstName: 'Ahmet',
  lastName: 'Yılmaz',
  phones: ['5324567890', '+905324567890'],
};

type RawMoney = { amountMicros: number | string | null; currencyCode: string | null } | null;

export type DraftRecord = {
  category: string | null;
  listingType: string | null;
  rooms: string[] | null;
  districts: string | null;
  features: string[] | null;
  excludedFeatures: string[] | null;
  budgetMin: RawMoney;
  budgetMax: RawMoney;
  sqmNetMin: number | null;
  notes: string | null;
  extraction: { outcome?: string; maskedText?: string } | null;
};

export const anyOf = <TValue>(...values: TValue[]): AnyOf<TValue> => ({ anyOf: values });

const isAnyOf = (value: unknown): value is AnyOf<unknown> =>
  typeof value === 'object' && value !== null && 'anyOf' in value;

const normalizeMoney = (money: RawMoney): string | null =>
  money === null || money.amountMicros === null || money.amountMicros === ''
    ? null
    : `${Number(money.amountMicros)} ${money.currencyCode}`;

const normalizeDistricts = (districts: string | null): string | null =>
  districts === null || districts.trim() === ''
    ? null
    : districts
        .split(',')
        .map((district) => district.trim())
        .sort()
        .join(', ');

const actualValue = (draft: DraftRecord, field: keyof DraftExpectation): unknown => {
  switch (field) {
    case 'budgetMin':
    case 'budgetMax':
      return normalizeMoney(draft[field]);
    case 'districts':
      return normalizeDistricts(draft.districts);
    case 'rooms':
      return [...(draft.rooms ?? [])].sort().join(', ') || null;
    default:
      return draft[field] ?? null;
  }
};

const expectedValue = (field: keyof DraftExpectation, value: unknown): unknown => {
  if (field === 'budgetMin' || field === 'budgetMax') {
    return value === null
      ? null
      : normalizeMoney({ ...(value as { amountMicros: number; currencyCode: string }) });
  }
  if (field === 'districts') {
    return normalizeDistricts(value as string | null);
  }
  if (field === 'rooms') {
    return [...(value as string[])].sort().join(', ') || null;
  }

  return value;
};

const PHONE_LIKE = /\d{3}[\s.]?\d{2}[\s.]?\d{2}/;

// Automated flags only; the written pass definition is judged by a human.
export const checkDraft = (scenario: IntakeScenario, draft: DraftRecord): string[] => {
  const failures: string[] = [];

  for (const [field, expectation] of Object.entries(scenario.expected) as Array<
    [keyof DraftExpectation, unknown]
  >) {
    const actual = actualValue(draft, field);
    const accepted = (isAnyOf(expectation) ? expectation.anyOf : [expectation]).map((value) =>
      expectedValue(field, value),
    );
    if (!accepted.some((value) => value === actual)) {
      failures.push(
        `${field}: beklenen ${accepted.map((value) => JSON.stringify(value)).join(' | ')}, bulunan ${JSON.stringify(actual)}`,
      );
    }
  }

  for (const feature of scenario.featuresInclude ?? []) {
    if (!(draft.features ?? []).includes(feature)) {
      failures.push(`features: ${feature} yok`);
    }
  }

  for (const field of scenario.mustBeEmpty ?? []) {
    if (actualValue(draft, field) !== null) {
      failures.push(`${field} boş olmalıydı`);
    }
  }

  const maskedText = draft.extraction?.maskedText ?? '';
  if (containsPii(maskedText, EVAL_PERSON) || PHONE_LIKE.test(maskedText)) {
    failures.push('maskedText kişisel veri içeriyor');
  }
  if (draft.extraction?.outcome !== 'ok') {
    failures.push(`çıkarım başarısız (${draft.extraction?.outcome ?? 'yok'})`);
  }

  return failures;
};
