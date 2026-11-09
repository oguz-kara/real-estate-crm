# Sahibinden-grade property schema, import and search

Design spec for extending the Emlak app (`apps/emlak-app`) so the `property` object
covers the full sahibinden.com real-estate schema, records can be imported from a
sahibinden export file, and the same filter surface serves the Twenty UI,
programmatic callers and an AI tool.

Approved in conversation on 2026-10-06 (approach + 4 design sections). Platform
constraints referenced here come from `docs/PLATFORM-NOTES.md`.

## Goals

- One `property` object whose fields cover all sahibinden real-estate categories:
  Konut, İşyeri, Arsa, Bina, Devremülk, Turistik Tesis.
- Every attribute a consultant would filter on is a first-class Twenty field, so
  the native list-view Filter menu works without custom UI.
- Idempotent import from the owner's sahibinden export (JSON, root key
  `"İlan Listesi"`), with a calibration report instead of silent data loss.
- One filter representation shared by the UI, programmatic callers and an AI tool
  (`search_properties`), exposed in AI chat and MCP.

## Non-goals (v2 or later)

- Location reference data as relations (il/ilçe/mahalle objects). V1 uses text
  fields filled by the import; upgrading later stays possible.
- Uploading actual image/video files. V1 stores file names only.
- Manual-entry UX polish (conditional layouts that hide irrelevant category
  fields). V1 groups fields in the record layout; hiding is v2.
- Making the tool available to workflow AI Agent steps or `runAgent` (platform
  loads no app tools there; needs a fork per PLATFORM-NOTES section 7).
- A custom search screen. The Twenty list view is the v1 search surface.

## 1. Data model

Single `property` object (existing universal identifier kept). Fields in three
layers. All SELECT/MULTI_SELECT options carry sahibinden's raw Turkish labels so
import maps 1:1 and no information is collapsed.

Option lists below are the initial sets; the import calibration report
(section 2) is the mechanism that completes them against the real export.

### 1.1 Core fields

| Field | Type | Source / notes |
|---|---|---|
| `name` | TEXT (label field) | export `Başlık` |
| `externalId` | TEXT, unique index | export `İlan no`; upsert key |
| `externalSource` | SELECT: `SAHIBINDEN`, `MANUAL` | fixed `SAHIBINDEN` on import |
| `category` | SELECT: Konut, İşyeri, Arsa, Bina, Devremülk, Turistik Tesis | from `Kategoriler` |
| `subType` | SELECT (~25): Daire, Rezidans, Müstakil Ev, Villa, Yazlık, Çiftlik Evi, Köşk, Yalı, Dükkan/Mağaza, Ofis, Büro, Depo, Fabrika, Atölye, Plaza, Bina, İş Hanı, Tarla, Bağ-Bahçe, İmarlı Arsa, Otel, Apart, Butik Otel, Devremülk, Diğer | from `Kategoriler`; sub-type is preserved, never collapsed |
| `listingType` | SELECT: Satılık, Kiralık, Devren Satılık, Devren Kiralık | from `Kategoriler` |
| `status` | SELECT: Aktif (default), Opsiyonlu, Satıldı, Kiralandı, Pasif | internal process field, not in export |
| `price` | CURRENCY (TRY) | `"28.500 TL"` → amountMicros (bigint; no INT4 cap) |
| `city` / `district` / `neighborhood` | TEXT ×3 | `Adres` split on `/` |
| `latitude` / `longitude` | NUMBER float | `Konum` split on `,` |
| `sqmGross` / `sqmNet` | NUMBER int | `m² (Brüt)` / `m² (Net)` |
| `description` | TEXT, `isSearchable: true` | export `Açıklama`; feeds global search |
| `owner` | RELATION → Person (exists from v1) | not in export; set manually |
| `imageFiles` / `videoFiles` | ARRAY ×2 | file names from `Aktif Görsel Listesi` / `Video Listesi` |
| `importNotes` | RAW_JSON | unmapped keys/values from import; bookkeeping only, never filtered on |

### 1.2 Category-specific structural fields

Konut (apartments, houses):

| Field | Type | Notes |
|---|---|---|
| `rooms` | SELECT: 1+0, 1+1, 2+1, 2+2, 3+1, 3+2, 4+1, 4+2, 5+1, 5+2, 6+1, 6+2, 7+ ve üzeri | raw sahibinden values |
| `buildingAge` | SELECT: 0, 1, 2, 3, 4, 5, 6-10 arası, 11-15 arası, 16-20 arası, 21-25 arası, 26-30 arası, 31 ve üzeri | raw ranges preserved (no midpoint conversion) |
| `floorLocation` | SELECT: Bodrum Kat, Zemin Kat, Bahçe Katı, Giriş Katı, Yüksek Giriş, Çatı Katı, 1..20, 21 ve üzeri | sahibinden's mixed named/numbered floors |
| `totalFloors` | NUMBER int | `Kat Sayısı` |
| `heating` | SELECT: Yok, Soba, Doğalgaz Sobası, Kat Kaloriferi, Merkezi, Merkezi (Pay Ölçer), Kombi (Doğalgaz), Kombi (Elektrik), Yerden Isıtma, Klima, Fancoil Ünitesi, Güneş Enerjisi, Elektrikli Radyatör, Jeotermal, Şömine, VRV, Isı Pompası | |
| `bathroomCount` | NUMBER int | |
| `balcony` | BOOLEAN | "Var"/"Yok" |
| `furnished` | BOOLEAN | |
| `dues` | CURRENCY | Aidat |
| `creditEligible` | SELECT: Uygun, Uygun Değil, Bilinmiyor | |
| `deedStatus` | SELECT: Kat Mülkiyetli, Kat İrtifaklı, Hisseli Tapu, Müstakil Tapulu, Arsa Tapulu, Bilinmiyor | |
| `fromWho` | SELECT: Sahibinden, Emlak Ofisinden, İnşaat Firmasından, Bankadan | export `Kimden` |
| `exchangeable` | BOOLEAN | Takas |
| `inSite` | BOOLEAN + `siteName` TEXT | Site İçerisinde / Site Adı |
| `usageStatus` | SELECT: Boş, Kiracılı, Mülk Sahibi | Kullanım Durumu |

İşyeri adds: `transferFee` CURRENCY (devren bedeli). Other işyeri attributes
reuse the konut pool (heating, floors, age, dues...).

Arsa adds:

| Field | Type |
|---|---|
| `zoningStatus` | SELECT: İmarlı, İmarsız, Arsa, Tarla, Bağ-Bahçe, Konut İmarlı, Ticari İmarlı, Sanayi İmarlı, Turizm İmarlı, Diğer |
| `blockNo` / `parcelNo` | TEXT (ada / parsel) |
| `kaks` / `gabari` | TEXT |
| `pricePerSqm` | CURRENCY |

### 1.3 Amenities: 6 MULTI_SELECT fields

The 100+ keys under export `Özellikler` (value `"Evet"` when present) map into
sahibinden's own groups. A key marked "Evet" adds that option to the field.

| Field | Group | Example options (initial set) |
|---|---|---|
| `interiorFeatures` | İç Özellikler | Klima, Beyaz Eşya, Ankastre Fırın, Ebeveyn Banyosu, Giyinme Odası, Gömme Dolap, Hilton Banyo, Laminat Zemin, Parke Zemin, Şömine, Çelik Kapı, Duşakabin, Küvet, Panjur, Wi-Fi |
| `exteriorFeatures` | Dış Özellikler | Asansör, Otopark, Kapalı Otopark, Yüzme Havuzu (Açık), Yüzme Havuzu (Kapalı), Spor Salonu, Sauna, Bahçe, Çocuk Oyun Parkı, 24 Saat Güvenlik, Kamera Sistemi, Jeneratör, Kapıcı, Tenis Kortu, Isı Yalıtımı |
| `neighborhoodFeatures` | Muhit | Alışveriş Merkezi, Belediye, Cami, Eczane, Hastane, İlkokul-Ortaokul, Lise, Market, Park, Polis Merkezi, Sahil, Semt Pazarı, Spor Salonu, Üniversite |
| `transportFeatures` | Ulaşım | Anayol, Avrasya Tüneli, Boğaz Köprüleri, Cadde, Deniz Otobüsü, Dolmuş, E-5, Havaalanı, İskele, Metro, Metrobüs, Minibüs, Otobüs Durağı, Sahil, TEM, Tramvay, Tren İstasyonu |
| `view` | Manzara | Boğaz, Deniz, Doğa, Göl, Havuz, Park & Yeşil Alan, Şehir |
| `infrastructure` | Altyapı (arsa) | Elektrik, Sanayi Elektriği, Su, Telefon, Doğalgaz, Kanalizasyon, Arıtma, Sondaj & Kuyu, Yolu Açılmış, Yolu Açılmamış |

Totals: ~45 typed fields + 6 multi-selects. Record layout groups them
(Çekirdek / Konut / İşyeri / Arsa / Özellikler) so irrelevant groups read as
empty rather than cluttering.

### 1.4 Migration from v1

The workspace holds one test record; restructuring is free now and the reason
this redesign happens before real data arrives.

- `propertyType` → replaced by `category` + `subType` (new fields, old one removed).
- `propertyAddress` (ADDRESS composite) → removed; replaced by `city`/`district`/
  `neighborhood` TEXT + `latitude`/`longitude`.
- `areaNet`/`areaGross` → renamed `sqmNet`/`sqmGross` (new universal identifiers;
  old fields removed).
- `listingType`, `status`, `price`, `rooms` (now SELECT), `description`, `owner`
  stay, with `rooms` changing TEXT → SELECT.
- The v1 test record is deleted before apply; the import recreates real data.

## 2. Import pipeline

Standalone CLI script: `apps/emlak-app/scripts/import-sahibinden.ts`, run as
`yarn import:sahibinden <file> [--dry-run]`. Talks to the server over REST with
an API key. Not a logic function in v1 (file size/timeout, local debuggability);
the normalize core is pure and can be wrapped as an app tool later.

Four pure stages, each unit-testable:

1. **Parse**: read file, extract the `İlan Listesi` array. (If the real file
   turns out CSV/XLSX, a converter pre-step produces the same array; core
   unchanged.)
2. **Normalize** (pure, no I/O): one function per concern —
   - price: strip non-digits, × 1e6 → `amountMicros`, currency fixed TRY
   - address: split on `/`, trim; parts assign left-to-right (1 part → city
     only, 2 parts → city + district, neighborhood stays null)
   - coordinates: split on `,`, parseFloat
   - categories: mapping table → `category`, `subType`, `listingType`
     (sub-type preserved)
   - Özellikler: structural keys → typed fields via per-field mapping tables
     (raw labels matched exactly); `"Evet"` keys → the owning multi-select
   - booleans: single helper for "Var"/"Yok", "Evet", "true"/"false", null
   - floor: explicit NaN check so `0` survives (regression-tested; the old
     script's `parseInt(...) || null` bug)
3. **Validate**: require `externalId`, `name`, `category`. An invalid record
   goes to the error report; it never aborts the run.
4. **Upsert**: by `externalId` (unique index enforces). Existing record →
   update; new → create. Re-import is idempotent.

**Calibration report** — the no-silent-loss rule: every run writes
`import-report-<timestamp>.json` with created/updated/skipped counts, per-record
errors, and every unmapped Özellikler key or SELECT value that had no option.
Unmapped values also land in that record's `importNotes`. Workflow: first run is
always `--dry-run` → add missing options to the manifest → re-sync → repeat
until the report is clean → real import.

## 3. Search

**Single translation point**: `buildPropertyFilter(params)` (pure, in
`apps/emlak-app/src/search/`) produces the Twenty GraphQL filter object. All
three consumers go through the same fields, so results never diverge.

1. **UI**: the Twenty list view filters first-class fields natively. The
   manifest ships default views via `defineView`: "Satılık Konut",
   "Kiralık Konut", "Arsalar", "Aktif Portföy" — preset filters + sensible
   columns.
2. **Programmatic**: call Twenty GraphQL/REST directly, or import
   `buildPropertyFilter` (scripts and tests use it).
3. **AI**: `search_properties` logic function with `toolTriggerSettings`,
   visible in AI chat and MCP. Structured params, not raw GraphQL from the
   model:

```ts
{ category?, subTypes?: string[], listingType?, status?,
  districts?: string[], neighborhoodContains?: string,
  priceMin?, priceMax?, sqmNetMin?, sqmNetMax?,
  rooms?: string[], buildingAges?: string[], heatings?: string[],
  features?: string[], featuresMode?: 'any' | 'all',
  sortBy?: 'price' | 'createdAt' | 'sqmNet', sortDirection?, limit? }
```

Returns a compact list (id, name, price, district, rooms, sqmNet, status).

**Platform constraints acknowledged** (PLATFORM-NOTES): app tools load in AI
chat and MCP only — not workflow agent steps or `runAgent` (fork territory,
out of scope). The chat tool catalog is not role-filtered; data access still
follows the caller. AI chat needs an LLM key on the server; the tool itself is
testable key-less over MCP.

## 4. Testing

- **Unit (vitest, already scaffolded)**: table-driven tests per normalize
  function with real export values — price, address split, category mapping,
  boolean helper, floor-0 regression, buildingAge raw-range preservation,
  amenity mapping, unmapped-key reporting. Plus `buildPropertyFilter` param
  combinations → expected filter objects.
- **End-to-end (local workspace)**: dry-run on a sample file → report asserted;
  real import → REST count + spot filter queries (district eq, price range,
  multi-select contains) return the expected records; `search_properties`
  called over MCP (no LLM key needed) matches the equivalent REST query.
- **UI**: screenshot of the Portföyler view with imported data and one filter
  applied.

## 5. Rollout

1. Manifest v2 (fields, index, views) → `twenty plan` → delete the v1 test
   record → `apply` to the local workspace.
2. Unit tests green.
3. Calibration loop with the owner's real export file (uploaded at this step).
4. Real import → verification queries → screenshot.
5. Commit, push, update `docs/HANDOFF.md`.

## Addendum (2026-10-06): locale-ready labels

Approved in conversation after the initial implementation. Metadata labels
(object, field, option, view names) are workspace-wide strings in Twenty, so
the app resolves them once per sync: every label is a `LocalizedText`
(`string` = Turkish-only, or `{ tr, en? }`), resolved by
`src/constants/app-locale.ts` from `TWENTY_APP_LOCALE` (default `tr`). The
sahibinden import lookups always key off the fixed Turkish label (`trLabel`),
so switching the UI locale cannot break the import. Planned use: the office
workspace syncs with `tr`, a demo workspace for the Upwork portfolio syncs
with `TWENTY_APP_LOCALE=en` and holds synthetic İzmir data with English
labels. English option translations are added incrementally later; a missing
`en` falls back to `tr`.

## Open questions deferred to v2

- Location as relations with il/ilçe/mahalle reference records (if text filters
  prove annoying in daily use).
- Image/video file ingestion into Twenty attachments.
- Conditional record layouts per category.
- Wrapping the importer as an in-app tool (file upload + logic function).
