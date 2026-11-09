# Follow-up Reminder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nightly sweeper that computes follow-up status per tracked person, surfaces due/overdue people in a view, and creates one task per lapse.

**Architecture:** Four `defineField`s on the standard Person object + one view; a pure status/task-decision core (unit-tested); one cron+tool logic function that queries notes/done-tasks as the touch signal and writes status/tasks via `CoreApiClient`.

**Tech Stack:** twenty-sdk 2.44.0 in `apps/emlak-app`, vitest, CoreApiClient, psql for e2e backdating.

**Spec:** `docs/superpowers/specs/2026-10-06-follow-up-reminder-design.md`

## Global Constraints

Same as the schema plan (`2026-10-06-sahibinden-property-schema.md` Global Constraints): Yarn 4, Node 24 on PATH, SDK 2.44.0, repo house rules, owner git identity, labels via `LocalizedText`/`resolveLabel`, stable UUIDs, server running for apply/e2e, API key at `/home/user/.re-api-key`, user-token login mutations on `/metadata` for `executeOneLogicFunction`.

## Review Focus

1. Tracked person with zero notes and zero tasks → VADESI_GELDI, no crash. (T1 unit + T3 e2e)
2. A DONE task targeting several people counts as a touch for each of them. (T3: the backdated task targets two people)
3. One person's failing task creation must not abort the sweep — error counted in the result, loop continues. (T3: result shape asserts per-person error count field exists)
4. `followUpStage` cleared after tracking → sweeper clears `followUpStatus` so the person leaves the view (spec silent; ruled: un-enrolling must un-flag). (T1 unit: stage null + existing status → CLEAR signal; T3 e2e step)
5. More than one page of tracked people → paging loop termination (pure fold function unit-tested with 2 synthetic pages). (T1/T3)

---

### Task 1: Pure follow-up core

**Files:**
- Create: `apps/emlak-app/src/constants/person-follow-up-field-ids.ts`, `apps/emlak-app/src/constants/follow-up-thresholds.ts`
- Create: `apps/emlak-app/src/follow-up/compute-follow-up-status.ts`, `apps/emlak-app/src/follow-up/should-create-task.ts`, `apps/emlak-app/src/follow-up/latest-touch.ts`
- Test: `apps/emlak-app/src/follow-up/__tests__/*.test.ts`

**Interfaces (Produces):**
- `PERSON_FOLLOW_UP_FIELD_IDS: Record<'followUpStage'|'followUpStatus'|'lastTouchedAt'|'followUpTaskCreatedAt', string>` (fresh UUIDv4s) + `TAKIP_BEKLEYENLER_VIEW_ID`.
- `FOLLOW_UP_THRESHOLD_DAYS: Record<'SICAK'|'ILIK'|'UZUN_VADELI', number>` = {3, 7, 30}.
- `type FollowUpStatus = 'TAKIPTE' | 'VADESI_GELDI' | 'GECIKMIS'`.
- `computeFollowUpStatus(input: { stage: string | null; lastTouchedAt: string | null; now: number }): FollowUpStatus | null` — null means "clear/skip" (stage missing). Spec §3 rules; days = `floor((now - Date.parse(lastTouchedAt)) / 86_400_000)`.
- `shouldCreateTask(input: { nextStatus: FollowUpStatus | null; lastTouchedAt: string | null; taskMarker: string | null }): boolean` — spec §4.
- `latestTouch(noteDates: string[], doneTaskDates: string[]): string | null` — max ISO date or null.

- [ ] **Step 1: failing tests** — tables per spec §6: each stage × (never touched → VADESI_GELDI; 1 day ago → TAKIPTE; T+1 days → VADESI_GELDI; 2T+1 days → GECIKMIS); stage null → null; shouldCreateTask (first lapse true; marker newer than touch false; touch newer than marker true; TAKIPTE false); latestTouch (both lists, one empty, both empty).
- [ ] **Step 2:** `yarn test:unit src/follow-up` → FAIL (modules missing).
- [ ] **Step 3: implement** the three functions + constants.
- [ ] **Step 4:** `yarn test:unit src/follow-up` → PASS.
- [ ] **Step 5: commit** `feat(emlak): follow-up status core`

### Task 2: Person fields and view

**Files:**
- Create: `apps/emlak-app/src/fields/follow-up-on-person.fields.ts` (4 × `defineField`? — one default export per file: create 4 files `follow-up-stage.field.ts`, `follow-up-status.field.ts`, `last-touched-at.field.ts`, `follow-up-task-created-at.field.ts` under `src/fields/`, each `objectUniversalIdentifier: STANDARD_OBJECT_UNIVERSAL_IDENTIFIERS.person.universalIdentifier`)
- Create: `apps/emlak-app/src/views/takip-bekleyenler.view.ts` (on the person object; filter `followUpStatus` IS `['VADESI_GELDI','GECIKMIS']`; columns per spec §1 — viewField ids: fresh UUIDs)
- Options inline in the field files via a local `buildOptions`-style literal (position/color explicit), labels `resolveLabel({tr,...})`.

**Interfaces:** Consumes Task 1 ids; produces live workspace fields every later step queries. `followUpTaskCreatedAt` gets `isUIEditable: false`.

- [ ] **Step 1: write the 4 field files + view.**
- [ ] **Step 2:** `yarn twenty plan` → adds only, zero errors.
- [ ] **Step 3:** `yarn twenty apply` → synced; psql: `person` table has `followUpStage`, `followUpStatus`, `lastTouchedAt`, `followUpTaskCreatedAt`.
- [ ] **Step 4: commit** `feat(emlak): follow-up fields and view on person`

### Task 3: Sweeper logic function + e2e

**Files:**
- Create: `apps/emlak-app/src/logic-functions/follow-up-sweeper.ts`
- Modify: `apps/emlak-app/src/default-role.ts` only if task creation is denied (grant create).

**Interfaces:** Consumes Task 1 core + Task 2 fields. Produces tool `follow_up_sweeper` returning `{ scanned, takipte, vadesiGeldi, gecikmis, tasksCreated, errors }`.

- [ ] **Step 1: implement** — `defineLogicFunction` name `follow-up-sweeper`, `cronTriggerSettings: { pattern: '15 3 * * *' }`, `toolTriggerSettings` (no params), `timeoutSeconds: 300`. Flow per spec §5: page people `filter: { followUpStage: { is: 'NOT_NULL' } }` 50/page via `CoreApiClient.query`; batch-query noteTargets (`note { createdAt }`) and taskTargets (`task { status, updatedAt }`) by `personId in ids`; fold with `latestTouch` (only DONE tasks); compute; `updateOnePerson`-equivalent mutation only on change; create task (title `Takip: <name.firstName> <name.lastName>`, body stage + gün, `taskTargets` link, status TODO, dueAt today) when `shouldCreateTask`; stage-cleared people with stale status get status+marker nulled (Review Focus 4). Per-person try/catch → `errors` count.
- [ ] **Step 2:** `yarn typecheck` + `yarn twenty apply` → synced.
- [ ] **Step 3: e2e seed** — REST: create 3 people `TT Takip Bir/İki/Üç` + a 4th `TT Takip Dört`; stages: Bir=SICAK + note now; İki=ILIK + task DONE targeting İki AND Dört (both stage ILIK); Üç=SICAK, no touch. psql: backdate that task's `updatedAt` to now−10d.
- [ ] **Step 4: run** — fresh user token (`getLoginTokenFromCredentials` → `getAuthTokensFromLoginToken`), `executeOneLogicFunction` on `/metadata`. Expected: Bir TAKIPTE; İki & Dört VADESI_GELDI (10d ≥ 7, < 14); Üç VADESI_GELDI (never touched); tasksCreated = 3.
- [ ] **Step 5: dedupe run** — run again, Expected tasksCreated 0, statuses unchanged.
- [ ] **Step 6: re-arm** — add a note to Üç via REST, run, Expected Üç TAKIPTE and its marker older than new touch (re-armed).
- [ ] **Step 7: un-enroll** — clear İki's `followUpStage` via REST PATCH, run, Expected İki's `followUpStatus` null (left the view).
- [ ] **Step 8: cleanup** — delete TT people and the created tasks; **commit** `feat(emlak): nightly follow-up sweeper with one-shot lapse tasks`

### Task 4: Verify UI, document, close

- [ ] **Step 1:** re-seed two lapsed TT people, run sweeper, screenshot "Takip Bekleyenler" via the Playwright script pattern (`executablePath: /opt/pw-browsers/chromium`), send to owner, clean up.
- [ ] **Step 2:** HANDOFF "What is already done" gains the follow-up feature line; ledger Task lines; **commit + push.**
