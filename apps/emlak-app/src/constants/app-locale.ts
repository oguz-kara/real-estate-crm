// Metadata labels (object, field, option, view names) are workspace-wide
// strings in Twenty, so the language is decided once per sync: run
// `TWENTY_APP_LOCALE=en yarn twenty apply` against the demo workspace,
// plain `yarn twenty apply` (tr) against the office workspace.
export type AppLocale = 'tr' | 'en';

// string means "Turkish only, no translation yet" — en falls back to tr,
// so labels can be translated incrementally without breaking a sync
export type LocalizedText = string | { tr: string; en?: string };

export const APP_LOCALE: AppLocale =
  process.env.TWENTY_APP_LOCALE === 'en' ? 'en' : 'tr';

export const resolveLabel = (
  text: LocalizedText,
  locale: AppLocale = APP_LOCALE,
): string => {
  if (typeof text === 'string') {
    return text;
  }

  return locale === 'en' ? (text.en ?? text.tr) : text.tr;
};

// The sahibinden import matches the export's raw Turkish strings, so its
// lookup tables always key off tr regardless of the UI locale.
export const trLabel = (text: LocalizedText): string =>
  typeof text === 'string' ? text : text.tr;

// Filled as a side effect of building the manifest; the catalog-fill script
// dumps it to complete locales/tr-TR.json without a second source of truth.
export const METADATA_LABEL_PAIRS = new Map<string, string>();

// Metadata labels must be ENGLISH at the source: Twenty's per-application
// translation catalog keys off the source string, and the SDK refuses to
// compile an 'en' catalog — so English is the only source that lets both
// languages work at runtime.
export const metadataLabel = (text: LocalizedText): string => {
  if (typeof text === 'string') {
    return text;
  }
  if (text.en === undefined) {
    return text.tr;
  }
  METADATA_LABEL_PAIRS.set(text.en, text.tr);

  return text.en;
};
