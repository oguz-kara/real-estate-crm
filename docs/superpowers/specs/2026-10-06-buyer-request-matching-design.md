# Buyer requests and deterministic property matching

Design spec for feature 3 of the Emlak app: consultants record what a buyer
is looking for as a structured request; the system finds matching portfolio
properties instantly, re-checks nightly as new listings arrive, and keeps a
persistent per-pair match record so nothing is shown twice or forgotten.

Approved in conversation on 2026-10-06 (4 design sections + industry research:
FUB/RealScout-style must-have / nice-to-have / deal-breaker criteria, saved-
search semantics, alert cadence; sources linked in conversation).

## Goals

- A `buyerRequest` captures hard criteria (eliminate), soft criteria (score)
  and deal-breakers (`excludedFeatures`), linked to the buyer Person.
- Matching is deterministic and model-free; the same filter core
  (`buildPropertyFilter`) that serves search is reused for the hard pass.
- Matches persist as `propertyMatch` records (score + consultant status), so
  a pair can only ever be "new" once — notification dedupe comes from the
  schema, not bookkeeping.
- Three triggers, one core: instant on request create/update (DB event),
  on-demand tool (`match_buyer_request`, AI chat + MCP), nightly sweep that
  turns newly born matches into one task per request.

## Non-goals (v2+)

- Buyer-facing delivery (email/WhatsApp alerts to the buyer) — v1 notifies
  the consultant with a task; TR practice is a personal call.
- Behavioral/engagement scoring (needs buyer-facing surfaces first).
- AI-ranked or natural-language matching — the `notes` free-text field is
  reserved for the future chat layer (RealScout "AI Search" pattern); the
  LLM key is deliberately not configured yet.
- A custom matching UI widget; relation panels and views are the v1 surface.

## 1. Data model

### `buyerRequest` (Talep) — new app object, icon IconUserSearch

| Field | Type | Notes |
|---|---|---|
| `name` | TEXT (label) | e.g. "Ali Yılmaz — Satılık Daire, Bornova" |
| `buyer` → Person | RELATION M2O (`buyerId`), reverse `buyerRequests` on Person | |
| `status` | SELECT: AKTIF "Aktif" (default), BEKLEMEDE "Beklemede", SONUCLANDI "Sonuçlandı", IPTAL "İptal" | only AKTIF is matched |
| `category` | SELECT | same option set as property (shared constants) |
| `listingType` | SELECT | same option set as property |
| `budgetMax` | CURRENCY | hard ceiling |
| `districts` | TEXT | comma-separated; empty = anywhere |
| `rooms` | MULTI_SELECT | same options as property rooms; empty = any |
| `excludedFeatures` | MULTI_SELECT | deal-breakers; union of all 8 property amenity groups' options |
| `budgetMin` | CURRENCY | soft: below it = suspiciously cheap |
| `sqmNetMin` | NUMBER int | soft |
| `features` | MULTI_SELECT | wanted amenities (same union as excludedFeatures) |
| `notes` | TEXT, `isSearchable: true` | free text for the future AI layer |

### `propertyMatch` (Eşleşme) — junction object, icon IconArrowsLeftRight

| Field | Type | Notes |
|---|---|---|
| `name` | TEXT (label) | "<request name> ↔ <property name>", written by the matcher |
| `request` → buyerRequest | RELATION M2O (`requestId`), reverse `matches` | |
| `property` → property | RELATION M2O (`propertyId`), reverse `matches` | |
| `score` | NUMBER int 0-100 | refreshed on every run |
| `status` | SELECT: YENI "Yeni" (default), GOSTERILDI "Gösterildi", BEGENMEDI "Beğenmedi", YER_GOSTERILDI "Yer Gösterildi", TEKLIF "Teklif" | consultant-owned after birth |
| unique index | (`requestId`, `propertyId`) | a pair is born exactly once |

Views + navigation: "Talepler" sidebar entry (OBJECT nav item); views
"Aktif Talepler" (buyerRequest, status AKTIF) and "Yeni Eşleşmeler"
(propertyMatch, status YENI, sorted by score desc). Relation panels give the
match list on the request page and the interested-requests list on the
property page for free.

## 2. Matching rules

Pure functions in `src/matching/`; weights in
`src/constants/match-scoring.ts`.

**Hard pass — any failure eliminates the property:**

1. property `status` = ACTIVE.
2. request `category` set → equal.
3. request `listingType` set → equal.
4. `budgetMax` set → price.amountMicros ≤ budgetMax; a property with a null
   price is eliminated when a budget cap exists, and stays a candidate when
   the request has no cap.
5. `districts` set → property.district ∈ list, compared Turkish-case-
   insensitively (`toLocaleLowerCase('tr-TR')`, trimmed).
6. `rooms` set → property.rooms ∈ list.
7. `excludedFeatures` set → property has none of them (checked across all 8
   amenity multi-selects).

Query strategy: criteria 1-4 and 6 translate to `PropertySearchParams` →
`buildPropertyFilter`; 5 and 7 are checked in code on the fetched page(s)
(paged to exhaustion, PAGE_SIZE 60 — the nested-cap lesson applies).

**Soft score (0-100), components summed then rounded and clamped:**

| Component | Max | Rule |
|---|---|---|
| features coverage | 40 | wanted features present in the property ÷ wanted count × 40; full points when none wanted |
| sqm | 25 | sqmNet ≥ sqmNetMin → 25; below → ratio × 25; property sqm null → 0; no sqmNetMin → 25 |
| budget fit | 20 | no budgetMin or price ≥ budgetMin → 20; below → 8 |
| freshness | 15 | property createdAt within 30 days → 15; within 90 → 8; older → 3 |

**Persistence rule:** a computed pair is inserted as YENI only when absent
(unique index enforces); on an existing pair only `score` (and `name`) are
refreshed — `status` is never overwritten, so BEGENMEDI never resurrects.

## 3. Triggers and tasks — one core, three entry points

Core: `runRequestMatching(client, requestId, now)` (injectable client,
stub-testable, same pattern as `run-sweep.ts`). Returns
`{ considered, matched, created, refreshed, topMatches }`.

1. **Tool `match_buyer_request`** (`toolTriggerSettings`, input `{ requestId }`):
   runs the core, returns the ranked list (property name, priceTl, district,
   score, match status). Registered for AI chat + MCP; works key-less via MCP.
2. **Instant on save** (`databaseEventTriggerSettings`): two thin logic
   functions on `buyerRequest.created` and `buyerRequest.updated` call the
   core for that record, so the consultant sees matches on the request page
   immediately after saving. Whether DB events fire on this dev instance is
   unverified platform behavior — the e2e observes it; if silent, tool+cron
   still cover everything (noted, not blocking).
3. **Nightly `request-match-sweeper`** (cron `45 3 * * *`, also a tool for
   manual runs): for every AKTIF request run the core; when a run creates ≥1
   new match for a request, create ONE task — title
   "Yeni eşleşme: <request name> (N yeni portföy)", body = top 3 matches
   (name, TL price, district, score), dueAt today, taskTarget → the request.
   No marker needed: "new" can only happen once per pair by schema. Per-
   request try/catch; result mirrors the sweep result shape with
   `errorSamples`.

## 4. Testing

- Unit: hard-pass table (each of the 7 rules, incl. null-price × budget
  cases and the tr-case district table), score table (component bounds,
  empty-criteria full points, clamp/round), request→SearchParams mapper.
- Stub-client: core inserts YENI / refreshes score without touching status /
  second run creates nothing / eliminated property never written; sweeper:
  inactive request skipped, one task per request with new matches, zero
  tasks otherwise, one request's error isolated.
- Live e2e (TT3-prefixed data): create request → check DB-event instant
  matching; sanity of matches against known İzmir listings; MCP tool parity;
  BEGENMEDI survives re-match; manual sweeper run → no task, add a matching
  listing, run → exactly one task, run again → zero; cleanup.
- UI screenshots: Talepler list, request page with match panel, the task.

## 5. Rollout

1. Shared amenity-union options + two objects + relations + index + views +
   nav in the manifest → `plan` → `apply`.
2. Unit tests green; typecheck/lint clean.
3. Matching core + tool + event functions + sweeper → `apply` → e2e.
4. Screenshots, HANDOFF, ledger, commit, push; fresh-reviewer branch review.
