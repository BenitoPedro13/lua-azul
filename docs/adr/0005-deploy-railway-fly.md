# ADR-0005 — Deploy to Railway / Fly.io

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** project owner

## Context

A Discord bot is a **long-running process holding a persistent WebSocket** — not a
request/response workload. That rules out serverless/edge (no stable long-lived
connection) and favors a platform that runs a container 24/7. We're a solo dev who wants
push-to-deploy and a managed database, not a box to patch.

We also need somewhere to run **Lavalink** alongside the bot.

## Decision

Deploy to a **container PaaS — Railway or Fly.io** — using the **bot's multi-stage
Dockerfile** ([`apps/bot/Dockerfile`]).

- **Bot:** built from the Dockerfile; container start runs `prisma migrate deploy` then
  boots. Restart-on-crash is the platform's job.
- **Postgres:** the platform's **managed addon**; `DATABASE_URL` injected as an env var.
- **Lavalink:** run as a second service/container from the official image with the same
  `application.yml`. (On Fly, a separate app/process; on Railway, a second service.)
- **Commands:** deployed **globally** in prod (no `DISCORD_DEV_GUILD_ID`), per
  [ADR-0010](./0010-command-deployment-and-intents.md).
- Secrets (`DISCORD_TOKEN`, Spotify creds, `LAVALINK_PASSWORD`) live in the platform's
  secret store, never in the image.

Railway vs Fly is left open — the Dockerfile is portable, so the choice is a deploy-time
detail, not an architectural commitment.

## Consequences

**Positive**
- Push-to-deploy; managed Postgres; secrets management included.
- Same Docker image is reproducible and portable between the two (and to a VPS later).
- Minimal ops for a solo maintainer.

**Negative / accepted**
- PaaS costs more than a self-managed VPS at scale — fine at personal scale.
- Lavalink as a second service needs internal networking config (private hostname/port).
- Cold deploys briefly disconnect the gateway — acceptable; discord.js resumes.

## Alternatives considered

- **Self-managed VPS + docker-compose** — cheapest, most control, most ops (updates,
  backups, monitoring). Rejected for now; the portable Dockerfile keeps it as a future
  option without a rewrite.
- **Serverless / edge functions** — fundamentally incompatible with a persistent gateway
  connection. Rejected.
- **Bare-metal / k8s** — massive overkill at this scale.
