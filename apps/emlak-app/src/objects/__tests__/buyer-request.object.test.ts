import { describe, expect, test } from 'vitest';

import { BUYER_REQUEST_FIELD_IDS } from 'src/constants/request-field-ids';
import buyerRequest from 'src/objects/buyer-request.object';

const fieldByName = (name: string) =>
  buyerRequest.config.fields?.find((field) => field.name === name);

const optionsOf = (name: string) => {
  const field = fieldByName(name);

  return field !== undefined && 'options' in field ? (field.options ?? []) : [];
};

describe('buyerRequest object', () => {
  test('status has TASLAK option in gray at position 4 and keeps AKTIF default', () => {
    expect(fieldByName('status')?.defaultValue).toBe("'AKTIF'");
    expect(optionsOf('status')).toContainEqual(
      expect.objectContaining({ value: 'TASLAK', color: 'gray', position: 4 }),
    );
  });

  test('source is a SELECT with the five intake sources', () => {
    expect(optionsOf('source').map((option) => option.value)).toEqual([
      'WHATSAPP',
      'TELEFON',
      'YUZ_YUZE',
      'DEFTER',
      'DIGER',
    ]);
  });

  test('sourceText is TEXT and extraction is RAW_JSON with stable ids', () => {
    expect(fieldByName('sourceText')?.type).toBe('TEXT');
    expect(fieldByName('sourceText')?.universalIdentifier).toBe(
      BUYER_REQUEST_FIELD_IDS.sourceText,
    );
    expect(fieldByName('extraction')?.type).toBe('RAW_JSON');
    expect(fieldByName('extraction')?.universalIdentifier).toBe(
      BUYER_REQUEST_FIELD_IDS.extraction,
    );
  });
});
