const FOLD_MAP: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
  â: 'a',
  î: 'i',
  û: 'u',
};

// Typed notes and speech-to-text drop Turkish diacritics unpredictably, so
// every lookup compares folded forms.
export const foldTurkish = (text: string): string =>
  text
    .toLocaleLowerCase('tr-TR')
    .normalize('NFD')
    .replace(/̇/g, '')
    .normalize('NFC')
    .replace(/[çğıöşüâîû]/g, (character) => FOLD_MAP[character] ?? character);
