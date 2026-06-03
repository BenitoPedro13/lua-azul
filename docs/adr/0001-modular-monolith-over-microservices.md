# ADR-0001 — Modular monolith over microservices

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** project owner

## Context

The bot has three feature areas (music, logging, engagement) that *feel* separable, and
"microservices" is a tempting default. But a Discord bot has a defining constraint: it
is built around **one stateful WebSocket connection to the Discord gateway**. That
connection carries every event and every slash-command interaction, and discord.js holds
in-memory caches (guilds, channels, voice states) keyed to it.

Splitting features into separate services would mean either:

- replicating the gateway connection per service (Discord rate-limits identifies and,
  past 2,500 guilds, requires coordinated sharding — needless complexity at our scale), or
- running one "gateway service" that proxies events to feature services over a message
  bus — which adds a broker, network hops, serialization, partial-failure handling, and
  distributed state, all to serve a bot that targets **a handful of guilds**.

Target scale is personal/small. There is no scaling pressure that microservices would
relieve.

## Decision

Build a **modular monolith**: a single Node process, with features as **internal modules**
that have clean boundaries (each owns its commands, events, and setup) but share one
process, one client, one database connection.

The module seam (see [ADR-0007](./0007-module-command-event-architecture.md)) is drawn so that *if* a feature ever
genuinely needs to be its own service, it can be extracted — but that is a future ADR,
not a thing we build toward now (YAGNI).

## Consequences

**Positive**
- One thing to run, deploy, debug, and reason about.
- Shared in-memory caches and DB connection — no cross-service chatter.
- Fastest path to shipping; matches a solo TypeScript developer's strengths.

**Negative / accepted**
- A crash takes down all features (mitigated: fail-soft handlers, process restart on
  Railway/Fly).
- All features scale together (irrelevant at target scale).
- Discipline required to keep module boundaries clean without a network forcing them.

## Alternatives considered

- **Microservices + message bus** — rejected: enormous accidental complexity for zero
  benefit at this scale; the gateway connection resists clean splitting.
- **Two services (bot + worker)** for heavy background jobs — not needed yet; revisit
  only if we add genuinely long-running async work (e.g. bulk imports). Would be a new ADR.
