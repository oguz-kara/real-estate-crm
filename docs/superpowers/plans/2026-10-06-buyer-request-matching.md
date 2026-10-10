# Buyer Request Matching Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `buyerRequest` + `propertyMatch` objects, a deterministic match core reused by an AI/MCP tool, instant on-save matching, and a nightly sweep that turns newly born matches into one task per request.

**Architecture:** Pure hard-pass/score functions over shared option constants; an injectable-client orchestrator (`runRequestMatching`) following the proven `run-sweep.ts` pattern; hard criteria queried through the existing `buildPropertyFilter`, Turkish-insensitive district and deal-breaker checks in code; dedupe by a (request, property) unique index, never by markers.

**Tech Stack:** twenty-sdk 2.44.0 in `apps/emlak-app`, vitest, CoreApiClient, REST/psql for e2e.

**Spec:** `docs/superpowers/specs/2026-10-06-buyer-request-matching-design.md`

## Global Constraints

Same as `2026-10-06-sahibinden-property-schema.md` Global Constraints (Yarn 4, Node 24 PATH, SDK 2.44.0, house rules, owner git identity, `LocalizedText` labels, stable UUIDs, running server for apply/e2e, API key `/home/user/.re-api-key`, user-token login for `executeOneLogicFunction`). Plus: top-level queries paged to exhaustion with `first: 60` — never nested relation ride-alongs for data that must be complete (the 60-row-unordered-cap lesson).

## Review Focus

1. Amenity values appearing in several property groups (SAHIL, SPOR_SALONU) must appear once in the union option set used by request `features`/`excludedFeatures`. (T1 — the existing constants uniqueness test must cover the union set)
2. A request with every criterion empty matches ALL active properties (spec: empty = open); pinned by test so it is deliberate, and the sweeper still emits only one task. (T1 unit + T3 stub)
3. Property with null district while the request lists districts → eliminated, no crash; same for null rooms. (T1)
4. Score component sums at boundaries round and clamp into 0-100. (T1)
5. One request failing (query or task write) must not abort the sweeper; errors counted with samples. (T3 stub)

---

### Task 1: Options, ids and the pure matching core

**Files:**
- Create: `apps/emlak-app/src/constants/request-field-ids.ts` (object + field + view/nav/index UUIDs for both new objects), `apps/emlak-app/src/constants/match-scoring.ts`
- Modify: `apps/emlak-app/src/constants/property-options.ts` (export `AMENITY_UNION_OPTIONS`: all 8 groups' options deduped by value first-wins, positions reassigned contiguously; add `buyerRequestStatus` + `propertyMatchStatus` select sets)
- Create: `apps/emlak-app/src/matching/matches-hard-criteria.ts`, `src/matching/score-match.ts`, `src/matching/request-search-params.ts`
- Test: `apps/emlak-app/src/matching/__tests__/*.test.ts`

**Interfaces (Produces):**
- `type MatchRequest = { status: string | null; category: string | null; listingType: string | null; budgetMaxMicros: number | null; budgetMinMicros: number | null; districts: string | null; rooms: string[] | null; excludedFeatures: string[] | null; features: string[] | null; sqmNetMin: number | null }` and `type MatchProperty = { id: string; name: string | null; status: string | null; category: string | null; listingType: string | null; priceMicros: number | null; district: string | null; rooms: string | null; sqmNet: number | null; createdAt: string; amenities: string[] }` (amenities = union of the 8 arrays).
- `matchesHardCriteria(request: MatchRequest, property: MatchProperty): boolean` — spec §2 rules 1-7; districts split on comma, compared via `toLocaleLowerCase('tr-TR')` + trim.
- `scoreMatch(request: MatchRequest, property: MatchProperty, now: number): number` — spec §2 table; weights from `MATCH_SCORE_WEIGHTS = { features: 40, sqm: 25, budget: 20, freshness: 15 }`.
- `buildRequestSearchParams(request: MatchRequest): PropertySearchParams` — category/listingType/priceMax(TL? no — micros→the builder takes micros already; pass priceMax in micros)/rooms/status ACTIVE; districts and exclusions deliberately NOT in the filter (code-side).

- [ ] **Step 1: failing tests** — hard-pass table (all 7 rules + Review Focus 2/3 cases), score table (component bounds, empty-criteria full points, null sqm → 0 component, clamp/round), params mapper (sets status ACTIVE, maps micros, omits districts), union options uniqueness (SAHIL appears once).
- [ ] **Step 2:** `yarn test:unit src/matching src/constants` → FAIL.
- [ ] **Step 3: implement.**
- [ ] **Step 4:** suite PASS. **Step 5: commit** `feat(emlak): deterministic match core and shared request options`

### Task 2: Schema — two objects, relations, views, nav

**Files:**
- Create: `apps/emlak-app/src/objects/buyer-request.object.ts` (spec §1 fields; `status` default `"'AKTIF'"`; `notes` searchable; rooms/features/excludedFeatures options from shared sets)
- Create: `apps/emlak-app/src/objects/property-match.object.ts` (score int, status default `"'YENI'"`; inline M2O relations `request`→buyerRequest (`requestId`, CASCADE) and `property`→property (`propertyId`, CASCADE))
- Create: `apps/emlak-app/src/fields/buyer-on-request.field.ts` + `buyer-requests-on-person.field.ts` (M2O `buyerId` SET_NULL / reverse O2M)
- Create: `apps/emlak-app/src/fields/matches-on-buyer-request.field.ts` + `matches-on-property.field.ts` (O2M reverse sides of the inline M2Os)
- Create: `apps/emlak-app/src/indexes/property-match-unique.index.ts` (unique BTREE on requestId + propertyId — two index fields)
- Create: `apps/emlak-app/src/views/aktif-talepler.view.ts` (buyerRequest, filter status IS ['AKTIF']; columns buyer, category, listingType, budgetMax, districts), `src/views/yeni-eslesmeler.view.ts` (propertyMatch, filter status IS ['YENI']; columns request, property, score, status; sort score desc)
- Create: `apps/emlak-app/src/navigation-menu-items/buyer-requests.navigation-menu-item.ts` (OBJECT, position 1)

- [ ] **Step 1: write files.** **Step 2:** `yarn twenty plan` → adds only, zero errors (watch for reserved names). **Step 3:** `apply`; psql verifies `_buyerRequest`/`_propertyMatch` tables, FK columns, unique index on (requestId, propertyId); REST double-create of same pair → 400. **Step 4: commit** `feat(emlak): buyer request and property match objects`

### Task 3: Orchestrator, tool, event functions, sweeper

**Files:**
- Create: `apps/emlak-app/src/matching/run-request-matching.ts` — `runRequestMatching(client: SweepClient, requestId: string, now: number)` → `{ considered, matched, created, refreshed, topMatches }`; fetch request (skip non-AKTIF → all-zero result), query properties via `buildPropertyFilter(buildRequestSearchParams(...))` paged to exhaustion, code-side rules 5/7, score, fetch existing matches for the request (paged), create missing (status YENI, name "<req> ↔ <prop>") / update score+name only when changed.
- Create: `apps/emlak-app/src/matching/run-match-sweep.ts` — `runMatchSweep(client, now)` → `{ requestsScanned, matchesCreated, tasksCreated, errors, errorSamples }`; AKTIF requests paged; per request call `runRequestMatching`; when `created > 0` → one task (title `Yeni eşleşme: <name> (N yeni portföy)`, body top-3 markdown, dueAt now, taskTarget `targetBuyerRequestId`); per-request try/catch.
- Create: `apps/emlak-app/src/logic-functions/match-buyer-request.ts` (tool, input `{ requestId: string }` required), `src/logic-functions/match-request-on-create.ts` + `match-request-on-update.ts` (databaseEventTriggerSettings eventName `buyerRequest.created` / `buyerRequest.updated`; handler extracts the record id from the event payload — inspect the payload shape at e2e and adapt), `src/logic-functions/request-match-sweeper.ts` (cron `45 3 * * *` + tool).
- Test: `apps/emlak-app/src/matching/__tests__/run-request-matching.test.ts`, `run-match-sweep.test.ts` (stub client per run-sweep.test.ts pattern).

- [ ] **Step 1: failing stub tests** — new pair → YENI created; existing pair → score refreshed, status untouched; second run creates 0; eliminated property never written; non-AKTIF request → zeros; sweeper: one task per request with created>0, zero otherwise, one request's throw isolated (Review Focus 5).
- [ ] **Step 2:** FAIL run. **Step 3: implement.** **Step 4:** full `yarn test:unit` PASS + typecheck + lint. **Step 5:** `yarn twenty apply`. **Step 6: commit** `feat(emlak): request matching tool, instant triggers and nightly sweep`

### Task 4: Live e2e, screenshots, close

- [ ] **Step 1:** seed TT3 request (Bornova, SATILIK, KONUT, 10M cap, rooms [R3_1]); wait ~15s, check junction via REST → records if DB events fire (record the observation either way).
- [ ] **Step 2:** run `match_buyer_request` via MCP → parity with REST junction state; sanity: known Bornova listings present, Karaburun arsa absent; scores ordered.
- [ ] **Step 3:** set one match BEGENMEDI → re-run tool → status intact, score refreshed.
- [ ] **Step 4:** run sweeper manually → 0 tasks; create a new matching TT3 property via REST → run → exactly 1 task with top-3 body → run again → 0.
- [ ] **Step 5:** screenshots (Talepler list, request page with matches panel, the task) via the Playwright script pattern; send to owner.
- [ ] **Step 6:** cleanup TT3 data; HANDOFF line; ledger; commit + push; dispatch fresh-reviewer branch review and run the single fix pass.
