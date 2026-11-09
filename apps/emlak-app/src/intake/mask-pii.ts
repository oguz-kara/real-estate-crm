import { foldTurkish } from 'src/intake/fold-turkish';

export type PersonIdentity = {
  firstName: string | null;
  lastName: string | null;
  phones: string[];
};

export type MaskResult = {
  maskedText: string;
  phoneCount: number;
  emailCount: number;
  nameRedacted: boolean;
  leak: boolean;
};

export const CUSTOMER_PLACEHOLDER = '[MÜŞTERİ]';

const EMAIL_PATTERN = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;

// Ten-digit Turkish numbers (landline 2xx-4xx, mobile 5xx) with optional
// +90/0090/0 prefix and any of the separators people type. Requiring all
// ten digits is what keeps "3+1" and "4.150.000" untouched.
const PHONE_PATTERN =
  /(?<![\d+])(?:(?:\+|00)90[\s.-]?)?\(?0?[2-5]\d{2}\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}(?!\d)/g;

// TC kimlik numbers never start with 0, which keeps "05324567890" a phone.
const NATIONAL_ID_PATTERN = /(?<!\d)[1-9]\d{10}(?!\d)/g;

const IBAN_PATTERN = /\bTR\d{2}(?:\s?\d{4}){5}\s?\d{2}\b/gi;

const DIGIT_RUN_PATTERN = /\d[\d\s.()-]{8,}\d/g;

const nationalDigits = (phone: string): string | null => {
  const digits = phone.replace(/\D/g, '');

  return digits.length >= 10 ? digits.slice(-10) : null;
};

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const nameTokens = (person: PersonIdentity): string[] =>
  [person.firstName, person.lastName]
    .flatMap((part) => (part ?? '').split(/\s+/))
    .map((token) => foldTurkish(token.trim()))
    .filter((token) => token.length >= 2);

const buildNamePattern = (person: PersonIdentity): RegExp | null => {
  const tokens = nameTokens(person);
  if (tokens.length === 0) {
    return null;
  }
  const fullName = tokens.map(escapeRegExp).join('\\s+');
  const alternatives = [fullName, ...tokens.map(escapeRegExp)].sort(
    (left, right) => right.length - left.length,
  );

  return new RegExp(`(?<!\\p{L})(?:${alternatives.join('|')})(?!\\p{L})`, 'gu');
};

const redactName = (text: string, person: PersonIdentity): { text: string; redacted: boolean } => {
  const pattern = buildNamePattern(person);
  const folded = foldTurkish(text);
  // Index mapping below relies on folding being one character per character.
  if (pattern === null || folded.length !== text.length) {
    return { text, redacted: false };
  }
  let result = '';
  let cursor = 0;
  for (const match of folded.matchAll(pattern)) {
    const start = match.index ?? 0;
    result += text.slice(cursor, start) + CUSTOMER_PLACEHOLDER;
    cursor = start + match[0].length;
  }

  return { text: result + text.slice(cursor), redacted: cursor > 0 };
};

const personPhoneDigits = (person: PersonIdentity): string[] =>
  person.phones.map(nationalDigits).filter((digits): digits is string => digits !== null);

const containsPersonPhone = (text: string, person: PersonIdentity): boolean => {
  const phoneDigits = personPhoneDigits(person);

  return [...text.matchAll(DIGIT_RUN_PATTERN)].some((run) => {
    const digits = run[0].replace(/\D/g, '');

    return phoneDigits.some((phone) => digits.includes(phone));
  });
};

export const containsPii = (text: string, person: PersonIdentity): boolean => {
  if (new RegExp(EMAIL_PATTERN.source).test(text)) {
    return true;
  }
  if (
    [PHONE_PATTERN, NATIONAL_ID_PATTERN, IBAN_PATTERN].some((pattern) =>
      new RegExp(pattern.source, pattern.flags.replace('g', '')).test(text),
    )
  ) {
    return true;
  }
  if (containsPersonPhone(text, person)) {
    return true;
  }
  const namePattern = buildNamePattern(person);

  return namePattern !== null && namePattern.test(foldTurkish(text));
};

export const maskPii = (text: string, person: PersonIdentity): MaskResult => {
  let emailCount = 0;
  let phoneCount = 0;
  let ibanCount = 0;
  let nationalIdCount = 0;
  const withoutEmails = text.replace(EMAIL_PATTERN, () => `[EPOSTA_${++emailCount}]`);
  // IBANs go before phones so their digit groups are never read as numbers.
  const withoutIbans = withoutEmails.replace(IBAN_PATTERN, () => `[IBAN_${++ibanCount}]`);
  const withoutNumbers = withoutIbans.replace(PHONE_PATTERN, () => `[TELEFON_${++phoneCount}]`);
  const withoutPhones = withoutNumbers.replace(
    NATIONAL_ID_PATTERN,
    () => `[KIMLIK_${++nationalIdCount}]`,
  );
  const phoneDigits = personPhoneDigits(person);
  const withoutOwnPhones = withoutPhones.replace(DIGIT_RUN_PATTERN, (run) => {
    const digits = run.replace(/\D/g, '');

    return phoneDigits.some((phone) => digits.includes(phone)) ? `[TELEFON_${++phoneCount}]` : run;
  });
  const { text: maskedText, redacted } = redactName(withoutOwnPhones, person);

  return {
    maskedText,
    phoneCount,
    emailCount,
    nameRedacted: redacted,
    leak: containsPii(maskedText, person),
  };
};
