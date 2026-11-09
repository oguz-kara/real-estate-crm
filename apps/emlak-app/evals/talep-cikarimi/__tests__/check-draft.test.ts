import { describe, expect, test } from 'vitest';

import { anyOf, checkDraft, type DraftRecord } from '../check-draft';
import { type IntakeScenario } from '../scenario.type';

const SCENARIO: IntakeScenario = {
  id: 'T1',
  style: 'whatsapp',
  source: 'WHATSAPP',
  text: 'Ahmet Yılmaz 0532 456 78 90 Bornova 3+1 satılık 5m',
  expected: {
    listingType: 'SATILIK',
    category: anyOf('KONUT', null),
    rooms: ['R3_1'],
    districts: 'Bornova',
    budgetMax: { amountMicros: 5_000_000_000_000, currencyCode: 'TRY' },
  },
  featuresInclude: ['ASANSOR'],
  mustBeEmpty: ['budgetMin'],
  gecmeTanimi: 'test',
};

const GOOD_DRAFT: DraftRecord = {
  category: null,
  listingType: 'SATILIK',
  rooms: ['R3_1'],
  districts: 'Bornova',
  features: ['ASANSOR', 'OTOPARK'],
  excludedFeatures: [],
  budgetMin: { amountMicros: null, currencyCode: 'TRY' },
  budgetMax: { amountMicros: '5000000000000', currencyCode: 'TRY' },
  sqmNetMin: null,
  notes: null,
  extraction: { outcome: 'ok', maskedText: '[MÜŞTERİ] [TELEFON_1] Bornova 3+1 satılık 5m' },
};

describe('checkDraft', () => {
  test('a draft meeting every expectation has no failures', () => {
    expect(checkDraft(SCENARIO, GOOD_DRAFT)).toEqual([]);
  });

  test('reports a wrong field, a missing feature and a filled must-be-empty field', () => {
    const failures = checkDraft(SCENARIO, {
      ...GOOD_DRAFT,
      listingType: 'KIRALIK',
      features: [],
      budgetMin: { amountMicros: 1_000_000_000_000, currencyCode: 'TRY' },
    });
    expect(failures).toEqual([
      'listingType: beklenen "SATILIK", bulunan "KIRALIK"',
      'features: ASANSOR yok',
      'budgetMin boş olmalıydı',
    ]);
  });

  test('flags personal data left in the masked text and a failed extraction', () => {
    const failures = checkDraft(SCENARIO, {
      ...GOOD_DRAFT,
      extraction: { outcome: 'extraction-failed', maskedText: 'Ahmet 0532 456 78 90' },
    });
    expect(failures).toContain('maskedText kişisel veri içeriyor');
    expect(failures).toContain('çıkarım başarısız (extraction-failed)');
  });
});
