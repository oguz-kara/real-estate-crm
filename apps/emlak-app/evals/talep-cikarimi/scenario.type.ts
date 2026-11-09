import { type IntakeSource } from '../../src/intake/run-intake';
import { type Money } from '../../src/intake/normalize-draft';

export type AnyOf<TValue> = { anyOf: TValue[] };

type Expectation<TValue> = TValue | AnyOf<TValue>;

export type DraftExpectation = {
  category?: Expectation<string | null>;
  listingType?: Expectation<string | null>;
  rooms?: string[];
  districts?: Expectation<string | null>;
  budgetMin?: Money | null;
  budgetMax?: Money | null;
  sqmNetMin?: number | null;
};

export type IntakeScenario = {
  id: string;
  style: 'whatsapp' | 'stt' | 'defter';
  source: IntakeSource;
  text: string;
  expected: DraftExpectation;
  featuresInclude?: string[];
  mustBeEmpty?: Array<keyof DraftExpectation>;
  gecmeTanimi: string;
};
