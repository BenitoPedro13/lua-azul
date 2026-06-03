# Lua Azul — Architecture

> Status: living document · Last updated 2026-06-03
>
> This is the high-level map. Individual decisions (and *why* we made them) live as
> numbered records in [`docs/adr/`](./adr/). When something here needs justification,
> it links to an ADR.

## 1. What we're building

Lua Azul is a multipurpose Discord bot with three feature areas:

- **Music** — play from Spotify / SoundCloud / YouTube into voice channels, with a
  queue, skip/stop/volume controls.
- **Logging** — an audit trail of server events (message deletes/edits, member
  joins/leaves) posted to a configured channel and persisted to the database.
- **Engagement** — lightweight commands and activity tracking (counters, tags, etc.).

Target scale is **personal / a handful of guilds**. That single fact drives a lot of
the design: no sharding, single process, optimize for development speed over
horizontal scale. The architecture is chosen so that growth *later* is possible
without a rewrite, but we do not pay for that scale now. See [ADR-0001](./adr/0001-modular-monolith-over-microservices.md).

## 2. Shape of the system

```
                       ┌──────────────────────────────────────────┐
                       │              Discord Gateway              │
                       │   (one WebSocket: events + interactions)  │
                       └───────────────┬──────────────────────────┘
                                       │  intents-filtered events
                                       │  slash-command interactions
                                       ▼
   ┌───────────────────────────────────────────────────────────────────────┐
   │                       Lua Azul bot process (Node)                       │
   │                                                                         │
   │   client.ts ── discord.js Client (intents, partials)                    │
   │        │                                                                │
   │        ▼                                                                │
   │   core/ ── command + event loader, interaction router                   │
   │        │                                                                │
   │        ├── modules/music       ──┐                                      │
   │        ├── modules/logging       │  each module = commands + events     │
   │        └── modules/engagement  ──┘  + optional init()                   │
   │                                                                         │
   │   lib/logger (pino)     lib/db (Prisma client)                          │
   └──────────┬───────────────────────────┬───────────────────┬─────────────┘
              │ voice nodes (REST + WS)    │ SQL                │ raw voice
              ▼                            ▼                    ▼  payload fwd
        ┌───────────┐               ┌───────────┐      (VOICE_STATE_UPDATE /
        │  Lavalink │               │ Postgres  │       VOICE_SERVER_UPDATE
        │  (Java)   │               │           │       back to the gateway)
        └───────────┘               └───────────┘
```

Three external dependencies: **Discord** (gateway + REST), **Lavalink** (audio), and
**Postgres** (state). Lavalink is a separate Java server we never write — we only talk
to it over `lavalink-client`. It joins voice channels on our behalf; the bot forwards
Discord's raw voice payloads to it. See [ADR-0009](./adr/0009-music-via-lavalink.md).

## 3. Why interactions over the gateway (not an HTTP endpoint)

Discord lets an app receive interactions two ways: a public HTTPS webhook, or over the
gateway WebSocket. discord.js uses the **gateway**, so we need **no public endpoint, no
ngrok, no inbound port** — the same connection that delivers events delivers slash
commands. This is the right fit for a bot (vs. a serverless/webhook app) and removes an
entire class of infrastructure. See [ADR-0008](./adr/0008-gateway-interactions-not-http.md).

## 4. Gateway intents (least privilege)

Intents are a bitfield declared at connect time; Discord only sends events we opt into.
We request exactly what the features need:

| Intent                | Privileged? | Needed for                                  |
|-----------------------|-------------|---------------------------------------------|
| `Guilds`              | no          | baseline — guild/channel/role caches        |
| `GuildVoiceStates`    | no          | music: knowing who's in which voice channel |
| `GuildMessages`       | no          | logging: message delete/edit events         |
| `GuildMembers`        | **yes**     | logging: member join/leave                  |
| `MessageContent`      | **yes**     | logging deleted message *content*, prefixless parsing |

Privileged intents (`GuildMembers`, `MessageContent`) must be toggled on in the
Developer Portal, and require approval once a bot is in 100+ guilds. We keep the set
minimal and gate privileged ones behind the logging module so a music-only deployment
needn't enable them. See [ADR-0010](./adr/0010-command-deployment-and-intents.md).

## 5. Module architecture

A **module** is a self-contained feature folder exposing a manifest:

```ts
interface BotModule {
  name: string;
  commands?: Command[];   // slash commands this module owns
  events?: Event[];       // gateway event handlers
  init?: (ctx) => Promise<void>;  // one-time setup (e.g. connect Lavalink)
}
```

The `core/` loader collects every module's commands into one registry and wires its
events to the client. Adding a feature = adding a folder; nothing else changes. This is
the seam that would let us extract a module into its own service one day — but per
[ADR-0001](./adr/0001-modular-monolith-over-microservices.md) we don't, and won't until there's a concrete reason. See
[ADR-0007](./adr/0007-module-command-event-architecture.md).

### Command lifecycle

1. **Author** a command (discord.js `SlashCommandBuilder` + `execute`).
2. **Deploy** its definition to Discord via the REST API (`deploy-commands.ts`):
   - dev → one guild (`DISCORD_DEV_GUILD_ID`), updates **instantly**.
   - prod → global, propagates in up to **~1 hour**.
3. **Handle** at runtime: an `interactionCreate` listener routes to the matching command.

Deploying (registering definitions) and handling (responding at runtime) are separate
concerns — see [ADR-0010](./adr/0010-command-deployment-and-intents.md).

## 6. Persistence

Postgres via Prisma. The schema starts small and per-guild:

- `Guild` / `GuildConfig` — module toggles, DJ role, log channel, volume defaults.
- `AuditLog` — persisted server events (type, actor, channel, JSON payload).
- `EngagementCounter` — example per-user activity tally.

Prisma gives us type-safe queries and migrations, which matters most once a dashboard
shares these types. See [ADR-0003](./adr/0003-postgres-prisma.md).

## 7. Configuration

All config is environment variables, **validated by Zod at boot** (`config/env.ts`). A
missing or malformed value crashes the process immediately with a clear message rather
than failing deep in a handler later. `.env.example` is the source of truth for what's
required. See [ADR-0006](./adr/0006-typed-config-zod-env.md).

## 8. Local development vs. production

| | Local dev | Production |
|---|---|---|
| Bot process | `pnpm dev` on host (tsx watch) | Docker image on Railway/Fly |
| Postgres | docker-compose | managed addon |
| Lavalink | docker-compose | docker-compose / sidecar |
| Commands | guild (instant) | global |
| Logs | pino-pretty | pino JSON |

`docker compose up` gives Postgres + Lavalink locally; the bot runs on the host for fast
reloads. See [ADR-0004](./adr/0004-docker-compose-local-infra.md) and [ADR-0005](./adr/0005-deploy-railway-fly.md).

## 9. Observability & failure posture

- **Logging:** structured logs via pino (JSON in prod, pretty in dev). This is *app*
  logging — distinct from the bot's *audit-logging feature*. See [ADR-0002 note] and
  the logging module.
- **Fail fast on config**, fail soft at runtime: a thrown command handler replies with
  an error embed, never crashes the process.
- **Reconnects** are handled by discord.js (resume/identify) and lavalink-client
  (node reconnect) — we don't hand-roll the gateway lifecycle.

## 10. Explicit non-goals (for now)

- No microservices, no message bus.
- No sharding (irrelevant below 2,500 guilds).
- No web dashboard yet — but the monorepo + Prisma types are arranged so it slots in.
- No multi-region / HA.

These are revisited only when a concrete need appears, and each reversal gets its own ADR.
