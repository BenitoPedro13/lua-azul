# ADR-0003 — Postgres + Prisma for persistence

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** project owner

## Context

Logging (audit trail) and engagement (counters, tags) need durable, queryable state, and
per-guild configuration must survive restarts. We need:

- relational queries (per-guild, per-user, time-ranged audit lookups),
- type safety from DB to TypeScript (the whole point of a TS-first stack),
- painless migrations,
- a smooth path to being consumed by a future dashboard.

## Decision

**PostgreSQL** as the database, **Prisma** as the ORM/migration tool.

- Postgres: robust relational engine, JSON columns for flexible event payloads, available
  as a managed addon on Railway/Fly ([ADR-0005](./0005-deploy-railway-fly.md)).
- Prisma: best-in-class TypeScript DX — generated, fully-typed client; declarative schema;
  first-class migrations (`prisma migrate`). The generated types are exactly what a
  dashboard would want to reuse.

Initial schema is small and per-guild: `Guild`, `GuildConfig`, `AuditLog`,
`EngagementCounter`. It grows with features, each change via a migration.

## Consequences

**Positive**
- End-to-end type safety; refactors caught at compile time.
- Migrations are versioned and reviewable; `migrate deploy` runs on container start.
- JSON payload column keeps the audit log flexible without a table per event type.

**Negative / accepted**
- Prisma adds a generate step (`prisma generate`) to the build — wired into `db:generate`
  and the Dockerfile.
- Postgres is heavier than SQLite for local dev — mitigated by docker-compose
  ([ADR-0004](./0004-docker-compose-local-infra.md)).
- Prisma's query API is less SQL-expressive than raw/Drizzle for exotic queries — acceptable;
  we can drop to `$queryRaw` if ever needed.

## Alternatives considered

- **SQLite** — zero infra, fine for a single instance, but no managed hosting story and a
  migration cost if we outgrow it. Postgres now avoids a later move.
- **Drizzle ORM** — lighter, SQL-first, excellent types. A close call; Prisma wins on
  migration ergonomics and Studio for a solo dev who values DX over raw SQL control.
- **Raw `pg` / Kysely** — more control, more boilerplate, no generated schema types.
  Rejected for velocity.
