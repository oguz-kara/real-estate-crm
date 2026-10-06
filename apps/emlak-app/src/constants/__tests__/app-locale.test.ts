import { describe, expect, test } from 'vitest';

import {
  METADATA_LABEL_PAIRS,
  metadataLabel,
  resolveLabel,
  trLabel,
} from 'src/constants/app-locale';

describe('resolveLabel', () => {
  test('plain string resolves to itself in every locale', () => {
    expect(resolveLabel('Isıtma', 'tr')).toBe('Isıtma');
    expect(resolveLabel('Isıtma', 'en')).toBe('Isıtma');
  });

  test('localized text picks the requested locale', () => {
    const text = { tr: 'Isıtma', en: 'Heating' };
    expect(resolveLabel(text, 'tr')).toBe('Isıtma');
    expect(resolveLabel(text, 'en')).toBe('Heating');
  });

  test('missing en falls back to tr so partial translation never breaks the manifest', () => {
    expect(resolveLabel({ tr: 'Isıtma' }, 'en')).toBe('Isıtma');
  });
});

describe('metadataLabel', () => {
  // catalog keys ARE the manifest source strings, so metadata sources must
  // be English; the tr half is recorded for the catalog-fill script
  test('returns the English source and records the en→tr pair', () => {
    expect(metadataLabel({ tr: 'Portföy', en: 'Property' })).toBe('Property');
    expect(METADATA_LABEL_PAIRS.get('Property')).toBe('Portföy');
  });

  test('falls back to tr when en is missing, without recording a pair', () => {
    expect(metadataLabel({ tr: 'Sadece Türkçe' })).toBe('Sadece Türkçe');
    expect(METADATA_LABEL_PAIRS.has('Sadece Türkçe')).toBe(false);
  });

  test('plain strings pass through untouched', () => {
    expect(metadataLabel('Name')).toBe('Name');
  });
});

describe('trLabel', () => {
  // the sahibinden import mapping must key off the fixed Turkish label
  // whatever the UI locale is — otherwise switching to en breaks import
  test('always returns the Turkish label', () => {
    expect(trLabel('Isıtma')).toBe('Isıtma');
    expect(trLabel({ tr: 'Isıtma', en: 'Heating' })).toBe('Isıtma');
  });
});
