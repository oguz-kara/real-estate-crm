# Handoff: continue this project on another machine

Written 2026-10-06 on the Mac. Read this first when you open the project on the Windows machine. If you use Claude Code there, start it in the repo folder and say: "Read docs/HANDOFF.md and continue from there."

## What this project is

- A fork of Twenty CRM (`twentyhq/twenty`), based on tag `twenty/v2.44.0`, on branch `local-dev`.
- Two goals: a portfolio project that shows full-stack and AI skills, and a CRM for the owner's wife's company (customers and leads). It is not a commercial product.
- Plan: build a vertical extension with Twenty's app platform and AI layer (custom objects, custom agent tools, an approval step, its own evals), and change core code only where the app platform cannot do the job.

## Decisions already made

- Keep the full source (a fork), not only `create-twenty-app`.
- Do not build on files marked `/* @license Enterprise */` (billing, SSO, row-level permissions, record sharing).
- Twenty requires Yarn 4; do not use pnpm or npm in this repo.
- Keep explanations short and in plain language.

## What is already done

- `LOCAL-SETUP.md` (repo root): how it was set up and started on the Mac. The ports there (5433, 6380, 3002) were chosen only because the Mac had other projects running. On a clean machine use the default ports from the official docs.
- `docs/PLATFORM-NOTES.md`: short note on what the platform supports, where permissions leak, and what needs a fork. Read it before proposing features.
- `docs/PLATFORM-RESEARCH-FULL.md` and `docs/research-raw/`: every finding and every test step behind the short note.

## Not done yet

- Nothing that calls an LLM was tested (no provider key was set). To enable AI, put `ANTHROPIC_API_KEY=` or `OPENAI_API_KEY=` in `packages/twenty-server/.env` and restart the server and worker. The steps for the AI tests are in the long version.
- No feature work has started. Suggested first step: list the first five features for the wife's company and sort each into "an app can do this" or "needs a core change".

## Setting up on Windows

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
