# Twenty CRM — Local Developer Setup

Set up on 2026-10-03 on macOS 14.6.1 (Apple Silicon, 8 GB RAM), following
https://docs.twenty.com/developers/local-setup and the repository at the tag below.

## Version

| | |
|---|---|
| Tag | `twenty/v2.44.0` (latest published GitHub release, 2026-10-01) |
| Commit | `f7a4720e` |
| Local branch | `local-dev` (created from the tag) |
| Clone type | shallow (`--depth 1`). Run `git fetch --unshallow` for full history |

Note: since the 2.x releases, tags are named `twenty/vX.Y.Z` (the SDK has separate `sdk/vX.Y.Z` tags).
The `twenty/v2.45.x` tags existed at install time, but none had a published release yet.

## What was installed

| Item | How | Notes |
|---|---|---|
| Node | already present: v24.18.0 via nvm | Repo requires `^24.5.0`; `.nvmrc` pins `24.16.0`. Kept 24.18.0 |
| Yarn 4.13.0 | `corepack enable yarn` | Only the yarn shim was enabled; pnpm is untouched. The repo runs its own `.yarn/releases/yarn-4.13.0.cjs` |
| JS dependencies | `yarn` at repo root | ~4.3 GB `node_modules`. "build scripts have been disabled" warnings are expected (`enableScripts: false` in `.yarnrc.yml`) |
| Postgres 16 | Docker container `twenty_pg`, volume `twenty_db_data` | Same as `make -C packages/twenty-docker postgres-on-docker`, but host port **5433** |
| Redis | Docker container `twenty_redis` (`redis/redis-stack-server:latest`) | Same as `make … redis-on-docker`, but host port **6380** |
| Database | `npx nx database:reset twenty-server` | Creates schema and seeds demo workspaces **Apple** and **YCombinator** |

Both containers are on the Docker network `twenty_network`.

## Ports

| Port | Service |
|---|---|
| 3000 | Backend (NestJS): http://localhost:3000, GraphQL `/graphql`, REST `/rest`, health `/healthz` |
| **3002** | Frontend (Vite): http://localhost:3002 |
| **5433** | Postgres (`twenty_pg`, user/password `postgres`/`postgres`, DBs `default` and `test`) |
| **6380** | Redis (`twenty_redis`) |

## .env files

- `packages/twenty-server/.env` (copied from `.env.example`). Changed lines:
  - `PG_DATABASE_URL=postgres://postgres:postgres@localhost:5433/default`
  - `REDIS_URL=redis://localhost:6380`
  - `FRONTEND_URL=http://localhost:3002`
  - `APP_SECRET=<random, generated with openssl>`
- `packages/twenty-front/.env` (copied from `.env.example`). Changed lines:
  - `REACT_APP_PORT=3002` (uncommented)

Both files are git-ignored.

## Start

```bash
cd ~/projects/twenty            # /Users/bussss/projects/twenty
docker start twenty_pg twenty_redis
npx nx start                    # backend + worker + frontend (watch mode)
```

Or as separate processes, in separate terminals:

```bash
npx nx start twenty-server
npx nx worker twenty-server
npx nx start twenty-front
```

Then open http://localhost:3002 and log in with `tim@apple.dev` / `tim@apple.dev`.

## Stop

```bash
# Ctrl+C in the terminal running `npx nx start`
docker stop twenty_pg twenty_redis
```

## Reset the database (wipes all data, re-seeds)

```bash
npx nx database:reset twenty-server
```

## Verification done

- Backend `/healthz` returned 200; frontend served on :3002.
- Logged in as `tim@apple.dev` into the **Apple** workspace.
- Created the company **"Local Setup Test Co"** from the Companies page. It appeared in the list
  (599 → 600) and exists in Postgres (`workspace_1wgvd1injqtife6y4rvfbu3h5.company`).

## Deviations from the docs and warnings

1. **Non-default ports (5433, 6380, 3002).** Another project's containers already used 5432 and 6379,
   and a dev server used 3001. Only the documented env variables were changed; there were no code changes.
   If you switch back to default ports, update the four lines above.
2. **Postgres and Redis run in Docker**, which the docs list as the alternative to the preferred brew install.
3. **Workspace creation:** the default single-workspace mode uses the seeded Apple workspace, so there is
   no "create workspace" flow. To create additional workspaces, enable `IS_MULTIWORKSPACE_ENABLED=true`
   in the server `.env` (see the docs' *Multi-Workspace Mode* section; it requires subdomain setup).
   The server logs "2 workspaces found in database…" because the seed creates Apple and YCombinator. This is expected.
4. **First load is slow** (~1 min): Vite compiles on demand. During the first ~2 min after `nx start`,
   you may briefly see "Backend unreachable" and Vite errors like `Failed to resolve import "twenty-shared/ai"`.
   That happens because `twenty-shared` rebuilds in watch mode and the backend restarts once. Both clear up on their own.
5. **Console errors** for 404s from `twenty-icons.com` are missing logos for some seed companies. They are harmless.
6. **Disk space:** about 9 GB free after setup (the disk is about 96% full). Twenty uses ~4.3 GB `node_modules`,
   ~560 MB source, and ~1.4 GB Docker images.
7. **RAM:** 8 GB is enough, but the full dev stack (Vite + Nest + worker) is heavy. Close other dev servers if things slow down.
8. **Repo extras not in the docs** (from the repo's `CLAUDE.md`):
   - `yarn start` runs the same stack as `npx nx start` and starts the worker after :3000 is up. Either works.
   - **Do not use `bash packages/twenty-utils/setup-dev-env.sh` with this setup.** Ports 5432 and 6379 are
     hard-coded in it, so it would find another project's Postgres and Redis on those ports instead of `twenty_pg`/`twenty_redis`.
   - `.mcp.json` defines a read-only Postgres MCP server. It reads `PG_DATABASE_URL` from the server `.env`, so it already uses port 5433.
   - The repo's CI rejects commits that contain AI co-author or "Generated with Claude Code" trailers.
