# Forgotten-lead follow-up reminders

Design spec for feature 2 of the Emlak app: no relationship goes silent
unnoticed. A nightly sweep computes who has waited too long since the last
real touch, surfaces them in a view, and drops a one-time task when a lead
first crosses its threshold.

Approved in conversation on 2026-10-06 (research-backed decisions + approach A).
Design inputs: Pipedrive per-stage rotting, Follow Up Boss smart lists,
Salesforce/HubSpot "last activity vs last contacted" semantics (links in the
conversation; summarized in §2).

## Goals

- A consultant opens one view ("Takip Bekleyenler") and sees every person
  whose follow-up is due or overdue, ordered by how badly.
- Thresholds depend on the lead's stage (hot/warm/long-term), defaults
  3/7/30 days, changeable in one constants file.
- When a person first crosses the threshold, exactly one task is created —
  no nightly task spam while they stay overdue.
- Zero extra discipline required: logging a note or completing a task on the
  person is the touch; editing a phone number is not.

## Non-goals (v2+)

- Assigning the reminder task to a specific consultant (office is small; the
  view is the primary surface).
- Event-driven instant updates (a DB-event trigger could update
  `lastTouchedAt` in real time; v1 recomputes nightly).
- Email/calendar/WhatsApp integration as touch sources.
- Lead ponds / reassignment flows, kanban pipelines, a separate Lead object.

## 1. Data model: four fields on Person (defineField)

All labels locale-ready (`LocalizedText`), identifiers stable UUIDs in
`src/constants/person-follow-up-field-ids.ts`.

| Field | Type | Notes |
|---|---|---|
| `followUpStage` | SELECT: SICAK "Sıcak" (3), ILIK "Ilık" (7), UZUN_VADELI "Uzun Vadeli" (30) | empty = not tracked; setting it enrolls the person |
| `followUpStatus` | SELECT: TAKIPTE "Takipte", VADESI_GELDI "Vadesi Geldi", GECIKMIS "Gecikmiş" | written only by the sweeper |
| `lastTouchedAt` | DATE_TIME | written only by the sweeper; informational |
| `followUpTaskCreatedAt` | DATE_TIME, `isUIEditable: false` | internal dedupe marker for task creation |

View: "Takip Bekleyenler" on People — filter `followUpStatus` IS
VADESI_GELDI or GECIKMIS; columns: name, followUpStage, followUpStatus,
lastTouchedAt, phones. The default People view additionally gets no changes
(consultants may add the stage column themselves).

Threshold constants in `src/constants/follow-up-thresholds.ts`:
`FOLLOW_UP_THRESHOLD_DAYS = { SICAK: 3, ILIK: 7, UZUN_VADELI: 30 }`.

## 2. Touch definition

A person's `lastTouchedAt` = the most recent of:

- `createdAt` of a Note whose noteTargets include the person;
- `updatedAt` of a Task in status DONE whose taskTargets include the person.

Deliberately excluded: record field edits (Pipedrive's known false-touch
problem), scheduled-but-open tasks (Salesforce counts only completed ones),
and timeline field-update events. The sweeper queries noteTargets and
taskTargets directly rather than parsing timelineActivities.

## 3. Status rules (pure function)

`computeFollowUpStatus({ stage, lastTouchedAt, now })` with thresholds from
the constants file; `T` = threshold days for the stage:

- no `followUpStage` → person is skipped entirely (fields untouched).
- never touched (`lastTouchedAt` null after the queries) → VADESI_GELDI
  (a brand-new lead needs contact now; FUB/industry cadence).
- days since touch < T → TAKIPTE.
- T ≤ days < 2×T → VADESI_GELDI.
- days ≥ 2×T → GECIKMIS.

Days are computed as `floor((now - lastTouchedAt) / 86_400_000)` — plain UTC
millisecond arithmetic, no timezone day-boundary logic (a few hours of skew
is irrelevant at 3/7/30-day scales).

## 4. One-time task on lapse

`shouldCreateTask({ nextStatus, lastTouchedAt, taskMarker })`
returns true only when nextStatus is VADESI_GELDI or GECIKMIS AND
(`followUpTaskCreatedAt` is null OR `followUpTaskCreatedAt` <
`lastTouchedAt`). The marker is set to now when the task is created, so:

- one lapse cycle = one task, however many nights it stays red;
- a new touch (lastTouchedAt moves past the marker) re-arms task creation
  for the next lapse.

Task content: title `Takip: <kişi adı>`, body names the stage and days since
last touch, `dueAt` = today, a taskTarget linking the person, status TODO.
No assignee in v1.

## 5. The sweeper (cron logic function)

`src/logic-functions/follow-up-sweeper.ts` — `defineLogicFunction` with
`cronTriggerSettings: { pattern: '15 3 * * *' }` (03:15 nightly, server
time) and `toolTriggerSettings` so it can also be invoked manually from AI
chat/MCP ("takip taramasını şimdi çalıştır") and in tests.

Flow per run, via `CoreApiClient`:

1. Query people with a non-empty `followUpStage` (paged, 50 at a time —
   requests stay far under the 100/60s API-key ceiling; the function runs
   with the app's own role anyway).
2. For the page's person ids, query notes (via noteTargets) and DONE tasks
   (via taskTargets), newest first, and fold to per-person latest touch.
3. Compute status; write `followUpStatus`/`lastTouchedAt` only when changed.
4. Create the lapse task + set `followUpTaskCreatedAt` when §4 says so.
5. Return `{ scanned, due, overdue, tasksCreated }` (also handy for the AI
   tool invocation).

Permissions: the app's default role must allow creating Task records; if the
scaffold role lacks a create grant, extend `default-role.ts` accordingly
(verified during implementation).

Platform caveat recorded in PLATFORM-NOTES: whether cron triggers actually
fire on this dev instance is unverified. The e2e therefore validates the
sweep by invoking the function directly (`executeOneLogicFunction`, user
token — API keys cannot call it); cron registration is asserted via the
synced metadata, and real firing is checked opportunistically the next day.

## 6. Testing

- Unit (vitest): `computeFollowUpStatus` table — each stage × (never touched,
  fresh, just past T, past 2×T) plus stage-less skip; `shouldCreateTask`
  table — first lapse, still lapsed with marker, re-armed after new touch.
- e2e on the local workspace: set stages on three seeded people (one with a
  fresh note, one touched 10 days ago via a backdated completed task, one
  never touched); run the sweeper via `executeOneLogicFunction`; assert
  statuses TAKIPTE/VADESI_GELDI (ILIK) and VADESI_GELDI (never touched),
  exactly 2 tasks created; run again → 0 new tasks (dedupe); add a note to
  one, run → back to TAKIPTE and marker re-armed.
- UI: screenshot of "Takip Bekleyenler" with the lapsed people visible.

## 7. Rollout

1. Fields + view in the manifest → `twenty plan` → `apply`.
2. Unit tests green; typecheck/lint clean.
3. Sweeper function → apply → e2e sequence above.
4. HANDOFF update, commit, push.
