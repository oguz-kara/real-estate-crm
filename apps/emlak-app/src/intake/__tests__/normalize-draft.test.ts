import { describe, expect, test } from 'vitest';

import {
  canonicalizeDistricts,
  mapAmenities,
  normalizeCategory,
  normalizeDraft,
  normalizeListingType,
  parseAmount,
  parseRooms,
} from 'src/intake/normalize-draft';
import { parseRawExtraction, type RawExtraction } from 'src/intake/raw-extraction';

const EMPTY_RAW: RawExtraction = {
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

describe('parseAmount', () => {
  test.each([
    ['5m', { amount: 5_000_000, currency: 'TRY' }],
    ['5M', { amount: 5_000_000, currency: 'TRY' }],
    ['5 milyon', { amount: 5_000_000, currency: 'TRY' }],
    ['1,2 milyon euro', { amount: 1_200_000, currency: 'EUR' }],
    ['1.2 milyon euro', { amount: 1_200_000, currency: 'EUR' }],
    ['4.150.000 TL', { amount: 4_150_000, currency: 'TRY' }],
    ['500 bin', { amount: 500_000, currency: 'TRY' }],
    ['55k', { amount: 55_000, currency: 'TRY' }],
    ['120 bin dolar', { amount: 120_000, currency: 'USD' }],
    ['300 bin €', { amount: 300_000, currency: 'EUR' }],
    ['beş milyon', { amount: 5_000_000, currency: 'TRY' }],
    ['yüz yirmi bin dolar', { amount: 120_000, currency: 'USD' }],
    ['5', null],
    ['', null],
  ])('parseAmount(%s)', (input, expected) => {
    expect(parseAmount(input)).toEqual(expected);
  });

  test('uses the currency hint when the text has none', () => {
    expect(parseAmount('1.2 milyon', 'EUR')).toEqual({ amount: 1_200_000, currency: 'EUR' });
  });
});

describe('parseRooms', () => {
  test('maps Turkish room phrases to option codes', () => {
    expect(parseRooms('4 veya 5 oda')).toEqual(['R4_1', 'R5_1']);
    expect(parseRooms('3+1, 4+1')).toEqual(['R3_1', 'R4_1']);
    expect(parseRooms('üç artı bir')).toEqual(['R3_1']);
    expect(parseRooms('7+2')).toEqual(['R7_PLUS']);
    expect(parseRooms('')).toEqual([]);
  });
});

describe('canonicalizeDistricts', () => {
  test('maps neighborhoods to districts', () => {
    expect(canonicalizeDistricts('Alaçatı ve Çeşme merkez')).toEqual({
      districts: ['Çeşme'],
      unmapped: ['Alaçatı'],
    });
    expect(canonicalizeDistricts('Bornova, Bayraklı')).toEqual({
      districts: ['Bornova', 'Bayraklı'],
      unmapped: [],
    });
    expect(canonicalizeDistricts('Çeşme ya da Urla')).toEqual({
      districts: ['Çeşme', 'Urla'],
      unmapped: [],
    });
    expect(canonicalizeDistricts('Erzene')).toEqual({ districts: [], unmapped: ['Erzene'] });
  });
});

describe('mapAmenities', () => {
  test('maps phrases and reports leftovers', () => {
    expect(mapAmenities('özel havuz, bahçe, deniz manzaralı')).toEqual({
      values: ['MUSTAKIL_HAVUZLU', 'BAHCE'],
      unmapped: ['deniz manzaralı'],
    });
    expect(mapAmenities('asansörlü, kapalı otopark')).toEqual({
      values: ['ASANSOR', 'KAPALI_OTOPARK'],
      unmapped: [],
    });
  });
});

describe('category and listing type', () => {
  test('accepts codes and Turkish aliases, rejects the rest', () => {
    expect(normalizeCategory('KONUT')).toBe('KONUT');
    expect(normalizeCategory('villa')).toBe('KONUT');
    expect(normalizeCategory('ofis')).toBe('ISYERI');
    expect(normalizeCategory('uzay üssü')).toBeNull();
    expect(normalizeListingType('kiralık')).toBe('KIRALIK');
    expect(normalizeListingType('SATILIK')).toBe('SATILIK');
    expect(normalizeListingType('')).toBeNull();
  });
});

describe('normalizeDraft', () => {
  test('builds notes from leftover and unmapped, lists missing fields', () => {
    const draft = normalizeDraft({
      ...EMPTY_RAW,
      category: 'KONUT',
      listingType: 'SATILIK',
      rooms: '4 veya 5 oda',
      districts: 'Alaçatı ve Çeşme merkez',
      features: 'özel havuz, bahçe, deniz manzaralı',
      excludedFeatures: 'gürültülü',
      budgetMax: '1.2 milyon euro',
      budgetCurrency: 'EUR',
      leftover: 'yazlık ve yatırım amaçlı, Haziran içinde',
      evidence: '{"budgetMax":"1.2 milyon euroya kadar"}',
    });
    expect(draft.districts).toBe('Çeşme');
    expect(draft.rooms).toEqual(['R4_1', 'R5_1']);
    expect(draft.features).toEqual(['MUSTAKIL_HAVUZLU', 'BAHCE']);
    expect(draft.excludedFeatures).toEqual([]);
    expect(draft.budgetMax).toEqual({ amountMicros: 1_200_000_000_000, currencyCode: 'EUR' });
    expect(draft.budgetMin).toBeNull();
    expect(draft.missingFields).toEqual(['budgetMin', 'sqmNetMin']);
    expect(draft.notes).toMatch(/^\[otomatik\] /);
    expect(draft.notes).toContain('Haziran');
    expect(draft.notes).toContain('Alaçatı');
    expect(draft.notes).toContain('gürültülü');
    expect(draft.unmapped).toEqual(expect.arrayContaining(['Alaçatı', 'deniz manzaralı', 'gürültülü']));
    expect(draft.evidence.budgetMax).toBe('1.2 milyon euroya kadar');
  });

  test('an empty extraction yields no criteria, no notes and every field missing', () => {
    const draft = normalizeDraft(EMPTY_RAW);
    expect(draft.notes).toBeNull();
    expect(draft.missingFields).toEqual([
      'category',
      'listingType',
      'rooms',
      'districts',
      'budgetMin',
      'budgetMax',
      'sqmNetMin',
    ]);
    expect(draft.evidence).toEqual({});
  });

  test('parses sqmNetMin digits and ignores garbage', () => {
    expect(normalizeDraft({ ...EMPTY_RAW, sqmNetMin: '120 m2' }).sqmNetMin).toBe(120);
    expect(normalizeDraft({ ...EMPTY_RAW, sqmNetMin: 'geniş' }).sqmNetMin).toBeNull();
  });
});

describe('parseRawExtraction', () => {
  test('tolerates missing keys and rejects non-objects', () => {
    expect(parseRawExtraction({ category: 'KONUT' })?.listingType).toBe('');
    expect(parseRawExtraction({ category: 'KONUT' })?.category).toBe('KONUT');
    expect(parseRawExtraction({ sqmNetMin: 120 })?.sqmNetMin).toBe('120');
    expect(parseRawExtraction('x')).toBeNull();
    expect(parseRawExtraction(null)).toBeNull();
  });

  test('parses a JSON string', () => {
    expect(parseRawExtraction('{"category":"ARSA"}')?.category).toBe('ARSA');
  });

  test('parses a json object wrapped in a code fence or prose', () => {
    expect(parseRawExtraction('```json\n{"category":"ARSA"}\n```')?.category).toBe('ARSA');
    expect(parseRawExtraction('Sonuç: {"listingType":"KIRALIK"} tamam')?.listingType).toBe('KIRALIK');
    expect(parseRawExtraction('json yok')).toBeNull();
  });
});
