# Lua Azul — Build Roadmap

> Status: living document · Last updated 2026-06-03
>
> Phased so that **every phase ends with something runnable**. Don't start a phase
> until the previous one boots and behaves. Architecture rationale lives in
> [`docs/adr/`](./adr/); this is the *order of operations*.

## Phase 0 — Foundation (boots and logs in)

Goal: `pnpm dev` connects to Discord and prints "ready".

- [ ] pnpm workspace + tsconfig base, `apps/bot` package.
- [ ] `config/env.ts` — Zod-validated env, fails fast. ([ADR-0006](./adr/0006-typed-config-zod-env.md))
- [ ] `lib/logger.ts` — pino (pretty in dev).
- [ ] `lib/db.ts` — Prisma client singleton.
- [ ] `prisma/schema.prisma` + first migration. ([ADR-0003](./adr/0003-postgres-prisma.md))
- [ ] `docker-compose.yml` — Postgres + Lavalink. ([ADR-0004](./adr/0004-docker-compose-local-infra.md))
- [ ] `client.ts` + `index.ts` — minimal client with intents, logs in.

**Done when:** bot shows online in a test server.

## Phase 1 — Command/event framework + `/ping`

Goal: the module loader works end-to-end with one trivial command.

- [ ] `core/` contracts: `Command`, `Event`, `BotModule`. ([ADR-0007](./adr/0007-module-command-event-architecture.md))
- [ ] Loader: collect module commands → registry; wire events.
- [ ] `interactionCreate` router with per-command error handling.
- [ ] `deploy-commands.ts` — guild deploy in dev, global in prod. ([ADR-0010](./adr/0010-command-deployment-and-intents.md))
- [ ] `/ping` in a `core`/`misc` module.

**Done when:** `/ping` replies in the dev guild, registered instantly.

## Phase 2 — Music module ✅ (core complete)

Goal: play audio in a voice channel from the three providers.

- [x] Lavalink wiring via `lavalink-client`; forward raw voice payloads. ([ADR-0009](./adr/0009-music-via-lavalink.md))
- [x] `infra/lavalink/application.yml` — YouTube + LavaSrc (Spotify) + SoundCloud.
- [x] Commands: `/play`, `/skip`, `/queue`, `/stop`, `/volume`, `/nowplaying`.
- [x] Per-guild config: default volume read on player create, persisted by `/volume`.
- [x] Node/track event logging; empty-queue auto-leave after 60s (`onEmptyQueue`).
- [ ] Remaining polish: DJ-role gating, `maxQueueSize` enforcement, pause/resume,
      shuffle/loop, autocomplete on `/play`.

**Done when:** `/play <spotify|yt|soundcloud link or search>` plays and queues. ✅

## Phase 3 — Logging module ✅

Goal: server events → audit channel + DB.

- [x] `/logging setup` (gated by `ManageGuild`) + `status` / `disable` / `toggle`
      subcommands. ([ADR-0010](./adr/0010-command-deployment-and-intents.md))
- [x] Event handlers: `messageDelete`, `messageUpdate`, `guildMemberAdd`,
      `guildMemberRemove`. (Privileged intents enabled — see architecture §4.)
- [x] Persist to `AuditLog`; post an embed to the configured channel via `dispatchLog`.
- [x] Partial-structures handling (uncached deletes, partial edits fetched).

**Done when:** deleting a message logs an embed + a DB row in configured guilds. ✅

## Phase 4 — Engagement

Goal: lightweight activity features.

- [ ] `EngagementCounter` increment on messages.
- [ ] Commands: `/rank`, `/tags`, etc. (scope TBD)

## Phase 5 — Dashboard (deferred)

Only when the above is solid. Adds `apps/web` (React/Tailwind) consuming
`packages/shared` Zod types. ([ADR-0002](./adr/0002-monorepo-pnpm-workspaces.md))

- [ ] `packages/shared` promoted from stub → real shared schemas.
- [ ] Read-only views first (queue, logs), then config writes.

---

### Definition of "ready to start"

Phases 0–1 are the minimum to call the repo *started*: a typed, configured,
logging-in bot with a working command framework. Everything after is feature work
on a stable spine.
