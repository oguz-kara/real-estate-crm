# Sahibinden Property Schema, Import and Search — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the Emlak app so `property` covers the full sahibinden schema, a CLI imports the owner's sahibinden export idempotently, and one filter layer serves the Twenty UI, programmatic callers and an AI tool.

**Architecture:** Everything lives in `apps/emlak-app` (Twenty SDK app; core code untouched). SELECT/MULTI_SELECT option sets are defined once in a constants module consumed by both the object manifest and the import mapper, so schema and importer cannot drift. Import is a thin CLI over pure, unit-tested normalize functions; search is a pure `buildPropertyFilter` consumed by the `search_properties` logic-function tool.

**Tech Stack:** twenty-sdk 2.44.0, TypeScript, vitest (already scaffolded), Twenty REST/GraphQL on `http://localhost:3000`.

**Spec:** `docs/superpowers/specs/2026-10-06-sahibinden-property-schema-design.md`

## Global Constraints

- Yarn 4 only; run app commands from `apps/emlak-app`; Node 24 on PATH (`export PATH=/opt/node24/bin:$PATH`).
- SDK pinned to 2.44.0 (matches server); do not bump.
- Repo house rules apply (root `CLAUDE.md`): types over interfaces, named exports, no `any`, SCREAMING_SNAKE_CASE constants, no AI attribution in commits, git author `oguz-kara <dev.hasan.kara@gmail.com>`.
- Field API names English, labels Turkish; SELECT/MULTI_SELECT option **values** are English SCREAMING_SNAKE, option **labels** are sahibinden's raw Turkish strings (spec §1).
- Every field keeps a stable `universalIdentifier` (UUID v4, generated once, never changed after an apply).
- Server must be running for apply/e2e steps: `cd /home/user/real-estate-crm && PATH=/opt/node24/bin:$PATH yarn start` (background), wait for `curl -fsS localhost:3000/healthz`.
- CLI auth: API key in `/home/user/.re-api-key` (Admin, expires 2026-11-06); remote `cloud-local` already registered.

## Review Focus

Failure modes the spec implies but its sections don't test; each line's test is added to the owning task below.

1. Price missing/empty/non-numeric (`""`, `"TL"`, null) → record imports with `price: null` plus an issue; never 0, never a crash. (Task 3)
2. Duplicate `İlan no` inside one export file → first occurrence wins, later ones reported as issues, not double-upserted. (Task 4)
3. Özellikler value that is neither `"Evet"` nor null (e.g. `"Hayır"`, `""`) → not added to any multi-select; non-empty unexpected values land in issues. (Task 3)
4. Address with more than 3 `/` parts → first two become city/district, the rest join (`" / "`) into neighborhood; fewer parts assign left-to-right. (Task 3)
5. `buildPropertyFilter({})` → valid filter (no crash, no empty-object operators); tool call with no params returns newest records up to default limit 20. (Task 5)

---

### Task 1: Option sets and field-id constants

Single source of truth consumed by the object manifest (Task 2) and the import mapper (Task 3).

**Files:**
- Create: `apps/emlak-app/src/constants/property-field-ids.ts`
- Create: `apps/emlak-app/src/constants/property-options.ts`
- Test: `apps/emlak-app/src/constants/__tests__/property-options.test.ts`

**Interfaces:**
- Produces: `PROPERTY_UNIVERSAL_IDENTIFIER` (keep the existing value `be5c8200-281d-4889-8794-3f0cb232b5c0`); `PROPERTY_FIELD_IDS: Record<PropertyFieldName, string>` — one UUID per field in spec §1.1–1.3 (generate fresh UUIDs; reuse v1 ids only for `status`, `listingType`, `price`, `description`, whose types are unchanged. `rooms` changes TEXT → SELECT: give it a NEW id and drop the old field — a type change on an existing id may be rejected by the sync).
- Produces: `type SelectOption = { value: string; label: string; position: number; color: string }`; `PROPERTY_SELECT_OPTIONS: Record<string, readonly SelectOption[]>` keyed by field name (`category`, `subType`, `listingType`, `status`, `externalSource`, `rooms`, `buildingAge`, `floorLocation`, `heating`, `creditEligible`, `deedStatus`, `fromWho`, `usageStatus`, `zoningStatus`) and `PROPERTY_MULTI_SELECT_OPTIONS` keyed by the 6 amenity fields — values/labels exactly as spec §1.1–1.3 lists them.
- Produces: `SAHIBINDEN_LABEL_TO_VALUE: Record<string, Record<string, string>>` — per field, raw Turkish label → option value (derived from the option sets, built by a helper, not hand-copied).

- [ ] **Step 1: Write failing tests** — `property-options.test.ts`:
  - `test('every option list has unique values and contiguous positions')`
  - `test('label lookup resolves raw sahibinden labels', () => expect(SAHIBINDEN_LABEL_TO_VALUE.heating['Kombi (Doğalgaz)']).toBe('KOMBI_DOGALGAZ'))`
  - `test('field ids are unique valid uuids')`
- [ ] **Step 2: Run** `yarn vitest run src/constants` — expect FAIL (modules missing).
- [ ] **Step 3: Implement both constants modules** (option data copied from spec §1; UUIDs via `python3 -c "import uuid; print(uuid.uuid4())"`).
- [ ] **Step 4: Run** `yarn vitest run src/constants` — expect PASS.
- [ ] **Step 5: Commit** `feat(emlak): property option sets and field ids`

### Task 2: Schema v2 manifest and sync

**Files:**
- Modify: `apps/emlak-app/src/objects/property.object.ts` (full rewrite to spec §1)
- Modify: `apps/emlak-app/src/fields/owner-on-property.field.ts` (only if imports move; relation ids unchanged)
- Create: `apps/emlak-app/src/indexes/property-external-id.index.ts` (`defineIndex`, unique, on `externalId` — follow `twenty-sdk/define` `defineIndex` signature)
- Create: `apps/emlak-app/src/views/` — `satilik-konut.view.ts`, `kiralik-konut.view.ts`, `arsalar.view.ts`, `aktif-portfoy.view.ts` (`defineView` with filters per name + columns: name, price, district, rooms, sqmNet, status)

**Interfaces:**
- Consumes: Task 1 constants (fields built by mapping over option sets).
- Produces: the live workspace schema every later task queries; REST plural name stays `properties`.

- [ ] **Step 1: Rewrite the object manifest** — fields from spec §1.1–1.3, each `{ universalIdentifier: PROPERTY_FIELD_IDS[name], options: PROPERTY_SELECT_OPTIONS[name] ... }`; `status` default `"'ACTIVE'"`; `description` `isSearchable: true`; `price`/`dues`/`transferFee`/`pricePerSqm` CURRENCY default `{ amountMicros: null, currencyCode: "'TRY'" }`. Remove v1 fields `propertyType`, `propertyAddress`, `areaNet`, `areaGross`.
- [ ] **Step 2: Add index and views.**
- [ ] **Step 3: Validate:** `yarn twenty plan` — expect adds/changes, **zero errors**; fix reserved-name or option errors until clean.
- [ ] **Step 4: Delete the v1 test record** (`curl -X DELETE http://localhost:3000/rest/properties/5c01c911-01a0-48d6-9bdc-678455f79390 -H "authorization: Bearer $(cat /home/user/.re-api-key)"`).
- [ ] **Step 5: Apply:** `yarn twenty apply` — expect `✓ Synced Emlak`.
- [ ] **Step 6: Verify:** `psql -h localhost -U postgres -d default` → `_property` columns include `externalId`, `city`, `heating`, `interiorFeatures`; unique index on `externalId` exists; REST `POST /rest/properties` with `externalId` twice → second returns duplicate-key error.
- [ ] **Step 7: Commit** `feat(emlak): sahibinden-grade property schema, index and default views`

### Task 3: Normalize module (pure)

**Files:**
- Create: `apps/emlak-app/src/import/raw-listing.type.ts` (`type RawListing` — export shape from spec: `'İlan no'`, `'Başlık'`, `'Açıklama'`, `'Kategoriler'`, `'Fiyat'`, `'Adres'`, `'Konum'`, `'Özellikler'`, `'Aktif Görsel Listesi'`, `'Video Listesi'`)
- Create: `apps/emlak-app/src/import/normalize-listing.ts` and one file per helper: `parse-price.ts`, `parse-address.ts`, `parse-coordinates.ts`, `map-categories.ts`, `parse-boolean.ts`, `parse-floor.ts`, `map-features.ts`
- Test: `apps/emlak-app/src/import/__tests__/` — one test file per helper + `normalize-listing.test.ts`

**Interfaces:**
- Consumes: Task 1 `SAHIBINDEN_LABEL_TO_VALUE`, option sets.
- Produces:
  - `type ImportIssue = { externalId: string | null; field: string; raw: string; reason: 'UNMAPPED_KEY' | 'UNMAPPED_VALUE' | 'INVALID' | 'DUPLICATE' }`
  - `normalizeListing(raw: RawListing): { record: Record<string, unknown>; issues: ImportIssue[] }` — record keys are property field names ready for REST create/update; unmapped data also summarized into `record.importNotes`.
  - Helpers: `parsePrice(raw: string | null): number | null` (amountMicros), `parseAddress(raw: string | null): { city: string | null; district: string | null; neighborhood: string | null }`, `parseCoordinates(raw: string | null): { latitude: number | null; longitude: number | null }`, `mapCategories(raw: string | null): { category: string | null; subType: string | null; listingType: string | null }`, `parseBoolean(raw: string | null): boolean | null`, `parseFloor(raw: string | null): number | null`, `mapFeatures(ozellikler: Record<string, string | null>): { fields: Record<string, unknown>; issues: ImportIssue[] }`.

- [ ] **Step 1: Write failing tests**, table-driven, spec values pinned:
  - price: `'28.500 TL'→28_500_000_000`, `'1.250.000 TL'→1_250_000_000_000`, `''→null`, `'TL'→null`, `null→null` (Review Focus 1)
  - address: `'İzmir / Bornova / Erzene Mah.'→{İzmir,Bornova,Erzene Mah.}`, `'İzmir / Bornova'→{İzmir,Bornova,null}`, `'İzmir'→{İzmir,null,null}`, 4 parts → rest joined into neighborhood (Review Focus 4)
  - coordinates: `'38.468, 27.224'→{38.468,27.224}`, `'-'→{null,null}`, `''→{null,null}`
  - categories: `'Emlak, Konut, Kiralık, Daire'→{KONUT,DAIRE,KIRALIK}`, `'Emlak, Arsa, Satılık, İmarlı Arsa'→{ARSA,IMARLI_ARSA,SATILIK}`, unknown token → nulls + issue
  - boolean: `'Var'→true`, `'Yok'→false`, `'Evet'→true`, `'true'→true`, `'false'→false`, `null→null`
  - floor: `'0'→0` (regression, Review Focus from old script), `'3'→3`, `'Bahçe Katı'→null`
  - features: `{'Asansör':'Evet'}` → `exteriorFeatures` contains `ASANSOR`; `{'Bilinmeyen Anahtar':'Evet'}` → issue `UNMAPPED_KEY`; `{'Asansör':'Hayır'}` → not added + issue `UNMAPPED_VALUE` (Review Focus 3)
  - normalizeListing: a full sample listing → complete record; `buildingAge: '6-10 arası'` stays `AGE_6_10` (no midpoint)
- [ ] **Step 2: Run** `yarn vitest run src/import` — expect FAIL.
- [ ] **Step 3: Implement helpers then `normalizeListing`.**
- [ ] **Step 4: Run** `yarn vitest run src/import` — expect PASS.
- [ ] **Step 5: Commit** `feat(emlak): pure normalize pipeline for sahibinden listings`

### Task 4: Import CLI with upsert and report

**Files:**
- Create: `apps/emlak-app/scripts/import-sahibinden.ts`
- Create: `apps/emlak-app/src/import/upsert-properties.ts`, `src/import/import-report.ts`
- Create: `apps/emlak-app/fixtures/sahibinden-sample.json` (3 synthetic listings: one konut, one arsa, one with broken price + unknown feature key + a duplicate `İlan no` of listing 1)
- Modify: `apps/emlak-app/package.json` (script `"import:sahibinden": "tsx scripts/import-sahibinden.ts"`)
- Test: e2e steps below (no unit file; logic is in Task 3)

**Interfaces:**
- Consumes: `normalizeListing`; REST API with Bearer key from env `TWENTY_API_KEY` (fallback: file `/home/user/.re-api-key`).
- Produces: `upsertProperties(records: Array<Record<string, unknown>>, opts: { dryRun: boolean; baseUrl: string; apiKey: string }): Promise<ImportSummary>`; `type ImportSummary = { created: number; updated: number; skipped: number; issues: ImportIssue[] }`; report written to `import-report-<ISO timestamp>.json` next to the input file.

- [ ] **Step 1: Implement** — read file, extract `'İlan Listesi'`, in-file dedupe by `İlan no` (first wins, rest → `DUPLICATE` issues; Review Focus 2), normalize all, validate (`externalId`+`name`+`category` required, else skip + issue), upsert: `GET /rest/properties?filter=externalId[eq]:<id>` → PATCH if found else POST. `--dry-run` skips all writes.
- [ ] **Step 2: Dry-run e2e:** `yarn import:sahibinden fixtures/sahibinden-sample.json --dry-run` → report shows created 0, would-create 2, skipped 1, issues include `UNMAPPED_KEY` and `DUPLICATE`; `GET /rest/properties` count unchanged.
- [ ] **Step 3: Real run twice:** first → created 2; second (same file) → updated 2, created 0 (idempotent). Verify via REST count and one record's `heating`/`interiorFeatures` values.
- [ ] **Step 4: Commit** `feat(emlak): sahibinden import CLI with dry-run and calibration report`

### Task 5: buildPropertyFilter

**Files:**
- Create: `apps/emlak-app/src/search/property-search-params.type.ts` (`type PropertySearchParams` — exactly the spec §3 param list)
- Create: `apps/emlak-app/src/search/build-property-filter.ts`
- Test: `apps/emlak-app/src/search/__tests__/build-property-filter.test.ts`

**Interfaces:**
- Produces: `buildPropertyFilter(params: PropertySearchParams): Record<string, unknown>` (Twenty GraphQL filter: `and` of `{ field: { operator: value } }`; `in` for arrays, `gte/lte` for ranges on `price.amountMicros` and `sqmNet`, `ilike '%…%'` for `neighborhoodContains`, multi-select `containsAny` — confirm exact operator names against the server's GraphQL schema introspection before implementing) and `buildOrderBy(params): Record<string, unknown>`.

- [ ] **Step 1: Write failing tests:** empty params → `{}` filter (Review Focus 5); priceMin+priceMax → both bounds in micros; districts array → `in`; features `all` mode → `and` of contains; combined example from spec ("Bornova, ≤30.000 TL, Kiralık, 3+1, eşyalı").
- [ ] **Step 2: Run** `yarn vitest run src/search` — FAIL.
- [ ] **Step 3: Implement** (introspect `curl localhost:3000/graphql` for `PropertyFilterInput` operator names first).
- [ ] **Step 4: Run** — PASS.
- [ ] **Step 5: Commit** `feat(emlak): shared property filter builder`

### Task 6: search_properties AI tool

**Files:**
- Create: `apps/emlak-app/src/logic-functions/search-properties.ts` (`defineLogicFunction` + `toolTriggerSettings`; input schema mirrors `PropertySearchParams`)
- Test: e2e over MCP + REST comparison

**Interfaces:**
- Consumes: `buildPropertyFilter`; the app's generated API client (`.twenty/output`) or raw fetch to `/graphql`.
- Produces: tool `search_properties` returning `{ count: number; results: Array<{ id; name; price; district; rooms; sqmNet; status }> }`, default `limit` 20, sorted `createdAt desc` when `sortBy` absent.

- [ ] **Step 1: Implement the function** (follow the scaffold's `health-check.ts` pattern for `defineLogicFunction`; tool trigger per PLATFORM-NOTES §2 `toolTriggerSettings`).
- [ ] **Step 2: Apply:** `yarn twenty plan` → `yarn twenty apply`.
- [ ] **Step 3: e2e:** MCP Inspector CLI (`npx -y @modelcontextprotocol/inspector@2.9.0 --cli http://localhost:3000/mcp --transport http --header "Authorization: Bearer <key>" --method tools/call --tool-name app_search_properties --tool-arg 'districts=["Bornova"]'`) returns the same ids as the equivalent REST filter query; no-param call returns ≤20 newest (Review Focus 5).
- [ ] **Step 4: Commit** `feat(emlak): search_properties tool for AI chat and MCP`

### Task 7: Calibration with the real export, final verification

**Files:**
- Modify: `apps/emlak-app/src/constants/property-options.ts` (options the report surfaces)
- Modify: `docs/HANDOFF.md` (status update)

- [ ] **Step 1: Ask the owner for the real sahibinden export file** — blocked on user input; stop here if not provided.
- [ ] **Step 2: Calibration loop:** `--dry-run` → add every `UNMAPPED_KEY`/`UNMAPPED_VALUE` the report lists to the option sets/mappings → `yarn twenty apply` → repeat until the report has zero unmapped issues.
- [ ] **Step 3: Real import** → report counts match file; spot REST queries (district eq, price range, features contains) return expected records.
- [ ] **Step 4: UI check:** Portföyler view with a filter applied; screenshot sent to the owner.
- [ ] **Step 5: Update HANDOFF, commit** `feat(emlak): calibrate schema against real export and import portfolio` **and push.**
