import { describe, expect, test } from 'vitest';

import { resolveLabel, trLabel } from 'src/constants/app-locale';

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

describe('trLabel', () => {
  // the sahibinden import mapping must key off the fixed Turkish label
  // whatever the UI locale is — otherwise switching to en breaks import
  test('always returns the Turkish label', () => {
    expect(trLabel('Isıtma')).toBe('Isıtma');
    expect(trLabel({ tr: 'Isıtma', en: 'Heating' })).toBe('Isıtma');
  });
});
