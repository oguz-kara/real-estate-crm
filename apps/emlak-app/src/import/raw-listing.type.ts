export type RawListing = {
  'İlan no': string;
  Başlık?: string | null;
  Açıklama?: string | null;
  Kategoriler?: string | null;
  Fiyat?: string | null;
  Adres?: string | null;
  Konum?: string | null;
  Özellikler?: Record<string, string | null> | null;
  'Aktif Görsel Listesi'?: string[] | null;
  'Video Listesi'?: string[] | null;
};

export type ImportIssueReason =
  | 'UNMAPPED_KEY'
  | 'UNMAPPED_VALUE'
  | 'INVALID'
  | 'DUPLICATE';

export type ImportIssue = {
  externalId: string | null;
  field: string;
  raw: string;
  reason: ImportIssueReason;
};
