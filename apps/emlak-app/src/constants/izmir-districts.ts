import { foldTurkish } from 'src/intake/fold-turkish';

export const IZMIR_DISTRICTS = [
  'Aliağa',
  'Balçova',
  'Bayındır',
  'Bayraklı',
  'Bergama',
  'Beydağ',
  'Bornova',
  'Buca',
  'Çeşme',
  'Çiğli',
  'Dikili',
  'Foça',
  'Gaziemir',
  'Güzelbahçe',
  'Karabağlar',
  'Karaburun',
  'Karşıyaka',
  'Kemalpaşa',
  'Kınık',
  'Kiraz',
  'Konak',
  'Menderes',
  'Menemen',
  'Narlıdere',
  'Ödemiş',
  'Seferihisar',
  'Selçuk',
  'Tire',
  'Torbalı',
  'Urla',
] as const;

// Neighborhood / resort names people use instead of the district; keys are
// folded (see foldTurkish).
export const DISTRICT_ALIASES: Record<string, string> = {
  alacati: 'Çeşme',
  ilica: 'Çeşme',
  dalyan: 'Çeşme',
  ciftlikkoy: 'Çeşme',
  gumuldur: 'Menderes',
  ozdere: 'Menderes',
  mordogan: 'Karaburun',
  sirinyer: 'Buca',
  alsancak: 'Konak',
  goztepe: 'Konak',
  bostanli: 'Karşıyaka',
  mavisehir: 'Karşıyaka',
  hatay: 'Karabağlar',
  sigacik: 'Seferihisar',
  iskele: 'Urla',
};

const DISTRICT_BY_FOLDED = new Map<string, string>(
  IZMIR_DISTRICTS.map((district) => [foldTurkish(district), district]),
);

const consonantSkeleton = (folded: string): string => folded.replace(/[aeiou\s]/g, '');

const DISTRICTS_BY_SKELETON = IZMIR_DISTRICTS.reduce((map, district) => {
  const skeleton = consonantSkeleton(foldTurkish(district));
  map.set(skeleton, [...(map.get(skeleton) ?? []), district]);

  return map;
}, new Map<string, string[]>());

// Notebook shorthand drops vowels ("Brnv" = Bornova); only a skeleton that
// points at exactly one district is trusted.
const districtFromAbbreviation = (folded: string): string | null => {
  if (folded.length < 3 || /[aeiou]/.test(folded) || !/^[a-z]+$/.test(folded)) {
    return null;
  }
  const candidates = DISTRICTS_BY_SKELETON.get(folded) ?? [];

  return candidates.length === 1 ? candidates[0] : null;
};

// Turkish case endings people append without an apostrophe ("bornovada").
const CASE_SUFFIXES = ['', 'a', 'e', 'i', 'u', 'da', 'de', 'ta', 'te', 'ya', 'ye', 'yi', 'yu', 'dan', 'den', 'tan', 'ten', 'daki', 'deki', 'taki', 'teki', 'in', 'un', 'nin', 'nun'];

const lookupWord = (word: string): string | null => {
  for (const suffix of CASE_SUFFIXES) {
    if (suffix !== '' && !word.endsWith(suffix)) {
      continue;
    }
    const stem = word.slice(0, word.length - suffix.length);
    const district = DISTRICT_BY_FOLDED.get(stem) ?? DISTRICT_ALIASES[stem];
    if (district !== undefined && DISTRICT_BY_FOLDED.has(foldTurkish(district))) {
      return district;
    }
  }

  return null;
};

export const canonicalizeDistrict = (input: string): string | null => {
  const folded = foldTurkish(input.replace(/['’`][\p{L}]*/gu, ''))
    .trim()
    .replace(/\s+/g, ' ');
  const words = folded.split(' ').filter((word) => word !== '' && word !== 'izmir');
  if (words.length === 0) {
    return null;
  }
  const joined = words.join(' ');
  const direct = DISTRICT_BY_FOLDED.get(joined) ?? DISTRICT_ALIASES[joined];
  if (direct !== undefined && DISTRICT_BY_FOLDED.has(foldTurkish(direct))) {
    return direct;
  }
  for (const word of words) {
    const district = lookupWord(word);
    if (district !== null) {
      return district;
    }
  }

  return districtFromAbbreviation(joined);
};
