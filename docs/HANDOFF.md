# Handoff: continue this project on another machine

Written 2026-10-06 on the Mac. Read this first when you open the project anywhere new. If you use Claude Code, start it in the repo folder and say: "Read docs/HANDOFF.md and continue from there."

Update 2026-10-06: the Windows local setup was dropped. Development now happens in Claude Code cloud sessions on branch `local-dev`. The fork was renamed to `oguz-kara/real-estate-crm`. Cloud containers are ephemeral: commit and push anything worth keeping before the session ends. When cloning, fetch only `local-dev` (full history is ~2 GB).

## What this project is

- A fork of Twenty CRM (`twentyhq/twenty`), based on tag `twenty/v2.44.0`, on branch `local-dev`.
- Two goals: a portfolio project that shows full-stack and AI skills, and a CRM for the owner's wife's company (customers and leads). It is not a commercial product.
- Plan: build a vertical extension with Twenty's app platform and AI layer (custom objects, custom agent tools, an approval step, its own evals), and change core code only where the app platform cannot do the job.

## Decisions already made

- Keep the full source (a fork), not only `create-twenty-app`.
- Do not build on files marked `/* @license Enterprise */` (billing, SSO, row-level permissions, record sharing).
- Twenty requires Yarn 4; do not use pnpm or npm in this repo.
- Keep explanations short and in plain language.

- The fork stays public. There will be no pull requests to Twenty; the work is only for the owner's own business domain.
- Secrets and real customer data never go into git.

## How the owner likes to work (for Claude)

- Answer in the language the owner writes in (Turkish or English). Keep answers short, plain and decision-first; no long option lists.
- The owner is on a usage-limited plan. Before any multi-agent or long high-effort run, say roughly what it will cost and prefer the cheapest approach. Save results to `docs/` as they are produced.
- Ask before installing system-level tools or changing global versions.
- For their own projects the owner uses pnpm; this repo is the exception because Twenty requires Yarn 4.

## Where the code lives

- GitHub: `https://github.com/oguz-kara/real-estate-crm` (public fork of Twenty, renamed). Work branch: `local-dev`. The default branch `main` is Twenty's own code.
- Clone with: `git clone --depth 1 --single-branch --branch local-dev https://github.com/oguz-kara/real-estate-crm.git`
- After cloning, add Twenty's repo for updates: `git remote add upstream https://github.com/twentyhq/twenty.git`

## What was learned the hard way

- An app's custom tools show up in AI chat and MCP, but workflow AI Agent steps and `runAgent` do not load them. Plan custom agent tools around that (see `docs/PLATFORM-NOTES.md`, sections 2 and 7).
- AI chat uses the logged-in user's role and ignores a role assigned to an agent.
- There is no "manual approval" step. Use the workflow Form step as the approval gate; it has no reject button and no timeout.
- API keys cannot run or answer workflows, and cannot create other API keys. Those need a user session token (login mutations are on `/metadata`).
- `create-twenty-app` opens a browser and runs `corepack enable` on its own. Pin it to the server's version (`create-twenty-app@2.44.0`) and add the remote first with `twenty remote:add --url <server> --api-key <key>`.
- The first page load after `npx nx start` takes about a minute, and the backend restarts once while shared code rebuilds.
- The hello-world test app is not in this repo. It lived in a scratch folder on the Mac; recreate it with the commands in section 1 of the short note.

## What is already done

- `LOCAL-SETUP.md` (repo root): how it was set up and started on the Mac. The ports there (5433, 6380, 3002) were chosen only because the Mac had other projects running. On a clean machine use the default ports from the official docs.
- `docs/PLATFORM-NOTES.md`: short note on what the platform supports, where permissions leak, and what needs a fork. Read it before proposing features.
- `docs/PLATFORM-RESEARCH-FULL.md` and `docs/research-raw/`: every finding and every test step behind the short note.

## Not done yet

- Nothing that calls an LLM was tested (no provider key was set). To enable AI, put `ANTHROPIC_API_KEY=` or `OPENAI_API_KEY=` in `packages/twenty-server/.env` and restart the server and worker. The steps for the AI tests are in the long version.
- No feature work has started. Suggested first step: list the first five features for the wife's company and sort each into "an app can do this" or "needs a core change".

## Setting up in a Claude Code cloud session

The container ships Node 22 but the repo needs `^24.5.0`, so install Node 24 first. From the repo root:

1. `curl -fsSL -o /tmp/node24.tar.xz https://nodejs.org/dist/v24.16.0/node-v24.16.0-linux-x64.tar.xz && tar -xf /tmp/node24.tar.xz -C /opt && export PATH=/opt/node-v24.16.0-linux-x64/bin:$PATH`
2. `bash packages/twenty-utils/setup-dev-env.sh` (starts local Postgres 16 and Redis, creates databases and `.env` files on the default ports)
3. `yarn` (about 10 minutes), then `npx nx database:init twenty-server` if the script said so
4. `yarn start` — backend on :3000, frontend on :3001

To avoid repeating this every session, put steps 1-3 in the cloud environment's Setup script (environment menu in the session title bar, then Edit).

## Setting up on Windows (dropped, kept for reference)

The official docs support Windows only through WSL (Ubuntu inside Windows). See `packages/twenty-docs/developers/contribute/capabilities/local-setup.mdx`, tab "Windows (WSL)".

1. In PowerShell as Administrator: `wsl --install`, then restart.
2. Do everything else inside the WSL terminal, and clone the repo inside the WSL file system (for example `~/projects/twenty`), not under `/mnt/c`.
3. Install Node `^24.5.0` (the repo's `.nvmrc` pins a 24.x version) with nvm, then `corepack enable`.
4. Postgres 16 and Redis: install them inside WSL, or use Docker Desktop with WSL2 integration and run `make -C packages/twenty-docker postgres-on-docker` and `redis-on-docker`.
5. `cp packages/twenty-front/.env.example packages/twenty-front/.env` and the same for `packages/twenty-server`. The `.env` files are not in git, so they do not come with the clone.
6. `yarn`, then `npx nx database:reset twenty-server`, then `npx nx start`.
7. Open http://localhost:3001 and log in with `tim@apple.dev` / `tim@apple.dev`.

The database does not travel with the repo. The Windows machine starts with fresh seed data, so the test leftovers on the Mac (PN-prefixed roles, keys, app, workflows) will not exist there.

## Keeping up with Twenty

- Remote `upstream` points at `https://github.com/twentyhq/twenty.git`; `origin` is the fork.
- Pull Twenty's changes every few weeks: `git fetch upstream --tags`, then merge the newest `twenty/vX.Y.Z` release tag into `local-dev`.
- Twenty's own CI rejects commits with AI co-author trailers. That only matters if you send a pull request to Twenty.
