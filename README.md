# Lua Azul

A multipurpose Discord bot: **music** (Spotify/SoundCloud/YouTube), **logging**, and
**content engagement**. Built with TypeScript, discord.js, Lavalink, and Postgres.

> **Design docs:** [`docs/architecture.md`](./docs/architecture.md) ·
> [`docs/ROADMAP.md`](./docs/ROADMAP.md) · [Architecture Decision Records](./docs/adr/)

## Stack

| Concern            | Choice                                   | Why |
|--------------------|------------------------------------------|-----|
| Runtime topology   | Modular monolith                         | [ADR-0001](./docs/adr/0001-modular-monolith-over-microservices.md) |
| Repo layout        | pnpm monorepo (bot-first)                | [ADR-0002](./docs/adr/0002-monorepo-pnpm-workspaces.md) |
| Database           | Postgres + Prisma                        | [ADR-0003](./docs/adr/0003-postgres-prisma.md) |
| Audio              | Lavalink via `lavalink-client`           | [ADR-0009](./docs/adr/0009-music-via-lavalink.md) |
| Deploy             | Railway / Fly.io (Docker)                | [ADR-0005](./docs/adr/0005-deploy-railway-fly.md) |

## Repository layout

```
apps/bot          # the bot (the only deployable today)
packages/shared   # stub — shared types for a future dashboard (ADR-0002)
infra/lavalink    # Lavalink configuration
docs/             # architecture, roadmap, ADRs
docker-compose.yml
```

## Prerequisites

- **Node ≥ 20** and **pnpm** (`corepack enable` ships it with Node).
- **Docker** (for local Postgres + Lavalink).
- A Discord application + bot token — https://discord.com/developers/applications.

## Quickstart

```bash
# 1. Install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env          # then fill in DISCORD_TOKEN + DISCORD_CLIENT_ID
                              # set DISCORD_DEV_GUILD_ID to your test server for instant commands

# 3. Start local infrastructure (Postgres + Lavalink)
pnpm infra:up

# 4. Set up the database
pnpm db:migrate               # creates tables + generates the Prisma client

# 5. Register slash commands (to your dev guild — instant)
pnpm deploy:commands

# 6. Run the bot (hot reload)
pnpm dev
```

You should see a `ready` log line, the bot online in your server, and `/ping` working.

## Common scripts

| Command            | What it does |
|--------------------|--------------|
| `pnpm dev`         | Run the bot with hot reload (tsx watch) |
| `pnpm deploy:commands` | Register slash commands (guild in dev, global in prod) — [ADR-0010](./docs/adr/0010-command-deployment-and-intents.md). Named to avoid pnpm's built-in `deploy`. |
| `pnpm typecheck`   | Type-check all packages |
| `pnpm build`       | Generate Prisma client + compile to `dist/` |
| `pnpm db:migrate`  | Create/apply a dev migration + regenerate the client |
| `pnpm db:studio`   | Open Prisma Studio |
| `pnpm infra:up`    | Start Postgres + Lavalink |
| `pnpm infra:down`  | Stop them |

## A note on intents

`/ping` and music only need non-privileged intents, so the bot logs in out of the box.
The **logging** module (Phase 3) needs the **privileged** `GuildMembers` and
`MessageContent` intents — enable them in the Developer Portal *and* uncomment them in
[`apps/bot/src/client.ts`](./apps/bot/src/client.ts) when you build that module.

## Current status

Phases 0–3 complete: typed config, structured logging, DB client, the
module/command/event framework, `/ping`, the **music** module (`/play /skip /stop
/queue /nowplaying /volume` over Lavalink — YouTube/SoundCloud), and the **logging**
module (`/logging` + audit events → channel & `AuditLog` table). Next up: **engagement**
(Phase 4). See [`docs/ROADMAP.md`](./docs/ROADMAP.md).
