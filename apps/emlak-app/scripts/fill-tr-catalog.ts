import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { METADATA_LABEL_PAIRS } from '../src/constants/app-locale';

// Descriptions and names whose source never had a {tr, en} pair in code.
const EXTRA_TRANSLATIONS: Record<string, string> = {
  Name: 'İsim',
  'Comma-separated; empty means anywhere': 'Virgülle ayrılır; boşsa her yer',
  'Computed by the nightly sweep; do not edit by hand':
    'Gece taraması hesaplar; elle düzenlemeyin',
  'Free text; the future AI layer reads this':
    'Serbest metin; ileride yapay zekâ katmanı okur',
  'Internal dedupe marker for lapse tasks':
    'Takip görevleri için iç tekrarlama işareti',
};

// The flat en→tr registry cannot tell apart the same English source used in
// two contexts (object plural "Requests" = Talepler vs person field
// "Requests" = Talepleri); these context-scoped values win last.
const GROUP_OVERRIDES: Record<string, Record<string, string>> = {
  'objectMetadata.labelPlural': { 'Buyer Requests': 'Talepler' },
  // auto-created base fields of custom objects are not in the manifest, so
  // the extract never scaffolds them; inserted here so tr users see them
  'fieldMetadata.label': {
    'Creation date': 'Oluşturulma tarihi',
    'Last update': 'Son güncelleme',
    'Created by': 'Oluşturan',
    'Deleted at': 'Silinme tarihi',
    Position: 'Pozisyon',
  },
};

const MANIFEST_DIRS = ['objects', 'fields', 'views', 'navigation-menu-items'];

const importManifestModules = async (): Promise<void> => {
  for (const dir of MANIFEST_DIRS) {
    const dirPath = path.join(__dirname, '..', 'src', dir);
    for (const file of readdirSync(dirPath)) {
      if (file.endsWith('.ts')) {
        await import(path.join(dirPath, file));
      }
    }
  }
};

const run = async (): Promise<void> => {
  await importManifestModules();

  const catalogPath = path.join(__dirname, '..', 'locales', 'tr-TR.json');
  const catalog: Record<string, Record<string, string>> = JSON.parse(
    readFileSync(catalogPath, 'utf8'),
  );

  let filled = 0;
  const unfilled: string[] = [];

  for (const [group, overrides] of Object.entries(GROUP_OVERRIDES)) {
    catalog[group] = { ...catalog[group], ...overrides };
  }

  for (const [group, entries] of Object.entries(catalog)) {
    for (const [source, translation] of Object.entries(entries)) {
      if (GROUP_OVERRIDES[group]?.[source] !== undefined) {
        continue;
      }
      if (translation !== '') {
        continue;
      }
      const turkish =
        METADATA_LABEL_PAIRS.get(source) ?? EXTRA_TRANSLATIONS[source];
      if (turkish !== undefined && turkish !== source) {
        entries[source] = turkish;
        filled += 1;
      } else {
        unfilled.push(`${group}: ${source}`);
      }
    }
  }

  writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`filled ${filled} entries`);
  if (unfilled.length > 0) {
    console.log(`left empty (${unfilled.length}):`);
    for (const key of unfilled) {
      console.log(`  - ${key}`);
    }
  }
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
