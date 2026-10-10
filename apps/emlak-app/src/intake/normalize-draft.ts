import { canonicalizeDistrict } from 'src/constants/izmir-districts';
import { PROPERTY_SELECT_OPTIONS } from 'src/constants/property-options';
import { AMENITY_UNION_OPTIONS } from 'src/constants/request-options';
import { foldTurkish } from 'src/intake/fold-turkish';
import { type RawExtraction } from 'src/intake/raw-extraction';

export type CurrencyCode = 'TRY' | 'EUR' | 'USD';

export type Money = { amountMicros: number; currencyCode: CurrencyCode };

export type NormalizedDraft = {
  category: string | null;
  listingType: string | null;
  rooms: string[];
  districts: string | null;
  features: string[];
  excludedFeatures: string[];
  budgetMin: Money | null;
  budgetMax: Money | null;
  sqmNetMin: number | null;
  notes: string | null;
  missingFields: string[];
  unmapped: string[];
  evidence: Record<string, string>;
};

export const CRITERIA_FIELDS = [
  'category',
  'listingType',
  'rooms',
  'districts',
  'budgetMin',
  'budgetMax',
  'sqmNetMin',
] as const;

const LIST_SEPARATOR = /\s*(?:,|;|\/|\s-\s|(?<=\p{L})-(?=\p{L})|\s+ve\s+|\s+veya\s+|\s+ya\s+da\s+|\s+yada\s+)\s*/iu;

const splitList = (text: string): string[] =>
  text
    .split(LIST_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part !== '');

const unique = <TValue>(values: TValue[]): TValue[] => [...new Set(values)];

const NUMBER_WORDS: Record<string, number> = {
  sifir: 0,
  bir: 1,
  iki: 2,
  uc: 3,
  dort: 4,
  bes: 5,
  alti: 6,
  yedi: 7,
  sekiz: 8,
  dokuz: 9,
  on: 10,
  yirmi: 20,
  otuz: 30,
  kirk: 40,
  elli: 50,
  altmis: 60,
  yetmis: 70,
  seksen: 80,
  doksan: 90,
};

const MULTIPLIER_WORDS: Record<string, number> = {
  milyar: 1_000_000_000,
  milyon: 1_000_000,
  mio: 1_000_000,
  m: 1_000_000,
  bin: 1_000,
  k: 1_000,
};

const detectCurrency = (folded: string): CurrencyCode | null => {
  if (/euro|\beur\b|€/.test(folded)) {
    return 'EUR';
  }
  if (/dolar|\busd\b|\$/.test(folded)) {
    return 'USD';
  }
  if (/\btl\b|₺|lira|\btry\b/.test(folded)) {
    return 'TRY';
  }

  return null;
};

const toCurrencyCode = (hint: string | undefined): CurrencyCode | null => {
  const upper = (hint ?? '').trim().toUpperCase();

  return upper === 'TRY' || upper === 'EUR' || upper === 'USD' ? upper : null;
};

// Long multiplier words keep Turkish case suffixes ("7 milyona kadar",
// "20 binden fazla"); the short forms must stand alone so "5 metre" is not
// five million.
const AMOUNT_PATTERN = /(\d+(?:[.,]\d+)*)\s*(?:(milyar|milyon|bin)[a-z]{0,5}|(mio|m|k)(?![a-z]))?/g;

const parseDigitGroup = (digits: string, multiplierWord: string | undefined): number => {
  const multiplier = multiplierWord === undefined ? 1 : MULTIPLIER_WORDS[multiplierWord];
  const isThousandsGrouped = /^\d{1,3}(?:[.,]\d{3})+$/.test(digits);
  const numeric =
    isThousandsGrouped && multiplierWord === undefined
      ? Number(digits.replace(/[.,]/g, ''))
      : Number(digits.replace(/\.(?=.*[.,])/g, '').replace(',', '.'));

  return numeric * multiplier;
};

const parseDigitAmount = (folded: string): { amount: number; hasMultiplier: boolean } | null => {
  const withHalves = folded.replace(/(\d+)\s*bucuk/g, '$1.5');
  const groups = [...withHalves.matchAll(AMOUNT_PATTERN)].map((match) => {
    const multiplierWord = match[2] ?? match[3];

    return {
      value: parseDigitGroup(match[1], multiplierWord),
      multiplier: multiplierWord === undefined ? 1 : MULTIPLIER_WORDS[multiplierWord],
    };
  });
  if (groups.length === 0 || !groups.every((group) => Number.isFinite(group.value))) {
    return null;
  }
  // "5 milyon 500 bin" is one amount: keep adding while multipliers shrink.
  let amount = groups[0].value;
  let previousMultiplier = groups[0].multiplier;
  for (const group of groups.slice(1)) {
    if (previousMultiplier === 1 || group.multiplier >= previousMultiplier) {
      break;
    }
    amount += group.value;
    previousMultiplier = group.multiplier;
  }

  return { amount: Math.round(amount), hasMultiplier: groups[0].multiplier !== 1 };
};

// Speech-to-text writes amounts as words ("yüz yirmi bin dolar").
const wordMultiplier = (word: string): number | null => {
  if (word.startsWith('milyar')) {
    return MULTIPLIER_WORDS.milyar;
  }
  if (word.startsWith('milyon')) {
    return MULTIPLIER_WORDS.milyon;
  }

  return /^bin[a-z]{0,4}$/.test(word) && word !== 'bina' ? MULTIPLIER_WORDS.bin : null;
};

const parseWordAmount = (folded: string): { amount: number; hasMultiplier: boolean } | null => {
  let total = 0;
  let current = 0;
  let sawNumber = false;
  let hasMultiplier = false;
  for (const word of folded.split(/[^a-z]+/)) {
    const multiplier = wordMultiplier(word);
    if (word in NUMBER_WORDS) {
      current += NUMBER_WORDS[word];
      sawNumber = true;
    } else if (word === 'yarim' || word === 'bucuk') {
      current += 0.5;
      sawNumber = true;
    } else if (word === 'yuz') {
      current = (current === 0 ? 1 : current) * 100;
      sawNumber = true;
    } else if (multiplier !== null) {
      total += (current === 0 ? 1 : current) * multiplier;
      current = 0;
      sawNumber = true;
      hasMultiplier = true;
    }
  }
  if (!sawNumber) {
    return null;
  }

  return { amount: Math.round(total + current), hasMultiplier };
};

export const parseAmount = (
  text: string,
  currencyHint?: string,
): { amount: number; currency: CurrencyCode } | null => {
  const folded = foldTurkish(text);
  const parsed = /\d/.test(folded) ? parseDigitAmount(folded) : parseWordAmount(folded);
  if (parsed === null || parsed.amount <= 0) {
    return null;
  }
  const explicitCurrency = detectCurrency(folded);
  // A bare small number ("5") is too ambiguous to be a budget.
  if (!parsed.hasMultiplier && explicitCurrency === null && parsed.amount < 1_000) {
    return null;
  }

  return {
    amount: parsed.amount,
    currency: explicitCurrency ?? toCurrencyCode(currencyHint) ?? 'TRY',
  };
};

const ROOM_CODES = new Set(PROPERTY_SELECT_OPTIONS.rooms.map((option) => option.value));

const roomCode = (rooms: number, halls: number): string | null => {
  if (rooms >= 7) {
    return 'R7_PLUS';
  }
  const code = `R${rooms}_${halls}`;

  return ROOM_CODES.has(code) ? code : null;
};

export const parseRooms = (text: string): string[] => {
  const folded = foldTurkish(text)
    .split(/(\s+|[^a-z0-9+]+)/)
    .map((token) => {
      if (token in NUMBER_WORDS && NUMBER_WORDS[token] <= 9) {
        return String(NUMBER_WORDS[token]);
      }

      return token === 'arti' ? '+' : token;
    })
    .join('');
  const codes: string[] = [];
  if (/studyo/.test(folded)) {
    codes.push('R1_0');
  }
  for (const match of folded.matchAll(/(\d+)\s*\+\s*(\d)/g)) {
    const code = roomCode(Number(match[1]), Number(match[2]));
    if (code !== null) {
      codes.push(code);
    }
  }
  // Without an "N+M" form only numbers that directly precede "oda" count:
  // "4 veya 5 oda" yes, the 120 of "120 m2" or the 2 of "2 banyo" never.
  if (codes.length === 0) {
    const roomLists = folded.matchAll(
      /((?:\d+\s*(?:,|\/|-|veya|ya da|yada|ile|ve)\s*)*\d+)\s*oda/g,
    );
    for (const roomList of roomLists) {
      for (const number of roomList[1].match(/\d+/g) ?? []) {
        const rooms = Number(number);
        const code = rooms >= 1 && rooms <= 12 ? roomCode(rooms, 1) : null;
        if (code !== null) {
          codes.push(code);
        }
      }
    }
  }

  return unique(codes);
};

const stripDistrictNoise = (folded: string): string =>
  folded
    .replace(/['’`][a-z]*/g, '')
    .replace(/^izmir\b\s*/, '')
    .trim();

export const canonicalizeDistricts = (
  text: string,
): { districts: string[]; unmapped: string[] } => {
  const districts: string[] = [];
  const unmapped: string[] = [];
  for (const part of splitList(text)) {
    const folded = stripDistrictNoise(foldTurkish(part));
    if (folded === '') {
      continue;
    }
    const district = canonicalizeDistrict(part);
    if (district === null) {
      unmapped.push(part);
      continue;
    }
    districts.push(district);
    // A neighborhood is kept for the human reviewer: matching works on
    // districts, but "Alaçatı" is narrower than "Çeşme".
    if (!folded.startsWith(foldTurkish(district))) {
      unmapped.push(part);
    }
  }

  return { districts: unique(districts), unmapped };
};

// Ordered longest-first so "kapalı otopark" wins over "otopark".
const AMENITY_ALIASES: readonly (readonly [string, string])[] = [
  ['bahce dubleks', 'BAHCE_DUBLEKSI'],
  ['kapali otopark', 'KAPALI_OTOPARK'],
  ['mustakil havuz', 'MUSTAKIL_HAVUZLU'],
  ['yuzme havuzu', 'YUZME_HAVUZU'],
  ['spor salonu', 'SPOR_SALONU'],
  ['denize sifir', 'SAHIL'],
  ['denize yakin', 'SAHIL'],
  ['ozel havuz', 'MUSTAKIL_HAVUZLU'],
  ['site havuz', 'YUZME_HAVUZU'],
  ['jenerator', 'JENERATOR'],
  ['mobilyali', 'MOBILYA'],
  ['guvenlik', 'GUVENLIK_24_SAAT'],
  ['otopark', 'OTOPARK'],
  ['asansor', 'ASANSOR'],
  ['dubleks', 'DUBLEKS'],
  ['barbeku', 'BARBEKU'],
  ['esyali', 'MOBILYA'],
  ['mangal', 'BARBEKU'],
  ['havuz', 'MUSTAKIL_HAVUZLU'],
  ['bahce', 'BAHCE'],
  ['sahil', 'SAHIL'],
  ['teras', 'TERAS'],
  ['klima', 'KLIMA'],
  ['sauna', 'SAUNA'],
];

const AMENITY_CODES = new Set(AMENITY_UNION_OPTIONS.map((option) => option.value));

export const mapAmenities = (text: string): { values: string[]; unmapped: string[] } => {
  const values: string[] = [];
  const unmapped: string[] = [];
  for (const part of splitList(text)) {
    const folded = foldTurkish(part);
    const words = folded.split(/[^a-z]+/);
    // "asansörsüz" is the absence of the amenity and "bahçe katı" is a
    // floor, not a garden; both stay with the human reviewer.
    const isNegatedOrFloor = words.some((word) => /(siz|suz)$/.test(word) || word === 'kat' || word === 'kati');
    const isSharedPool = words.includes('site') && folded.includes('havuz');
    const alias = isSharedPool
      ? (['site havuz', 'YUZME_HAVUZU'] as const)
      : AMENITY_ALIASES.find(([key]) => new RegExp(`(^|[^a-z])${key}`).test(folded));
    if (!isNegatedOrFloor && alias !== undefined && AMENITY_CODES.has(alias[1])) {
      values.push(alias[1]);
    } else {
      unmapped.push(part);
    }
  }

  return { values: unique(values), unmapped };
};

const CATEGORY_CODES = new Set(PROPERTY_SELECT_OPTIONS.category.map((option) => option.value));

const CATEGORY_ALIASES: readonly (readonly [string, string])[] = [
  ['turistik', 'TURISTIK_TESIS'],
  ['pansiyon', 'TURISTIK_TESIS'],
  ['otel', 'TURISTIK_TESIS'],
  ['devremulk', 'DEVREMULK'],
  ['isyeri', 'ISYERI'],
  ['dukkan', 'ISYERI'],
  ['magaza', 'ISYERI'],
  ['ofis', 'ISYERI'],
  ['buro', 'ISYERI'],
  ['arsa', 'ARSA'],
  ['arazi', 'ARSA'],
  ['tarla', 'ARSA'],
  ['bina', 'BINA'],
  ['konut', 'KONUT'],
  ['daire', 'KONUT'],
  ['villa', 'KONUT'],
  ['rezidans', 'KONUT'],
  ['mustakil', 'KONUT'],
  ['yazlik', 'KONUT'],
  ['ev', 'KONUT'],
];

const LISTING_TYPE_CODES = new Set(
  PROPERTY_SELECT_OPTIONS.listingType.map((option) => option.value),
);

const LISTING_TYPE_ALIASES: readonly (readonly [string, string])[] = [
  ['devren satilik', 'DEVREN_SATILIK'],
  ['devren kiralik', 'DEVREN_KIRALIK'],
  ['satilik', 'SATILIK'],
  ['satis', 'SATILIK'],
  ['kiralik', 'KIRALIK'],
  ['kira', 'KIRALIK'],
];

const normalizeCode = (
  text: string,
  codes: Set<string>,
  aliases: readonly (readonly [string, string])[],
): string | null => {
  const trimmed = text.trim();
  if (trimmed === '') {
    return null;
  }
  const upper = trimmed.toUpperCase().replace(/\s+/g, '_');
  if (codes.has(upper)) {
    return upper;
  }
  const words = foldTurkish(trimmed);
  const alias = aliases.find(([key]) => new RegExp(`(^|[^a-z])${key}`).test(words));

  return alias !== undefined && codes.has(alias[1]) ? alias[1] : null;
};

export const normalizeCategory = (text: string): string | null =>
  normalizeCode(text, CATEGORY_CODES, CATEGORY_ALIASES);

export const normalizeListingType = (text: string): string | null =>
  normalizeCode(text, LISTING_TYPE_CODES, LISTING_TYPE_ALIASES);

const toMoney = (text: string, currencyHint: string): Money | null => {
  const parsed = parseAmount(text, currencyHint);

  return parsed === null
    ? null
    : { amountMicros: parsed.amount * 1_000_000, currencyCode: parsed.currency };
};

const parseEvidence = (text: string): Record<string, string> => {
  try {
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    );
  } catch {
    return {};
  }
};

const parseSqm = (text: string): number | null => {
  const match = text.match(/\d+/);

  return match === null ? null : Number(match[0]);
};

export const normalizeDraft = (raw: RawExtraction): NormalizedDraft => {
  const unmapped: string[] = [];
  const keepIfUnparsed = <TValue>(source: string, value: TValue): TValue => {
    const isEmpty = value === null || (Array.isArray(value) && value.length === 0);
    if (isEmpty && source.trim() !== '') {
      unmapped.push(source.trim());
    }

    return value;
  };

  const category = keepIfUnparsed(raw.category, normalizeCategory(raw.category));
  const listingType = keepIfUnparsed(raw.listingType, normalizeListingType(raw.listingType));
  const rooms = keepIfUnparsed(raw.rooms, parseRooms(raw.rooms));
  const districtResult = canonicalizeDistricts(raw.districts);
  unmapped.push(...districtResult.unmapped);
  const features = mapAmenities(raw.features);
  unmapped.push(...features.unmapped);
  const excludedFeatures = mapAmenities(raw.excludedFeatures);
  unmapped.push(...excludedFeatures.unmapped);
  const budgetMin = keepIfUnparsed(raw.budgetMin, toMoney(raw.budgetMin, raw.budgetCurrency));
  const budgetMax = keepIfUnparsed(raw.budgetMax, toMoney(raw.budgetMax, raw.budgetCurrency));
  const sqmNetMin = keepIfUnparsed(raw.sqmNetMin, parseSqm(raw.sqmNetMin));
  const districts = districtResult.districts.length > 0 ? districtResult.districts.join(', ') : null;

  const criteria = { category, listingType, rooms, districts, budgetMin, budgetMax, sqmNetMin };
  const missingFields = CRITERIA_FIELDS.filter((field) => {
    const value = criteria[field];

    return value === null || (Array.isArray(value) && value.length === 0);
  });

  const excludedUnmapped = new Set(excludedFeatures.unmapped);
  const otherUnmapped = unmapped.filter((item) => !excludedUnmapped.has(item));
  const noteParts = [
    raw.leftover.trim(),
    otherUnmapped.length > 0 ? `eşlenemeyen: ${otherUnmapped.join(', ')}` : '',
    excludedFeatures.unmapped.length > 0
      ? `istenmeyen: ${excludedFeatures.unmapped.join(', ')}`
      : '',
  ].filter((part) => part !== '');

  return {
    ...criteria,
    features: features.values,
    excludedFeatures: excludedFeatures.values,
    notes: noteParts.length > 0 ? `[otomatik] ${noteParts.join('; ')}` : null,
    missingFields: [...missingFields],
    unmapped,
    evidence: parseEvidence(raw.evidence),
  };
};
