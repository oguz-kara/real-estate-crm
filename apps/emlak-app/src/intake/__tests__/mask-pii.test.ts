import { describe, expect, test } from 'vitest';

import { containsPii, maskPii, type PersonIdentity } from 'src/intake/mask-pii';

const AHMET: PersonIdentity = { firstName: 'Ahmet', lastName: 'Yılmaz', phones: ['+905324567890'] };
const NAMELESS: PersonIdentity = { firstName: null, lastName: null, phones: [] };

describe('maskPii', () => {
  test('masks every Turkish phone format', () => {
    const text =
      'Tel +90 532 456 78 90 veya 0532.456.78.90, (0532) 456 7890, 05324567890, sabit 0232 123 45 67';
    const result = maskPii(text, AHMET);
    expect(result.phoneCount).toBe(5);
    expect(result.maskedText).not.toMatch(/\d{3}[\s.]?\d{2}[\s.]?\d{2}/);
    expect(result.maskedText).toContain('[TELEFON_1]');
    expect(result.maskedText).toContain('[TELEFON_5]');
  });

  test('does not mask room plans or amounts', () => {
    const result = maskPii('Bornova 3+1, bütçe 4.150.000 TL, 120 m², 1.200.000 euro', AHMET);
    expect(result.phoneCount).toBe(0);
    expect(result.maskedText).toBe('Bornova 3+1, bütçe 4.150.000 TL, 120 m², 1.200.000 euro');
  });

  test('masks Turkish national ID numbers and IBANs', () => {
    const result = maskPii('TC 34567890123, IBAN TR33 0006 1005 1978 6457 8413 26 gönderdi', AHMET);
    expect(result.maskedText).toBe('TC [KIMLIK_1], IBAN [IBAN_1] gönderdi');
    expect(result.leak).toBe(false);
    expect(containsPii('TC 34567890123', AHMET)).toBe(true);
    expect(containsPii('TR330006100519786457841326', AHMET)).toBe(true);
  });

  test('masks emails', () => {
    const result = maskPii('mail ahmet.y+ev@example.com.tr yeter', AHMET);
    expect(result.maskedText).toBe('mail [EPOSTA_1] yeter');
    expect(result.emailCount).toBe(1);
  });

  test('redacts name case- and diacritic-insensitively, whole words only', () => {
    const result = maskPii('ahmet yilmaz aradı, AHMET Çeşme istiyor, Ahmetler sokağı', AHMET);
    expect(result.maskedText).toBe('[MÜŞTERİ] aradı, [MÜŞTERİ] Çeşme istiyor, Ahmetler sokağı');
    expect(result.nameRedacted).toBe(true);
  });

  test('redacts Turkish possessive and case suffixes after an apostrophe', () => {
    expect(maskPii("Yılmaz'ın bütçesi", AHMET).maskedText).toBe("[MÜŞTERİ]'ın bütçesi");
  });

  test('reports leak=false when clean, also for a person without a name', () => {
    expect(maskPii('Çeşme villa 1.2 milyon euro', NAMELESS).leak).toBe(false);
    expect(maskPii('Ahmet Yılmaz 0532 456 78 90', AHMET).leak).toBe(false);
  });
});

describe('containsPii', () => {
  test('detects a remaining phone, email or name', () => {
    expect(containsPii('[MÜŞTERİ] 0532 456 78 90', AHMET)).toBe(true);
    expect(containsPii('[MÜŞTERİ] a@b.co', AHMET)).toBe(true);
    expect(containsPii('Yilmaz bey', AHMET)).toBe(true);
    expect(containsPii('[MÜŞTERİ] Çeşme', AHMET)).toBe(false);
  });

  test('detects the person own phone digits written in an unusual layout', () => {
    expect(containsPii('numara 532-4567-890', AHMET)).toBe(true);
  });
});
