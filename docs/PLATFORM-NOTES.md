# Twenty platform notes

What Twenty supports for a vertical app (custom objects, custom agent tools, an approval step, its own evals), and what would need a fork. Checked on `twenty/v2.44.0` running from source (see `LOCAL-SETUP.md`; backend :3000, frontend :3002) on 2026-10-03, using the seeded "Apple" demo workspace.

Every line ends with where it comes from: **docs** (docs.twenty.com), **source** (a file at this tag) or **test** (run locally). Full findings and step lists: [long version](PLATFORM-RESEARCH-FULL.md). Test code: `/Users/bussss/projects/twenty-playground`.

Not set up on this machine: an LLM key (so nothing that calls a model was run), billing, an enterprise key, and ClickHouse (the analytics database Twenty uses for usage and audit events).

## 1. App platform

An app is a TypeScript `twenty-sdk` package synced by the `twenty` CLI; it can add objects, fields, server logic and UI. Hello world loaded.

- One `export default define*()` per file; minimum: `defineApplication` and `defineApplicationRole`. [source](../packages/twenty-sdk/src/sdk/define/index.ts#L4)
- Logic functions: HTTP route, cron, database event (after the write), server route, AI tool or workflow action triggers. [source](../packages/twenty-shared/src/application/logicFunctionManifestType.ts#L11)
- App docs say functions are sandboxed; source and self-host docs say the LOCAL dev driver is not. [source](../packages/twenty-server/src/engine/core-modules/twenty-config/config-variables.ts#L732)
- UI: React front components in a Web Worker, partial DOM (in development). [docs](https://docs.twenty.com/developers/extend/apps/layout/front-components)
- Manifests cannot ship workflows, webhooks, validation rules or records. [source](../packages/twenty-shared/src/application/manifestType.ts#L35)
- Installs: dev sync (`twenty apply`) skips install hooks; `app:publish --private` then `app:install`, or npm, runs them. [source](../packages/twenty-server/src/engine/core-modules/application/application-install/application-install.service.ts#L105)
- Hello world: `npx -y -p twenty-sdk@2.44.0 twenty remote:add --url http://localhost:3000 --api-key <key> --as pn-local`, then `npx create-twenty-app@2.44.0 pn-hello-world --url http://localhost:3000`. [test](PLATFORM-RESEARCH-FULL.md#test-hello-world-app-question-1)
- Pin 2.44.0 (npm latest: 2.45.0). The scaffolder opens a browser and runs `corepack enable`; the test stubbed both on PATH. [test](PLATFORM-RESEARCH-FULL.md#test-hello-world-app-question-1)
- Synced: listed by `findManyApplications`; its page renders (`research-raw/hello-world-app.png`). [test](PLATFORM-RESEARCH-FULL.md#test-hello-world-app-question-1)
- Did not hold: `yarn twenty dev:function:exec -n health-check` fails with an API-key remote; a user token works. [test](PLATFORM-RESEARCH-FULL.md#test-hello-world-app-question-1)

## 2. AI agents

An agent is a metadata row (prompt, model, response format, role) from `createOneAgent`, `defineAgent` (alpha) or a workflow AI Agent step; AI chat runs no agent.

- Providers: OpenAI, Anthropic, Google, Mistral, xAI. Custom providers need billing or an enterprise key above 25 seats; likely blocked here (1005 users; not queried). [source](../packages/twenty-server/src/engine/core-modules/enterprise/services/custom-ai-provider-access.service.ts#L43)
- Key: `ANTHROPIC_API_KEY` or `OPENAI_API_KEY` in `packages/twenty-server/.env`, restart the server (docs) and worker, which runs chat (inferred, untested). [docs](https://docs.twenty.com/user-guide/ai/how-tos/ai-faq)
- Or Admin Panel > Config (no restart). Check `curl -s http://localhost:3000/client-config` (`aiModels`, empty today). [source](../packages/twenty-server/src/engine/core-modules/twenty-config/twenty-config.service.ts#L56)
- Tools follow the agent's role: workflow AI steps get CRM read/write on granted objects plus action tools; `runAgent` adds dashboard and workflow tools. No view tools; no role, no tools. [source](../packages/twenty-server/src/engine/metadata-modules/ai/ai-agent-execution/constants/open-ended-agent-registry-tool-categories.const.ts#L3)
- Custom tools: `toolTriggerSettings` on `defineLogicFunction` (`src/logic-functions/*.ts`). Every chat user and MCP caller sees `app_<name>`, unchecked by role or flag; API-key calls use the app's role. [source](../packages/twenty-server/src/engine/core-modules/tool-provider/providers/logic-function-tool.provider.ts#L29)
- Workflow agent steps and `runAgent` load no app tools or skills; docs say otherwise (untested exception: `code_interpreter` via MCP). [source](../packages/twenty-server/src/engine/metadata-modules/ai/ai-agent-execution/constants/workflow-agent-registry-tool-categories.const.ts#L3)

## 3. Permissions

Each member, agent and API key has one role. Limits held on CRM objects but leaked six ways, mostly via system objects (built-in email, calendar, timeline tables). AI chat ignores agent roles.

- Tokens: `getLoginTokenFromCredentials`, then `getAuthTokensFromLoginToken` on `/metadata`; `generateApiKeyToken(apiKeyId, expiresAt)` returns <key>. Both key mutations need a user session. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)
- Setup: `createOneRole`, `upsertObjectPermissions`, `upsertFieldPermissions`, `createApiKey` (with `roleId`), `assignRoleToAgent`. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)
- Agent roles apply only in workflow AI Agent steps, `runAgent` (without `runAsWorkspaceMemberId`) and eval runs. AI chat uses the logged-in user's role, so an agent's role cannot be tested through chat. [source](../packages/twenty-server/src/engine/metadata-modules/ai/ai-chat/services/agent-chat-actor.service.ts#L145)
- Held: "PN Limited" (read Company, `domainName` hidden) was denied People, Opportunities and company writes over REST, GraphQL and MCP. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)
- Leak (Bearer <limited-key>): REST and GraphQL `searchVector` hold the hidden domain (`GET /rest/companies?limit=3`); `GET /rest/timelineActivities?filter=targetCompanyId[eq]:<id>` returns `domainName` snapshots. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)
- Leak: `GET /rest/messages` returns email bodies; member emails and participants too. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)
- Did not hold: the Company-read-only role created and destroyed a message list (`POST /rest/messageLists`) and passed delete checks on messages, calendar events and timeline items. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)
- MCP `navigate_app` named unreadable opportunities; a non-Admin user minted an Admin key. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)
- Row-level rules (`upsertRowLevelPermissionPredicates`) fail with `ROW_LEVEL_PERMISSION_FEATURE_DISABLED` (needs enterprise key). Object and field limits are free. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)
- SSO (needs enterprise key): `createOIDCIdentityProvider` fails with a misleading 500 "reading headers" error. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)

## 4. Approval and audit

No "manual approval" step exists. A Form step pauses the run until a user answers; in the test the write waited. Agent record writes are never held for approval.

- Test: manual trigger, Form, Create Record. The company appeared only after `answerToolCall(input:{threadId, toolCallId:<formStepId>, response})` on `/graphql`; API keys cannot run or answer workflows. [test](PLATFORM-RESEARCH-FULL.md#test-approval-with-the-workflow-form-step-question-4)
- Paused run: `RUNNING`, step `PENDING` (no docs' "Waiting" status). No reject, timeout or assignee; `stopWorkflowRun` rejects. [test](PLATFORM-RESEARCH-FULL.md#test-approval-with-the-workflow-form-step-question-4)
- Did not hold: while the form waited, `updateWorkflowRunStep` rewrote the Create Record step, so any Workflows-permission user can change what an approval writes. Tampered step not run. [test](PLATFORM-RESEARCH-FULL.md#test-approval-with-the-workflow-form-step-question-4)
- Pausing tools stop the agent until a person answers; only `propose_email` holds back a write. Only chat and AI Agent steps with `canAskQuestions` (undocumented) get them. [source](../packages/twenty-server/src/engine/metadata-modules/ai/ai-agent-execution/pausing-tools/constants/pausing-tools.constant.ts#L14)
- A form cannot show an agent's proposal (static labels). Forms on non-manual triggers send no notification (docs). [source](../packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/form/form.workflow-action.ts#L45)
- No audit log: the record shows initiator `MANUAL`; the approver is only in the run conversation. A stop is logged as "User skipped the form", stopper unrecorded. [test](PLATFORM-RESEARCH-FULL.md#test-approval-with-the-workflow-form-step-question-4)
- Agent actions: chat and workflow-step tool calls are stored (section 6); MCP calls are not. [source](../packages/twenty-server/src/engine/metadata-modules/ai/ai-agent-execution/utils/mapUIMessagePartsToDBParts.ts#L79)
- MCP `execute_tool create_one_company`, then `SELECT "createdBySource","createdByName" FROM <schema>.company`: AGENT plus key name. [test](PLATFORM-RESEARCH-FULL.md#test-mcp-server-question-5)
- COMPLETED and FAILED runs are hard-deleted after 14 days or beyond 1000 per workflow (needs registered crons); STOPPED runs stay. [source](../packages/twenty-server/src/modules/workflow/workflow-runner/workflow-run-queue/constants/runs-to-clean-threshold.ts#L1)
- Audit logs: `eventLogs` fails with `CLICKHOUSE_NOT_CONFIGURED`; most tables also need an enterprise key. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)

## 5. MCP

Yes: `POST /mcp` is always on (no flag or plan gate) and MCP Inspector connected. It allows and denies like REST and GraphQL (the UI's API), with gaps below.

- `npx -y @modelcontextprotocol/inspector@2.9.0 --cli http://localhost:3000/mcp --transport http --header "Authorization: Bearer <key>" --method tools/list` [test](PLATFORM-RESEARCH-FULL.md#test-mcp-server-question-5)
- All callers get 7 meta tools (tools that list and call the real tools); the role-filtered catalog sits behind them or `?mode=direct`. [test](PLATFORM-RESEARCH-FULL.md#test-mcp-server-question-5)
- Auth: API key, user token or OAuth 2.1; docs' `/oauth/authorize` and client secret do not exist. [source](../packages/twenty-server/src/engine/core-modules/application/application-oauth/controllers/oauth-registration.controller.ts#L54)
- Limited-key denials show as "Tool not found" (HTTP 200). [test](PLATFORM-RESEARCH-FULL.md#test-mcp-server-question-5)
- Gaps: MCP hides `searchVector`; a read-only role keeps ~100 system-object write tools; object names are unfiltered. [test](PLATFORM-RESEARCH-FULL.md#test-mcp-server-question-5)

## 6. Observability and cost

Partly: Postgres keeps tokens and cost for workflow agent steps and chat threads; per-call events need ClickHouse; no OpenTelemetry tracing (AI spans go to Sentry if configured) or stored system prompt.

- Workflow AI step: `workflowRun.stepLogs` holds model, tokens, cost, tool calls, duration. [source](../packages/twenty-server/src/modules/workflow/workflow-executor/workflow-actions/ai-agent/utils/build-ai-agent-step-log.util.ts#L24)
- Chat: `agentChatThread` holds token and credit totals, `agentMessagePart` tool calls; no per-turn cost. [source](../packages/twenty-server/src/engine/metadata-modules/ai/ai-history/services/agent-history-workspace-storage.service.ts#L19)
- `runAgent` stores nothing; it returns `{result, error, success}`. [source](../packages/twenty-server/src/engine/metadata-modules/ai/ai-agent-execution/services/agent-run.service.ts#L147)
- Per-call usage events go only to ClickHouse (dropped here); the server console logs per-step cost. [source](../packages/twenty-server/src/engine/core-modules/usage/services/usage-recorder.service.ts#L69)
- Cost: tokens times catalog price (1 USD = 1,000,000 micro-credits). Without ClickHouse, spend limits fail open (not tested). [source](../packages/twenty-server/src/engine/core-modules/usage-limit/services/usage-limit-quota.service.ts#L512)

## 7. Extension points

| Need | Where it plugs in | Fork needed? |
|---|---|---|
| Custom objects, fields | `defineObject`, `defineField` | No [source](../packages/twenty-sdk/src/sdk/define/index.ts#L4) |
| App and agent roles | `defineApplicationRole`, `defineAgent` role | No; row-level needs enterprise key [source](../packages/twenty-server/src/engine/metadata-modules/row-level-permission-predicate/services/row-level-permission-predicate.service.ts#L559) |
| Event handlers, HTTP | logic function triggers | No; cannot block writes [source](../packages/twenty-shared/src/application/logicFunctionManifestType.ts#L11) |
| Tools in chat and MCP | `toolTriggerSettings` | No; no role gating [source](../packages/twenty-server/src/engine/core-modules/tool-provider/providers/logic-function-tool.provider.ts#L29) |
| Tools for the app's agent | none (agents load no app tools) | Yes [source](../packages/twenty-server/src/engine/metadata-modules/ai/ai-agent-execution/constants/workflow-agent-registry-tool-categories.const.ts#L3) |
| Approval step | Form step in an API-built workflow | New step or pausing tool: yes [source](../packages/twenty-server/src/modules/workflow/workflow-executor/factories/workflow-action.factory.ts#L56) |
| UI | front components in fixed slots | New widget types: yes [docs](https://docs.twenty.com/developers/extend/apps/layout/front-components) |
| Evals, cost per run | app calls `runAgent`, then stores and grades output itself; built-in grader: fixed 0-100 rubric | Custom graders: yes [source](../packages/twenty-server/src/engine/metadata-modules/ai/ai-agent-monitor/services/agent-turn-grader.service.ts#L83) |
| Model provider | env key or `AI_PROVIDERS` | New SDK package: yes [source](../packages/twenty-shared/src/ai/constants/ai-sdk-packages.const.ts#L1) |

Unstable: skills and agents, `twenty-ui` (alpha); front components (in development); timeline types (beta); `twenty pull` (experimental); workflows moving to core tables (flag `IS_WORKFLOW_CORE_INDEX_PAGE_ENABLED`); chat storage moved in 2.42-2.44; `canAskQuestions`, `answerToolCall` (new in 2.44); five releases in 16 days; live docs ahead of tag. [docs](https://docs.twenty.com/developers/extend/apps/logic/skills-and-agents) [source](https://github.com/twentyhq/twenty/releases/tag/twenty/v2.44.0)

## Not tested or unclear

- Anything needing a model: AI chat, `runAgent`, agent data access, the AI approval chain (validated draft only), evals, token and cost logs. Steps to run them later are in the long version. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)
- Not built: custom objects, fields (the template has none) or an app AI tool; those claims are docs and source only. [test](PLATFORM-RESEARCH-FULL.md#test-hello-world-app-question-1)
- Claude Desktop (only MCP Inspector used). [test](PLATFORM-RESEARCH-FULL.md#test-mcp-server-question-5)
- Manifest row-level rules without entitlement: docs say unenforced; source suggests enforced. [source](../packages/twenty-server/src/engine/twenty-orm/utils/resolve-row-level-permission-record-filter.util.ts#L22)
- Unknown: whether crons are registered here (run cleanup, cron triggers); ClickHouse-only behaviour; whether the approver's or initiator's role governs the write (one user did both). [test](PLATFORM-RESEARCH-FULL.md#test-approval-with-the-workflow-form-step-question-4)

## Test leftovers

- PN-prefixed roles, keys, agents, app, workflows and companies; ids and removal steps: "Created during the test" under each test in the long version. [test](PLATFORM-RESEARCH-FULL.md#test-limited-role-for-an-api-key-and-an-agent-question-3)
- Three keys are Admin-role and live until 2026-10-10, 2026-12-31, 2027-12-31. Revoke first: `revokeApiKey` (user session). [test](PLATFORM-RESEARCH-FULL.md#test-approval-with-the-workflow-form-step-question-4)
- Outside the repo: `~/.twenty/config.json`, three `~/.npm/_npx` caches, `~/.yarn/berry/cache` growth, `$TMPDIR/logic-function-executor-tmpdir`, playground token files. Inside: `packages/twenty-server/.local-storage/`. The app registration row survives `app:uninstall`. [test](PLATFORM-RESEARCH-FULL.md#test-hello-world-app-question-1)
