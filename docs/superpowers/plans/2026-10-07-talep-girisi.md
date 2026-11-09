# Metinden Talep Girişi (v1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bir Kişi kaydının üstünde yapıştırılan serbest Türkçe metinden, kişisel veriyi LLM'e göstermeden, o kişiye bağlı bir TASLAK talep çıkarmak; insan onayıyla (status → AKTİF) mevcut eşleştirme döngüsünü tetiklemek.

**Architecture:** Twenty'nin `document-generator` örneğiyle aynı desen: Kişi seçiliyken komut menüsü öğesi → yan panelde front component formu → `POST /s/talep/cikar` (httpRoute logic function) → saf `runIntake` çekirdeği (maskele → JSON-şemalı çıkarım ajanı `runAgent` → kod-tarafı normalizasyon → `buyerRequest` TASLAK + görev). Taslak, eşleştirme çekirdeğinin mevcut `status !== 'AKTIF'` kapısı sayesinde motora girmez; onayda mevcut `match-request-on-update` tetikleyicisi çalışır.

**Tech Stack:** twenty-sdk 2.44 (`defineLogicFunction` httpRoute, `defineAgent` json responseFormat, `defineRole`, `defineCommandMenuItem`, `defineFrontComponent`, `defineView`), twenty-client-sdk (`CoreApiClient`, `MetadataApiClient.runAgent`, `RestApiClient`), React 19 (front component), zod (uygulamada mevcut), vitest, Playwright (e2e ekran görüntüleri), DeepSeek `deepseek/deepseek-flash`.

**Spec:** `docs/superpowers/specs/2026-10-07-talep-girisi-design.md`

**Spec'ten sapmalar (uygulama zorunluluğu, davranış aynı):**
1. Twenty `AgentResponseSchema` düz nesne ve yalnızca `string|number|boolean` (dizi/iç nesne yok). Çıkarım ajanı tüm alanları **string** döndürür (boş string = yok); dizi/para birimi/tutar ayrıştırmasını `normalizeDraft` yapar. Spec'teki "kod doğrular, LLM'e güvenilmez" ilkesiyle uyumlu.
2. Yeni alanların API adları mevcut `buyerRequest` alanlarıyla tutarlı olarak İngilizce: `source` (etiket "Kaynak"), `sourceText` ("Kaynak Metin"), `extraction` ("Çıkarım Detayı"). Etiketler Türkçe. Spec'teki `kaynak/kaynakMetin/cikarimDetayi` bu adlara karşılık gelir.

## Global Constraints

- Model: `deepseek/deepseek-flash`; çıkarım ajanının rolü sıfır erişimli (`canReadAllObjectRecords: false`, tüm yazma false, `canAccessAllTools: false`, `canBeAssignedToAgents: true`).
- `status` yeni seçeneği: `{ value: 'TASLAK', label tr 'Taslak' / en 'Draft', color 'gray', position 4 }`; varsayılan `AKTIF` değişmez.
- `source` seçenekleri: `WHATSAPP` 'WhatsApp', `TELEFON` 'Telefon', `YUZ_YUZE` 'Yüz yüze', `DEFTER` 'Defter', `DIGER` 'Diğer'.
- `extraction` RAW_JSON şekli: `{ maskedText: string; evidence: Record<string,string>; missingFields: string[]; unmapped: string[]; model: string; agentUniversalIdentifier: string; extractedAt: string; outcome: 'ok' | 'extraction-failed' }`.
- Rota: `httpRouteTriggerSettings: { path: '/talep/cikar', httpMethod: 'POST', isAuthRequired: true }`; front component `new RestApiClient().post('/s/talep/cikar', body)`; fonksiyon `timeoutSeconds: 60`.
- Girdi: `text.trim().length >= 10`, `personId` var olan Kişi; aksi halde 400/404.
- Görev: başlık `Taslak talebi onayla: <Ad Soyad>`; status `TODO`; `dueAt = now`; hedefler `targetBuyerRequestId` + `targetPersonId`; atanmamış (sweeper görevleriyle aynı).
- Taslak talep adı (`name`): `<Ad Soyad> talebi` (ad yoksa `Talep`).
- Maskeleme sonrası metinde telefon deseni, e-posta veya kişi adı kalırsa ajan ÇAĞRILMAZ; `outcome: 'extraction-failed'`, `unmapped` içine `'maskeleme eksik'`.
- Ham metin yalnızca `sourceText` alanında; `console.log` ile asla yazılmaz.
- Çıkarım başarısız (ajan hatası / JSON ayrıştırılamıyor) → bir tekrar → yine olmazsa yalnızca `sourceText` + `extraction.outcome='extraction-failed'` ile TASLAK yine açılır, görev yine oluşur.
- Eval başarı eşiği ≥%80; eval metinleri uydurma kişi/telefon içerir, gerçek veri yok.
- Kod kuralları (CLAUDE.md): kısa `//` yorum yalnızca "neden"; type > interface; named export; `any` yok; `isDefined`/`isNonEmptyString` gibi mevcut guard'lar; Türkçe etiketler `metadataLabel`/`trLabel`/`resolveLabel` ile; AI atfı yok; commit yazarı `oguz-kara <dev.hasan.kara@gmail.com>`.
- Her task sonunda: `yarn typecheck && yarn test:unit && yarn lint` (apps/emlak-app içinde) yeşil; manifest değişen task'lerde `yarn twenty apply` başarılı.

## Review Focus

1. Kişi adı metinde farklı büyük/küçük harf ve aksansız yazılmışsa ("ahmet yilmaz", "AHMET") yine `[MÜŞTERİ]` olmalı → Task 3 testi `redacts name case- and diacritic-insensitively`.
2. Telefon `+90 532 456 78 90`, `0532.456.78.90`, `(0532) 456 7890`, `05324567890` biçimlerinin hepsi maskelenmeli; "4+1" veya "1.200.000" telefon sanılmamalı → Task 3 testleri `masks every Turkish phone format`, `does not mask room plans or amounts`.
3. Tutar "5m", "5 milyon", "1,2 milyon euro", "4.150.000 TL", "500 bin" ayrıştırılmalı; tek başına "5" bütçe sayılmamalı → Task 2 testleri `parseAmount` tablo testi.
4. Metin mahalle adı içeriyorsa (Alaçatı, Gümüldür, Mordoğan) ilçe kanonik (Çeşme, Menderes, Karaburun) ve mahalle `unmapped`/notlara → Task 2 testi `canonicalizeDistricts maps neighborhoods to districts`.
5. Talep içermeyen metin ("Teşekkürler, görüşürüz.") kullanıcı açıkça tetiklediği için yine TASLAK açılır, tüm kriterler boş, `missingFields` tam liste, özet "kriter bulunamadı" → Task 5 testi `creates an empty draft for non-request text`. Formda çift tıklama ikinci taslak açmamalı → Task 7 (gönderim sırasında düğme devre dışı).

---

### Task 1: Veri modeli — TASLAK durumu, source/sourceText/extraction alanları, "Onay Bekleyen Talepler" görünümü

**Files:**
- Modify: `apps/emlak-app/src/constants/request-field-ids.ts` (BUYER_REQUEST_FIELD_IDS'e `source`, `sourceText`, `extraction`; `ONAY_BEKLEYEN_TALEPLER_VIEW_ID`)
- Modify: `apps/emlak-app/src/objects/buyer-request.object.ts` (status seçeneği + 3 alan)
- Create: `apps/emlak-app/src/views/onay-bekleyen-talepler.view.ts`
- Modify: `apps/emlak-app/locales/tr-TR.json` (i18n fill çıktısı)
- Test: `apps/emlak-app/src/objects/__tests__/buyer-request.object.test.ts`

**Interfaces:**
- Produces: `BUYER_REQUEST_FIELD_IDS.source | sourceText | extraction` (UUID v4 sabitleri), `ONAY_BEKLEYEN_TALEPLER_VIEW_ID`; `buyerRequest` üzerinde `status` değeri `'TASLAK'`, `source` SELECT, `sourceText` TEXT, `extraction` RAW_JSON.

- [ ] **Step 1: Kimlikleri üret ve sabitlere ekle**

`node -e "for (let i=0;i<9;i++) console.log(require('crypto').randomUUID())"` ile 9 UUID: 3 alan + 1 görünüm + 1 görünüm filtresi + 4 görünüm sütunu (kişi, kaynak, ilan tipi, ilçeler; kategori/bütçe/oda için mevcut alan sabitleri + 3 ek UUID gerekirse aynı komutla). `request-field-ids.ts`'e ekle.

- [ ] **Step 2: Başarısız testi yaz**

```ts
// src/objects/__tests__/buyer-request.object.test.ts
import { describe, expect, test } from 'vitest';
import buyerRequest from '../buyer-request.object';
import { BUYER_REQUEST_FIELD_IDS } from 'src/constants/request-field-ids';

const fieldByName = (name: string) => buyerRequest.fields.find((f) => f.name === name);

describe('buyerRequest object', () => {
  test('status has TASLAK option in gray at position 4 and keeps AKTIF default', () => {
    const status = fieldByName('status');
    expect(status?.defaultValue).toBe("'AKTIF'");
    expect(status?.options).toContainEqual(expect.objectContaining({ value: 'TASLAK', color: 'gray', position: 4 }));
  });
  test('source is a SELECT with the five intake sources', () => {
    expect(fieldByName('source')?.options?.map((o) => o.value)).toEqual(['WHATSAPP', 'TELEFON', 'YUZ_YUZE', 'DEFTER', 'DIGER']);
  });
  test('sourceText is TEXT and extraction is RAW_JSON with stable ids', () => {
    expect(fieldByName('sourceText')?.universalIdentifier).toBe(BUYER_REQUEST_FIELD_IDS.sourceText);
    expect(fieldByName('extraction')?.universalIdentifier).toBe(BUYER_REQUEST_FIELD_IDS.extraction);
  });
});
```

`defineObject` çıktısının `.fields` dizisini sunmadığı görülürse testte `buyerRequest` yerine nesne konfigürasyonunu ayrı bir named export (`BUYER_REQUEST_CONFIG`) olarak dışa aktar ve onu test et; mevcut `property.object.ts` testleri (`src/constants/__tests__`) nasıl yapıyorsa aynı yolu izle.

- [ ] **Step 3: Testi çalıştır, başarısız olduğunu gör**

Run: `cd apps/emlak-app && npx vitest run --config vitest.unit.config.ts src/objects/__tests__/buyer-request.object.test.ts`
Expected: FAIL (TASLAK/source/sourceText/extraction yok)

- [ ] **Step 4: Nesneyi güncelle**

`buyer-request.object.ts`: `status.options`'a `{ value: 'TASLAK', label: trLabel({ tr: 'Taslak', en: 'Draft' }), position: 4, color: 'gray' }`; alanlar: `source` (`FieldType.SELECT`, label `metadataLabel({ tr: 'Kaynak', en: 'Source' })`, icon `IconMessage2`, options yukarıdaki beş, defaultValue yok), `sourceText` (`FieldType.TEXT`, label `{ tr: 'Kaynak Metin', en: 'Source Text' }`, description `{ tr: 'Talebin çıkarıldığı orijinal metin', en: 'Original text the request was extracted from' }`), `extraction` (`FieldType.RAW_JSON`, label `{ tr: 'Çıkarım Detayı', en: 'Extraction Details' }`, icon `IconBraces`). Mevcut alanların kalıbını (universalIdentifier sabitten, `as const`) aynen izle.

- [ ] **Step 5: Görünümü yaz**

`onay-bekleyen-talepler.view.ts`: `aktif-talepler.view.ts` kopyası; `universalIdentifier: ONAY_BEKLEYEN_TALEPLER_VIEW_ID`, `name: metadataLabel({ tr: 'Onay Bekleyen Talepler', en: 'Requests Awaiting Approval' })`, `icon: 'IconClipboardCheck'`, `position: 2`, filtre `status IS ['TASLAK']`, sütunlar sırayla: `buyer`, `source`, `listingType`, `category`, `districts`, `budgetMax`, `rooms` (her biri yeni UUID, `isVisible: true`, genişlikler 160/110/110/110/160/140/120).

- [ ] **Step 6: Test + typecheck + lint**

Run: `cd apps/emlak-app && npx vitest run --config vitest.unit.config.ts src/objects && yarn typecheck && yarn lint`
Expected: PASS, 0 hata

- [ ] **Step 7: Uygula ve i18n**

Run: `cd apps/emlak-app && PATH=/home/user/twenty-apps/.bin:/opt/node24/bin:$PATH COREPACK_ENABLE_DOWNLOAD_PROMPT=0 yarn twenty apply && yarn i18n:extract && yarn i18n:fill`
Expected: `✓ Synced Emlak`; `git diff --stat locales/tr-TR.json` yalnızca yeni etiketleri ekler (Kaynak, Kaynak Metin, Çıkarım Detayı, Taslak, Onay Bekleyen Talepler). Doğrula:
`PGPASSWORD=postgres psql -h localhost -p 5432 -U postgres -d default -t -c "select column_name from information_schema.columns where table_schema='workspace_1wgvd1injqtife6y4rvfbu3h5' and table_name='_buyerRequest' and column_name in ('source','sourceText','extraction')"` → 3 satır.

- [ ] **Step 8: Commit**

```bash
git add apps/emlak-app/src/constants/request-field-ids.ts apps/emlak-app/src/objects apps/emlak-app/src/views/onay-bekleyen-talepler.view.ts apps/emlak-app/locales/tr-TR.json
git commit -m "feat(emlak): draft status, intake source fields and approval view on buyer requests"
```

---

### Task 2: Normalizasyon — İzmir ilçeleri, tutar/oda/özellik ayrıştırma, `normalizeDraft`

**Files:**
- Create: `apps/emlak-app/src/constants/izmir-districts.ts`
- Create: `apps/emlak-app/src/intake/raw-extraction.ts`
- Create: `apps/emlak-app/src/intake/normalize-draft.ts`
- Test: `apps/emlak-app/src/intake/__tests__/normalize-draft.test.ts`, `apps/emlak-app/src/constants/__tests__/izmir-districts.test.ts`

**Interfaces:**
- Produces:
  - `IZMIR_DISTRICTS: readonly string[]` (30 ilçe: Aliağa, Balçova, Bayındır, Bayraklı, Bergama, Beydağ, Bornova, Buca, Çeşme, Çiğli, Dikili, Foça, Gaziemir, Güzelbahçe, Karabağlar, Karaburun, Karşıyaka, Kemalpaşa, Kınık, Kiraz, Konak, Menderes, Menemen, Narlıdere, Ödemiş, Seferihisar, Selçuk, Tire, Torbalı, Urla), `DISTRICT_ALIASES: Record<string, string>` (küçük harf alias → kanonik; en az: alaçatı→Çeşme, ılıca→Çeşme, çeşme merkez→Çeşme, gümüldür→Menderes, özdere→Menderes, mordoğan→Karaburun, şirinyer→Buca, alsancak→Konak, bostanlı→Karşıyaka, mavişehir→Karşıyaka), `canonicalizeDistrict(input: string): string | null` (aksan/harf duyarsız).
  - `type RawExtraction = { category: string; listingType: string; rooms: string; districts: string; features: string; excludedFeatures: string; budgetMin: string; budgetMax: string; budgetCurrency: string; sqmNetMin: string; leftover: string; evidence: string }` (hepsi string; boş = yok), `RAW_EXTRACTION_KEYS: readonly (keyof RawExtraction)[]`, `parseRawExtraction(value: unknown): RawExtraction | null` (nesne değilse null; eksik anahtar → '' ; string olmayan değer → String()).
  - `type Money = { amountMicros: number; currencyCode: 'TRY' | 'EUR' | 'USD' }`
  - `type NormalizedDraft = { category: string | null; listingType: string | null; rooms: string[]; districts: string | null; features: string[]; excludedFeatures: string[]; budgetMin: Money | null; budgetMax: Money | null; sqmNetMin: number | null; notes: string | null; missingFields: string[]; unmapped: string[]; evidence: Record<string, string> }`
  - `normalizeDraft(raw: RawExtraction): NormalizedDraft`
  - Yardımcılar (named export, test için): `parseAmount(text: string, currencyHint?: string): { amount: number; currency: 'TRY' | 'EUR' | 'USD' } | null`, `parseRooms(text: string): string[]` (R-kodları), `canonicalizeDistricts(text: string): { districts: string[]; unmapped: string[] }`, `mapAmenities(text: string): { values: string[]; unmapped: string[] }`, `normalizeCategory(text: string): string | null`, `normalizeListingType(text: string): string | null`.

- [ ] **Step 1: İlçe testini yaz**

```ts
// src/constants/__tests__/izmir-districts.test.ts
test('has 30 districts and canonicalizes aliases case/diacritic-insensitively', () => {
  expect(IZMIR_DISTRICTS).toHaveLength(30);
  expect(canonicalizeDistrict('ALACATI')).toBe('Çeşme');
  expect(canonicalizeDistrict('cesme merkez')).toBe('Çeşme');
  expect(canonicalizeDistrict('Gümüldür')).toBe('Menderes');
  expect(canonicalizeDistrict('Bornova')).toBe('Bornova');
  expect(canonicalizeDistrict('İstanbul')).toBeNull();
});
```

- [ ] **Step 2: Normalizasyon testlerini yaz** (tablo testleri; spec değerleri)

```ts
// src/intake/__tests__/normalize-draft.test.ts
test.each([
  ['5m', { amount: 5_000_000, currency: 'TRY' }],
  ['5 milyon', { amount: 5_000_000, currency: 'TRY' }],
  ['1,2 milyon euro', { amount: 1_200_000, currency: 'EUR' }],
  ['1.2 milyon euro', { amount: 1_200_000, currency: 'EUR' }],
  ['4.150.000 TL', { amount: 4_150_000, currency: 'TRY' }],
  ['500 bin', { amount: 500_000, currency: 'TRY' }],
  ['120 bin dolar', { amount: 120_000, currency: 'USD' }],
  ['5', null],
  ['', null],
])('parseAmount(%s)', (input, expected) => expect(parseAmount(input)).toEqual(expected));

test('parseRooms maps Turkish room phrases to option codes', () => {
  expect(parseRooms('4 veya 5 oda')).toEqual(['R4_1', 'R5_1']);
  expect(parseRooms('3+1, 4+1')).toEqual(['R3_1', 'R4_1']);
  expect(parseRooms('üç artı bir')).toEqual(['R3_1']);
  expect(parseRooms('')).toEqual([]);
});

test('canonicalizeDistricts maps neighborhoods to districts', () => {
  expect(canonicalizeDistricts('Alaçatı ve Çeşme merkez')).toEqual({ districts: ['Çeşme'], unmapped: ['Alaçatı'] });
  expect(canonicalizeDistricts('Bornova, Bayraklı')).toEqual({ districts: ['Bornova', 'Bayraklı'], unmapped: [] });
});

test('mapAmenities maps phrases and reports leftovers', () => {
  expect(mapAmenities('özel havuz, bahçe, deniz manzaralı')).toEqual({ values: ['MUSTAKIL_HAVUZLU', 'BAHCE'], unmapped: ['deniz manzaralı'] });
});

test('normalizeDraft builds notes from leftover and unmapped, lists missing fields', () => {
  const draft = normalizeDraft({ category: 'KONUT', listingType: 'SATILIK', rooms: '4 veya 5 oda', districts: 'Alaçatı ve Çeşme merkez', features: 'özel havuz, bahçe, deniz manzaralı', excludedFeatures: 'gürültülü', budgetMin: '', budgetMax: '1.2 milyon euro', budgetCurrency: 'EUR', sqmNetMin: '', leftover: 'yazlık ve yatırım amaçlı, Haziran içinde', evidence: '{"budgetMax":"1.2 milyon euroya kadar"}' });
  expect(draft.districts).toBe('Çeşme');
  expect(draft.rooms).toEqual(['R4_1', 'R5_1']);
  expect(draft.budgetMax).toEqual({ amountMicros: 1_200_000_000_000, currencyCode: 'EUR' });
  expect(draft.budgetMin).toBeNull();
  expect(draft.missingFields).toEqual(['budgetMin', 'sqmNetMin']);
  expect(draft.notes).toContain('[otomatik]');
  expect(draft.notes).toContain('Alaçatı');
  expect(draft.evidence.budgetMax).toBe('1.2 milyon euroya kadar');
});

test('parseRawExtraction tolerates missing keys and rejects non-objects', () => {
  expect(parseRawExtraction({ category: 'KONUT' })?.listingType).toBe('');
  expect(parseRawExtraction('x')).toBeNull();
});
```

- [ ] **Step 3: Çalıştır, başarısız olduğunu gör**

Run: `cd apps/emlak-app && npx vitest run --config vitest.unit.config.ts src/intake src/constants/__tests__/izmir-districts.test.ts`
Expected: FAIL (modüller yok)

- [ ] **Step 4: Uygula**

- `izmir-districts.ts`: liste + alias tablosu + `canonicalizeDistrict` (`toLocaleLowerCase('tr-TR')` ve aksan sadeleştirme `ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u` ile karşılaştır).
- `raw-extraction.ts`: tip, anahtar listesi, `parseRawExtraction`.
- `normalize-draft.ts`: `parseAmount` — düzen: sayı (`.`/`,` binlik-ondalık toleranslı) + çarpan (`m|milyon|mio` ×1e6, `bin|k` ×1e3) + para birimi kelimesi/simge (`euro|eur|€`→EUR, `dolar|usd|\$`→USD, `tl|₺|lira`→TRY, yoksa `currencyHint` yoksa TRY); çarpansız ve para birimsiz tek sayı → `null`. `parseRooms` — `(\d)\s*(\+|artı)\s*(\d)` ve sözel sayılar (bir…yedi) → `R<a>_<b>`; "N oda" yalnızca sayı → `R<N>_1`; `7+` → `R7_PLUS`. `mapAmenities` — küçük harf alias tablosu (en az: havuz/özel havuz→MUSTAKIL_HAVUZLU, yüzme havuzu→YUZME_HAVUZU, bahçe→BAHCE, asansör→ASANSOR, otopark→OTOPARK, kapalı otopark→KAPALI_OTOPARK, güvenlik→GUVENLIK_24_SAAT, jeneratör→JENERATOR, sahil/denize yakın→SAHIL, teras→TERAS, dubleks→DUBLEKS, klima→KLIMA, eşyalı/mobilyalı→MOBILYA, spor salonu→SPOR_SALONU, sauna→SAUNA, barbekü→BARBEKU); eşlenemeyen parça `unmapped`. `normalizeCategory`/`normalizeListingType` — kod ise doğrula, değilse alias (konut/daire/villa/ev→KONUT, arsa/tarla→ARSA, işyeri/dükkan/ofis→ISYERI, bina→BINA; satılık→SATILIK, kiralık→KIRALIK, devren satılık/kiralık). `normalizeDraft` — alanları birleştirir; `notes` = `[otomatik] ` + leftover + (`; eşlenemeyen: ...`) ya da null; `missingFields` = null/boş kalan kriter alanları sırayla `['category','listingType','rooms','districts','budgetMin','budgetMax','sqmNetMin']` içinden; `evidence` = JSON.parse başarısızsa `{}`; `amountMicros = Math.round(amount * 1_000_000)`.

- [ ] **Step 5: Çalıştır, geçtiğini gör**

Run: aynı komut
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add apps/emlak-app/src/constants/izmir-districts.ts apps/emlak-app/src/constants/__tests__/izmir-districts.test.ts apps/emlak-app/src/intake
git commit -m "feat(emlak): Turkish amount, room, district and amenity normalization for request intake"
```

---

### Task 3: Kişisel veri maskeleme — `maskPii`

**Files:**
- Create: `apps/emlak-app/src/intake/mask-pii.ts`
- Test: `apps/emlak-app/src/intake/__tests__/mask-pii.test.ts`

**Interfaces:**
- Produces: `type PersonIdentity = { firstName: string | null; lastName: string | null; phones: string[] }`, `type MaskResult = { maskedText: string; phoneCount: number; emailCount: number; nameRedacted: boolean; leak: boolean }`, `maskPii(text: string, person: PersonIdentity): MaskResult`, `containsPii(text: string, person: PersonIdentity): boolean`.

- [ ] **Step 1: Testleri yaz**

```ts
const AHMET: PersonIdentity = { firstName: 'Ahmet', lastName: 'Yılmaz', phones: ['+905324567890'] };

test('masks every Turkish phone format', () => {
  const text = 'Tel +90 532 456 78 90 veya 0532.456.78.90, (0532) 456 7890, 05324567890, sabit 0232 123 45 67';
  const result = maskPii(text, AHMET);
  expect(result.phoneCount).toBe(5);
  expect(result.maskedText).not.toMatch(/\d{3}[\s.]?\d{2}[\s.]?\d{2}/);
  expect(result.maskedText).toContain('[TELEFON_1]');
});

test('does not mask room plans or amounts', () => {
  const result = maskPii('Bornova 3+1, bütçe 4.150.000 TL, 120 m²', AHMET);
  expect(result.phoneCount).toBe(0);
  expect(result.maskedText).toContain('4.150.000');
});

test('masks emails', () => {
  expect(maskPii('mail ahmet@example.com', AHMET).maskedText).toContain('[EPOSTA_1]');
});

test('redacts name case- and diacritic-insensitively, whole words only', () => {
  const result = maskPii('ahmet yilmaz aradı, AHMET Çeşme istiyor, Ahmetler sokağı', AHMET);
  expect(result.maskedText).toBe('[MÜŞTERİ] aradı, [MÜŞTERİ] Çeşme istiyor, Ahmetler sokağı');
  expect(result.nameRedacted).toBe(true);
});

test('reports leak=false when clean and leak stays false for a person without a name', () => {
  expect(maskPii('Çeşme villa 1.2 milyon euro', { firstName: null, lastName: null, phones: [] }).leak).toBe(false);
});

test('containsPii detects remaining phone or name', () => {
  expect(containsPii('[MÜŞTERİ] 0532 456 78 90', AHMET)).toBe(true);
  expect(containsPii('[MÜŞTERİ] Çeşme', AHMET)).toBe(false);
});
```

- [ ] **Step 2: Çalıştır, başarısız olduğunu gör** — `npx vitest run --config vitest.unit.config.ts src/intake/__tests__/mask-pii.test.ts` → FAIL

- [ ] **Step 3: Uygula**

`mask-pii.ts`: telefon regex `/(?:\+90|0090|0)?[\s.-]?\(?(?:5\d{2}|[2-4]\d{2})\)?[\s.-]?\d{3}[\s.-]?\d{2}[\s.-]?\d{2}(?!\d)/g` (bulunan her eşleşme sırayla `[TELEFON_n]`); e-posta `/[\w.+-]+@[\w-]+\.[\w.-]+/g` → `[EPOSTA_n]`; isim: ad, soyad ve "ad soyad" için aksansız-küçük-harf tam-kelime arama (`\b` yerine Unicode harf sınırı: önce/sonra harf olmayan karakter) → `[MÜŞTERİ]` (önce tam ad, sonra tekil parçalar; 2 karakterden kısa parça aranmaz). `leak = containsPii(maskedText, person)`. Tutar/oda koruması: maskeleme yalnızca telefon regex'iyle yapılır; regex 10 haneli telefonu zorunlu kıldığı için "4+1" ve "4.150.000" eşleşmez (test bunu kanıtlar).

- [ ] **Step 4: Çalıştır, geçtiğini gör; typecheck+lint**

- [ ] **Step 5: Commit** — `git commit -m "feat(emlak): mask phones, emails and the person's name before any LLM call"`

---

### Task 4: Çıkarım ajanı + sıfır erişimli rol + kimlik sabitleri

**Files:**
- Create: `apps/emlak-app/src/constants/intake-ids.ts`
- Create: `apps/emlak-app/src/roles/talep-cikarici.role.ts`
- Create: `apps/emlak-app/src/agents/talep-cikarici.agent.ts`
- Create: `apps/emlak-app/src/intake/intake-response-schema.ts`
- Test: `apps/emlak-app/src/intake/__tests__/intake-response-schema.test.ts`

**Interfaces:**
- Produces: `TALEP_CIKARICI_ROLE_UNIVERSAL_IDENTIFIER`, `TALEP_CIKARICI_AGENT_UNIVERSAL_IDENTIFIER`, `TALEP_CIKAR_ROUTE_UNIVERSAL_IDENTIFIER`, `METINDEN_TALEP_CIKAR_COMMAND_UNIVERSAL_IDENTIFIER`, `TALEP_CIKAR_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER` (UUID v4); `INTAKE_RESPONSE_SCHEMA: AgentResponseSchema` (12 string özellik = `RAW_EXTRACTION_KEYS`, `required` hepsi, `additionalProperties: false`); `INTAKE_MODEL_ID = 'deepseek/deepseek-flash'`; `buildIntakePrompt(maskedText: string): string` (kullanıcı mesajı: `Metin:\n"""\n${maskedText}\n"""`).

- [ ] **Step 1: Şema testini yaz**

```ts
test('response schema covers every raw extraction key as a required string', () => {
  expect(Object.keys(INTAKE_RESPONSE_SCHEMA.properties).sort()).toEqual([...RAW_EXTRACTION_KEYS].sort());
  expect(Object.values(INTAKE_RESPONSE_SCHEMA.properties).every((p) => p.type === 'string')).toBe(true);
  expect(INTAKE_RESPONSE_SCHEMA.required?.length).toBe(RAW_EXTRACTION_KEYS.length);
});
```

- [ ] **Step 2: Çalıştır → FAIL; sonra uygula**

- `intake-ids.ts`: 5 UUID (`node -e` ile üret).
- `talep-cikarici.role.ts`: `defineRole` — label `'Talep Çıkarıcı (Erişimsiz)'`, tüm `can*AllObjectRecords` false, `canUpdateAllSettings: false`, `canAccessAllTools: false`, `canBeAssignedToAgents: true`, `canBeAssignedToUsers: false`, `canBeAssignedToApiKeys: false`.
- `intake-response-schema.ts`: her özellik için Türkçe `description` (kapalı sözlükler: `category` "KONUT|ISYERI|ARSA|BINA|DEVREMULK|TURISTIK_TESIS veya boş", `listingType` "SATILIK|KIRALIK|DEVREN_SATILIK|DEVREN_KIRALIK veya boş", `rooms` "virgülle ayrılmış oda planları, ör. '3+1, 4+1'", `districts` "virgülle ayrılmış İzmir ilçe/mahalle adları, metinde geçtiği gibi", `features`/`excludedFeatures` "virgülle ayrılmış kısa Türkçe özellik ifadeleri, metinde geçtiği gibi", `budgetMin`/`budgetMax` "metindeki tutar ifadesi olduğu gibi, ör. '1.2 milyon euro'", `budgetCurrency` "EUR|USD|TRY veya boş", `sqmNetMin` "sayı veya boş", `leftover` "kriter olmayan ama talep için önemli her şey (amaç, zamanlama, öncelik, hariç tutma)", `evidence` "JSON nesnesi metni: alan adı → metinden dayanak parça").
- `talep-cikarici.agent.ts`: `defineAgent` — name `talep-cikarici`, label `'Talep Çıkarıcı'`, icon `IconFileSearch`, `modelId: INTAKE_MODEL_ID`, `responseFormat: { type: 'json', schema: INTAKE_RESPONSE_SCHEMA }`, `roleUniversalIdentifier`. Prompt (sabit, Türkçe): rol = "serbest metinden gayrimenkul alıcı talebi kriterlerini çıkaran bir ayrıştırıcısın"; KESİN KURALLAR: (1) yalnızca metinde açıkça geçeni çıkar, uydurma; (2) geçmiyorsa boş string; (3) kodlu alanlarda yalnızca izin verilen kodlar, emin değilsen boş + ifadeyi `leftover`'a; (4) `[MÜŞTERİ]`, `[TELEFON_n]`, `[EPOSTA_n]` yer tutucularını yok say, kişi bilgisi çıkarma; (5) tutarları metindeki gibi bırak, dönüştürme; (6) yalnızca JSON döndür.

- [ ] **Step 3: Test PASS; typecheck+lint; apply**

Run: `yarn twenty apply` → `✓ Synced Emlak`. Doğrula (psql): `select name, "modelId" from core.agent where name='talep-cikarici'` → 1 satır, `deepseek/deepseek-flash`.

- [ ] **Step 4: Duman testi (ajan JSON döndürüyor mu)**

Scratchpad'de `smoke-flash.mjs` kopyasını `agentUniversalIdentifier = TALEP_CIKARICI...`, prompt = `buildIntakePrompt('[MÜŞTERİ] [TELEFON_1]. İzmir Çeşme\'de villa bakıyor. Bütçesi 1.2 milyon euroya kadar. 4 veya 5 oda, denize yakın, özel havuz ve bahçe. Yazlık ve yatırım amaçlı, Haziran içinde almak istiyor.')` ile çalıştır.
Expected: `success: true`, `result` JSON'unda `listingType: ""` veya `"SATILIK"` (metin satılık demiyor; boş kabul), `budgetMax: "1.2 milyon euro"`, `budgetCurrency: "EUR"`, `districts` Çeşme içerir, `rooms` "4 veya 5" ya da "4+1, 5+1" içerir, `leftover` yazlık/yatırım/Haziran içerir. `result` string ise `JSON.parse` ile nesneye çevrilebilir. Dönüş şeklini (nesne mi string mi) not al; Task 5'te `parseRawExtraction` öncesi buna göre `JSON.parse` uygula.

- [ ] **Step 5: Commit** — `git commit -m "feat(emlak): zero-access extraction agent with flat JSON schema for request intake"`

---

### Task 5: Çekirdek `runIntake`

**Files:**
- Create: `apps/emlak-app/src/intake/run-intake.ts`
- Test: `apps/emlak-app/src/intake/__tests__/run-intake.test.ts`

**Interfaces:**
- Consumes: `maskPii`, `containsPii` (Task 3); `parseRawExtraction`, `normalizeDraft` (Task 2); `buildIntakePrompt`, `INTAKE_MODEL_ID`, `TALEP_CIKARICI_AGENT_UNIVERSAL_IDENTIFIER` (Task 4); `resolveLabel` (app-locale).
- Produces: `type IntakeClient = { query: (payload: Record<string, unknown>) => Promise<unknown>; mutation: (payload: Record<string, unknown>) => Promise<unknown> }`; `type IntakeAgentRunner = (prompt: string) => Promise<{ success: boolean; result?: unknown; error?: string }>`; `type IntakeSource = 'WHATSAPP' | 'TELEFON' | 'YUZ_YUZE' | 'DEFTER' | 'DIGER'`; `type IntakeInput = { personId: string; text: string; source?: IntakeSource }`; `type IntakeResult = { draftId: string; missingFields: string[]; summary: string; outcome: 'ok' | 'extraction-failed' }`; `class IntakeError extends Error { status: 400 | 404 }`; `runIntake(client: IntakeClient, runAgent: IntakeAgentRunner, input: IntakeInput, now: number): Promise<IntakeResult>`; `export const INTAKE_MIN_TEXT_LENGTH = 10`.

- [ ] **Step 1: Testleri yaz** (sahte `client` = `query`/`mutation` çağrılarını kaydeden ve önceden belirlenmiş cevaplar dönen nesne; sahte `runAgent` = sabit JSON dönen fonksiyon)

```ts
test('happy path: masks, extracts, normalizes, creates TASLAK draft and a task with two targets', async () => {
  // query: person → { people: { edges: [{ node: { id, name: {firstName:'Ahmet', lastName:'Yılmaz'}, phones: { primaryPhoneNumber: '5324567890', primaryPhoneCallingCode: '+90', additionalPhones: [] } } }] } }
  // runAgent: success + JSON (Task 4 Step 4 çıktısı şeklinde)
  // mutation 1: createBuyerRequest → { createBuyerRequest: { id: 'draft-1' } }; mutation 2: createTask → { createTask: { id: 'task-1' } }; mutation 3-4: createTaskTarget
  const result = await runIntake(client, runAgent, { personId: 'p1', text: TEXT, source: 'WHATSAPP' }, NOW);
  expect(result).toEqual({ draftId: 'draft-1', missingFields: expect.arrayContaining(['budgetMin']), summary: expect.stringContaining('Çeşme'), outcome: 'ok' });
  const create = mutations[0].createBuyerRequest.__args.data;
  expect(create.status).toBe('TASLAK');
  expect(create.buyerId).toBe('p1');
  expect(create.source).toBe('WHATSAPP');
  expect(create.sourceText).toBe(TEXT);
  expect(create.name).toBe('Ahmet Yılmaz talebi');
  expect(create.extraction.outcome).toBe('ok');
  expect(create.extraction.maskedText).not.toContain('Ahmet');
  expect(create.extraction.maskedText).not.toMatch(/532/);
  expect(runAgentCalls[0]).toContain('[MÜŞTERİ]');
  expect(mutations[1].createTask.__args.data.title).toBe('Taslak talebi onayla: Ahmet Yılmaz');
  expect(mutations[2].createTaskTarget.__args.data).toEqual({ taskId: 'task-1', targetBuyerRequestId: 'draft-1' });
  expect(mutations[3].createTaskTarget.__args.data).toEqual({ taskId: 'task-1', targetPersonId: 'p1' });
});

test('extraction failure after one retry still creates a draft with only sourceText', async () => {
  // runAgent: iki kez { success: false, error: 'boom' }
  const result = await runIntake(client, failingRunAgent, input, NOW);
  expect(runAgentCalls).toHaveLength(2);
  expect(result.outcome).toBe('extraction-failed');
  expect(mutations[0].createBuyerRequest.__args.data.extraction.outcome).toBe('extraction-failed');
  expect(mutations[0].createBuyerRequest.__args.data.category).toBeUndefined();
});

test('invalid JSON from the agent counts as a failure (retry, then extraction-failed)', ...);

test('skips the agent entirely when masking leaks and records "maskeleme eksik"', async () => {
  // kişi adı '' (null) ve metinde 11 haneli olağan dışı numara: '0532 456 78 901' gibi regex'in yakalamadığı bir deseni test etmek yerine
  // containsPii'yi doğrudan tetiklemek için person.phones'a metindeki ham numarayı verip maskPii'nin yakalayamadığı biçim yerine
  // mask-pii'yi vi.mock ile { leak: true } döndürecek şekilde sahtele.
  expect(runAgentCalls).toHaveLength(0);
  expect(mutations[0].createBuyerRequest.__args.data.extraction.unmapped).toContain('maskeleme eksik');
});

test('creates an empty draft for non-request text', async () => {
  // runAgent: tüm alanlar '' JSON
  const result = await runIntake(client, emptyRunAgent, { personId: 'p1', text: 'Teşekkürler, görüşürüz, iyi günler.' }, NOW);
  expect(result.missingFields).toEqual(['category', 'listingType', 'rooms', 'districts', 'budgetMin', 'budgetMax', 'sqmNetMin']);
  expect(result.summary).toContain('kriter bulunamadı');
});

test('rejects short text with 400 and unknown person with 404', async () => {
  await expect(runIntake(client, runAgent, { personId: 'p1', text: 'kısa' }, NOW)).rejects.toMatchObject({ status: 400 });
  await expect(runIntake(clientWithNoPerson, runAgent, input, NOW)).rejects.toMatchObject({ status: 404 });
});

test('works for a person without a name: phones masked, name not redacted, task title uses "Talep"', ...);
```

- [ ] **Step 2: Çalıştır → FAIL; sonra uygula**

`run-intake.ts` akışı: doğrula girdi → `people` sorgusu (`__args: { filter: { id: { eq: personId } }, first: 1 }`, `node: { id, name: { firstName, lastName }, phones: { primaryPhoneNumber, primaryPhoneCallingCode, additionalPhones } }`) → `PersonIdentity` kur (additionalPhones dizisindeki `number` alanları + primary; `'+90'+'5324567890'` ve `'5324567890'` ikisi de listeye) → `maskPii` → `leak` ise ajanı atla → değilse `runAgent(buildIntakePrompt(maskedText))` (başarısız/JSON değil → 1 tekrar) → `parseRawExtraction` → `normalizeDraft` → `createBuyerRequest` (`data`: `name`, `status: 'TASLAK'`, `buyerId`, `source`, `sourceText`, `extraction`, kriter alanları yalnızca null değilse: `category`, `listingType`, `rooms`, `districts`, `features`, `excludedFeatures`, `budgetMin`/`budgetMax` (`{ amountMicros, currencyCode }`), `sqmNetMin`, `notes`) → `createTask` (başlık/gövde `resolveLabel` ile; gövde: `Eksik alanlar: ...` + `Onay: Talepler → Onay Bekleyen Talepler`) → iki `createTaskTarget` → sonuç. `summary`: `"<ilan tipi etiketi> · <ilçeler> · <bütçe üst> · <oda>"` dolu olanlardan; hiçbiri yoksa `'Metinde talep kriteri bulunamadı; taslak yalnızca kaynak metinle açıldı.'`. Hiçbir yerde `console.log(text)` yok.

- [ ] **Step 3: PASS; typecheck+lint; commit** — `git commit -m "feat(emlak): runIntake core: mask, extract, normalize, create draft request and review task"`

---

### Task 6: HTTP rota logic function + canlı doğrulama (taslak eşleşmeye girmez, onayda girer)

**Files:**
- Create: `apps/emlak-app/src/logic-functions/talep-cikar-route.ts`

**Interfaces:**
- Consumes: `runIntake`, `IntakeError`, `IntakeInput` (Task 5); `TALEP_CIKAR_ROUTE_UNIVERSAL_IDENTIFIER`, `TALEP_CIKARICI_AGENT_UNIVERSAL_IDENTIFIER` (Task 4).
- Produces: `POST /s/talep/cikar` → 200 `IntakeResult` JSON; 400/404 `{ error: string }`; 500 `{ error: 'intake failed' }`.

- [ ] **Step 1: Rotayı yaz**

`generate-document-route.ts` kalıbı: `handler = async (event: RoutePayload<Partial<IntakeInput>>): Promise<Response>`; gövdeden `personId`, `text`, `source` al; `runAgent` = `(prompt) => new MetadataApiClient().mutation({ runAgent: { __args: { input: { agentUniversalIdentifier: TALEP_CIKARICI_AGENT_UNIVERSAL_IDENTIFIER, prompt } }, success: true, result: true, error: true } })` sonucunun `.runAgent`'ı; `runIntake(new CoreApiClient(), runAgent, input, Date.now())`; `IntakeError` → `status`, diğer hata → 500 (mesaj loglanır, metin loglanmaz). `defineLogicFunction({ universalIdentifier: TALEP_CIKAR_ROUTE_UNIVERSAL_IDENTIFIER, name: 'talep-cikar-route', description: 'Serbest metinden taslak alıcı talebi çıkarır (kişisel veri maskelenir).', timeoutSeconds: 60, handler, httpRouteTriggerSettings: { path: '/talep/cikar', httpMethod: 'POST', isAuthRequired: true } })`.

- [ ] **Step 2: typecheck+lint; apply** → `✓ Synced Emlak`

- [ ] **Step 3: Canlı doğrulama (curl + psql)**

Token: `/home/user/.re-user-token` (gerekirse `run-cases.mjs`'teki login ile yenile). Bir Kişi id'si seç: `psql -t -c "select id from workspace_1wgvd1injqtife6y4rvfbu3h5.person where \"deletedAt\" is null limit 1"`.
```
curl -s -X POST http://localhost:3000/s/talep/cikar -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"personId":"<id>","text":"Bornova'da 3+1 satılık daire arıyor, bütçe 5 milyon civarı, Erzene veya Kazımdirik olsun, asansörlü. Tel 0532 456 78 90","source":"WHATSAPP"}'
```
Expected: 200 `{ draftId, missingFields: [...], summary: "Satılık · Bornova · 5.000.000 TRY · 3+1", outcome: "ok" }`.
psql: taslak satırı `status='TASLAK'`, `extraction->>'maskedText'` içinde `532` yok ve `[TELEFON_1]` var; `_propertyMatch`'te bu talebe bağlı satır **yok**; `task` tablosunda `Taslak talebi onayla:` başlıklı 1 satır.
Sonra onay: GraphQL `updateBuyerRequest(id, data: { status: 'AKTIF' })` (metadata değil, core `/graphql`) → 30 sn içinde `_propertyMatch` bu talep için satır(lar) oluşur (Bornova 3+1 satılık portföyler var) ve worker logunda `match-request-on-update` görünür.
Kısa metin ve sahte personId ile 400/404 döndüğünü de curl ile gör.

- [ ] **Step 4: Commit** — `git commit -m "feat(emlak): POST /talep/cikar route creating draft requests from free text"`

---

### Task 7: Komut menüsü öğesi + yan panel formu + Playwright uçtan uca

**Files:**
- Create: `apps/emlak-app/src/command-menu-items/metinden-talep-cikar.command-menu-item.ts`
- Create: `apps/emlak-app/src/front-components/talep-cikar-form.front-component.tsx`

**Interfaces:**
- Consumes: `METINDEN_TALEP_CIKAR_COMMAND_UNIVERSAL_IDENTIFIER`, `TALEP_CIKAR_FORM_FRONT_COMPONENT_UNIVERSAL_IDENTIFIER` (Task 4); rota (Task 6); `IntakeResult`/`IntakeSource` tipleri (Task 5, yalnızca tip importu).

- [ ] **Step 1: Komut menüsü öğesi**

`generate-document.command-menu-item.ts` kalıbı: label `'Metinden talep çıkar'`, shortLabel `'Talep çıkar'`, `isPinned: false`, `availabilityType: 'RECORD_SELECTION'`, `availabilityObjectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier`, `frontComponentUniversalIdentifier`.

- [ ] **Step 2: Front component**

`generate-document-form.front-component.tsx` kalıbı (düz HTML öğeleri + satır içi stiller; twenty-ui bağımlılığı yok): `useSelectedRecordIds()` → tam 1 kayıt değilse "Tek bir kişi seçin." mesajı; `<textarea>` (placeholder `'WhatsApp mesajı, görüşme notu ya da transkript metnini yapıştırın'`, min 10 karakter; altında sayaç), `<select>` kaynak (boş/WhatsApp/Telefon/Yüz yüze/Defter/Diğer), `<button>` "Taslak çıkar" (`disabled` = metin kısa || `submitting`), "Vazgeç". Gönderim: `new RestApiClient().post<IntakeResult>('/s/talep/cikar', { personId, text, source })`; 200 → `enqueueSnackbar({ message: \`Taslak talep oluşturuldu (${missing.length} eksik alan). Onay: Talepler → Onay Bekleyen Talepler\`, variant: 'success' })` → `openSidePanelPage({ page: SidePanelPages.ViewRecord, recordId: draftId, objectNameSingular: 'buyerRequest' })` (bu enum `twenty-sdk/front-component`'tan dışa aktarılmıyorsa `unmountFrontComponent(); closeSidePanel();`); hata → `enqueueSnackbar({ variant: 'error' })`, metin korunur. `defineFrontComponent({ universalIdentifier, name: 'talep-cikar-form', description: 'Serbest metinden taslak talep çıkarma formu.', component })`.

- [ ] **Step 3: typecheck+lint; apply** → `✓ Synced Emlak`

- [ ] **Step 4: Playwright uçtan uca (ekran görüntüleri owner'a)**

Scratchpad script (mevcut login kalıbı): Kişiler → bir kişi aç → komut menüsü (⌘K / "..." menüsü) → "Metinden talep çıkar" → metni yapıştır (Task 6'daki örnek, telefon dahil) → "Taslak çıkar" → snackbar ekran görüntüsü → Talepler → "Onay Bekleyen Talepler" görünümü ekran görüntüsü (taslak satırı, kaynak WhatsApp) → taslağı aç, `status` → Aktif → 30 sn sonra Eşleşmeler/görev ekran görüntüsü. Çift tıklama: düğme gönderim sırasında `disabled` olduğundan ikinci istek gitmez (DOM'da `disabled` özniteliğini assert et).
Expected: 3 ekran görüntüsü; psql'de tek taslak.

- [ ] **Step 5: Commit** — `git commit -m "feat(emlak): 'Metinden talep çıkar' command and side panel form on person records"`

---

### Task 8: Eval harness — paylaşılan yardımcılar, senaryolar, kontroller, koşucu, ilk koşu

**Files:**
- Create: `apps/emlak-app/scripts/eval-shared.ts` (run-chat-eval.ts'ten çıkarılan `graphql`, `refreshToken`, `getToken`, `psql`, `countRecords`, `SERVER_URL`, `TOKEN_PATH`, `WORKSPACE_SCHEMA`)
- Modify: `apps/emlak-app/scripts/run-chat-eval.ts` (yardımcıları `eval-shared`'dan import; davranış aynı)
- Create: `apps/emlak-app/evals/talep-cikarimi/scenario.type.ts`, `scenarios.ts`, `check-draft.ts`, `__tests__/check-draft.test.ts`
- Create: `apps/emlak-app/scripts/run-intake-eval.ts`
- Modify: `apps/emlak-app/package.json` (`"eval:intake": "tsx scripts/run-intake-eval.ts"`), `vitest.unit.config.ts` (include zaten `evals/**/*.test.ts`)

**Interfaces:**
- `type IntakeScenario = { id: string; style: 'whatsapp' | 'stt' | 'defter'; text: string; source: IntakeSource; expected: Partial<{ category: string | null; listingType: string | null; rooms: string[]; districts: string | null; budgetMax: Money | null; budgetMin: Money | null; sqmNetMin: number | null }>; mustBeNull: string[]; gecmeTanimi: string }`
- `checkDraft(scenario: IntakeScenario, draft: DraftRecord): string[]` (`DraftRecord` = GraphQL'den okunan taslak: kriter alanları + `extraction`); kontroller: `expected` alan eşitliği; `mustBeNull` alanları null; `extraction.maskedText` için `containsPii(maskedText, EVAL_PERSON)` false ve `/\d{3}[\s.]?\d{2}[\s.]?\d{2}/` eşleşmez; `extraction.outcome === 'ok'`.
- Koşucu: eval kişisi `Eval Müşteri` (telefon `5550000001`) idempotent (telefonla bul/yoksa oluştur); her senaryo → `POST /s/talep/cikar` (kullanıcı token'ı) → taslağı `buyerRequest(id)` sorgusuyla oku → `checkDraft` → rapor; koşu sonunda yazma denetimi: `_buyerRequest`, `task`, `taskTarget` dışında sayım/updatedAt değişmemiş (`person` yeni eval kişisi hariç); oluşturulan taslaklar ve görevler koşu sonunda `deleteBuyerRequest`/`deleteTask` ile temizlenir; rapor `evals/talep-cikarimi/results/<YYYY-MM-DDTHHmm>-<label>.md` (başlık: model, senaryo sayısı; her senaryo: üslup, metin, beklenen, bulunan, otomatik kontroller, insan değerlendirmesi boşluğu; özet: uyarılı senaryo sayısı, yazma denetimi).

- [ ] **Step 1: check-draft testini yaz** (3 test: alan eşitliği geçer/kalır; mustBeNull ihlali; maskedText'te kalan telefon ihlali)

- [ ] **Step 2: Senaryoları yaz (15)** — her biri uydurma kişi `Ahmet Yılmaz` / telefon `0532 456 78 90` içerebilir (maskeleme kanıtı için en az 8'inde geçer):
  1. `W1` whatsapp: "slm bornovada 3+1 satılık daire bakıyorum 5m civarı olur mu 🙏" → KONUT, SATILIK, R3_1, Bornova, budgetMax 5.000.000 TRY.
  2. `W2` whatsapp: "karşıyaka bostanlı kiralık 2+1 eşyalı 30-35 bin" → KIRALIK, R2_1, Karşıyaka, budgetMin 30.000 / budgetMax 35.000 TRY, features MOBILYA.
  3. `W3` whatsapp: owner örneği (Çeşme villa 1,2M EUR, 4-5 oda, havuz, bahçe, Alaçatı) → KONUT, listingType null (metin söylemiyor) **ya da** SATILIK ("satın almak" geçtiği için); geçme tanımı: SATILIK kabul, null kabul; R4_1+R5_1; Çeşme; budgetMax 1.200.000 EUR; MUSTAKIL_HAVUZLU+BAHCE.
  4. `W4` whatsapp: yalnızca ilçe "urla tarafında bişeyler var mı" → districts Urla, diğerleri null; mustBeNull budgetMax.
  5. `W5` whatsapp: arsa "seferihisar'da imarlı arsa 2 milyona kadar" → ARSA, SATILIK, Seferihisar, budgetMax 2.000.000.
  6. `S1` stt: "şey hani müşteri bornova'da üç artı bir istiyor dedi satılık, bütçe beş milyon falan, asansör olsun dedi" → KONUT, SATILIK, R3_1, Bornova, 5.000.000, ASANSOR.
  7. `S2` stt: "ımm çeşme ya da urla, yazlık, bütçe yüz yirmi bin dolar, deniz manzaralı olsun" → Çeşme, Urla; budgetMax 120.000 USD; leftover yazlık/deniz manzaralı (mustBeNull rooms).
  8. `S3` stt (ASR hatası): "buca da 2+1 kiralık, 20 binden fazla vermem dedi" → KIRALIK, R2_1, Buca, budgetMax 20.000 TRY.
  9. `S4` stt: talep olmayan "evet tamam görüşürüz teşekkürler iyi günler" → tüm kriterler null, outcome ok.
  10. `D1` defter: "Brnv 3+1 satlk 5M Erzene/Kazımdirik asansörlü" → Bornova, R3_1, SATILIK, 5.000.000.
  11. `D2` defter: "Gümüldür yazlık kiralık 55k yaz sezonu" → Menderes, KIRALIK, budgetMax 55.000.
  12. `D3` defter: "Konak ofis 120m2+ satılık 8-10M" → ISYERI, SATILIK, Konak, sqmNetMin 120, budgetMin 8.000.000, budgetMax 10.000.000.
  13. `D4` defter: "Mordoğan deniz kenarı arsa, kira olmasın" → ARSA, Karaburun, listingType SATILIK kabul/null kabul.
  14. `W6` whatsapp (karışık): "ahmet yılmaz: bayraklı veya bornova, 4+1, 7 milyona kadar, otopark şart, zemin kat istemiyor" → Bayraklı, Bornova; R4_1; 7.000.000; OTOPARK; excludedFeatures leftover "zemin kat".
  15. `W7` whatsapp (EUR+ilçe yok): "bütçem 300 bin euro, yatırımlık daire, yer fark etmez" → KONUT, budgetMax 300.000 EUR, districts null.

- [ ] **Step 3: check-draft test PASS; eval-shared çıkarımı sonrası `yarn eval:chat` hâlâ çalışıyor** (koşmadan: `npx tsc`/`yarn typecheck` + `node -e` ile import denemesi yeter; chat eval'i yeniden KOŞMA, maliyet).

- [ ] **Step 4: Koşucuyu yaz; `yarn typecheck && yarn lint`; sonra bir kez koş**

Run: `cd apps/emlak-app && PATH=/opt/node24/bin:$PATH yarn eval:intake deepseek-flash`
Expected: 15 senaryo, rapor dosyası; otomatik uyarı ≤3 (≥%80); maskedText PII ihlali 0; yazma denetimi temiz. Uyarılı senaryoları raporda insan kararıyla işaretle (gerçek hata ↔ beklenti hatası); beklenti hatası ise senaryoyu düzelt, model hatası ise prompt'u düzelt ve **yalnızca o senaryoları** yeniden koşmak için koşucuya `--only W3,S2` seçeneği ekle (tam koşu tekrarı yok).

- [ ] **Step 5: Commit** — `git commit -m "test(emlak): intake extraction eval harness with PII assertions; first deepseek-flash run"`

---

### Task 9: Dokümantasyon ve kapanış

**Files:**
- Modify: `docs/HANDOFF.md` ("What is already done" altına özellik notu + ops notu)

- [ ] **Step 1: HANDOFF notu** — ne yapıldı (yüzey, maskeleme, TASLAK kapısı), nasıl test edilir (`yarn eval:intake`, Playwright), bilinen sınırlar (sohbet adaptörü yok, kişi oluşturma yok), KVKK gerekçesi (DeepSeek'e PII gitmez), rota adı.
- [ ] **Step 2: `yarn typecheck && yarn test:unit && yarn lint` tümü yeşil; `git status` temiz.**
- [ ] **Step 3: Commit + push** — `git commit -m "docs(emlak): intake feature notes" && git push -u origin local-dev`

---

## Self-review (plan yazarı)

- Spec kapsamı: 1 (veri modeli) → Task 1; 2 (çekirdek + rota + hata yolu) → Task 5-6; 3 (ajan + rol) → Task 4; 4 (maskeleme + iddia) → Task 3 + Task 5 leak testi; 5 (normalizasyon) → Task 2; 6 (yüzey) → Task 7; 7 (onay akışı) → Task 6 canlı doğrulama + Task 7 e2e; 8 (eval) → Task 8; 9 (testler) → her task; 10 (izinler) → Task 6 canlı doğrulama (create başarılıysa izin var; 403 ise `default-role.ts` zaten `canUpdateAllObjectRecords: true` — oluşturma bu bayrağa bağlı; hata görülürse `asistan-okur` gibi ayrı bayrak araştır). Kapsam dışı maddeler plana girmedi.
- Tip tutarlılığı: `IntakeSource`, `IntakeInput`, `IntakeResult`, `Money`, `NormalizedDraft`, `RawExtraction`, `PersonIdentity` adları Task 2-8 boyunca aynı.
- Review Focus 5 maddesinin her biri bir task testine bağlı.
