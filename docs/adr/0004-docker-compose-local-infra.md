# ADR-0004 — Docker Compose for local infrastructure

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** project owner

## Context

The bot depends on two stateful services that are annoying to install and run by hand:

- **Lavalink** — a standalone **Java** server (plus plugins for YouTube/Spotify/SoundCloud).
  Nobody wants to manage a JVM, a `application.yml`, and plugin jars manually.
- **Postgres** — needs a running server with a known user/db.

We want a one-command local environment, reproducible across machines, that doesn't
pollute the host with global installs.

## Decision

A **`docker-compose.yml`** at the repo root runs **Postgres + Lavalink** as containers.
The **bot itself runs on the host** via `pnpm dev` (tsx watch) for fast reloads — it is
*not* containerized in dev.

- Lavalink config is bind-mounted from `infra/lavalink/application.yml`; Spotify creds
  pass through from the host env.
- Postgres data persists in a named volume; healthchecks gate readiness.
- Connection details in `docker-compose.yml` match the defaults in `.env.example`, so a
  fresh clone works after `cp .env.example .env` + `pnpm infra:up`.

Production containerizes the bot too (see [ADR-0005](./0005-deploy-railway-fly.md)); compose is a *dev* tool here.

## Consequences

**Positive**
- `pnpm infra:up` → full local stack; no JVM/Postgres on the host.
- Same Lavalink version locally and in prod.
- Bot stays on the host in dev → instant TS reloads, easy debugging.

**Negative / accepted**
- Requires Docker installed locally.
- Lavalink pulls plugin jars on first boot (one-time network cost).
- Two "modes" (host bot in dev, container bot in prod) — documented in architecture §8.

## Alternatives considered

- **Everything in compose, including the bot** — slower dev loop (rebuild/restart on every
  change). Rejected for dev; it *is* the prod model.
- **Hosted Lavalink (public node)** — unreliable, rate-limited, privacy concerns. Rejected.
- **Native installs** — fragile, machine-specific, defeats reproducibility.
