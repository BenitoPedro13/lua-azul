# ADR-0002 — Monorepo with pnpm workspaces

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** project owner

## Context

A monorepo is **orthogonal** to the monolith-vs-microservices question ([ADR-0001](./0001-modular-monolith-over-microservices.md)): one
is about *repository layout*, the other about *runtime topology*. We can have a single
deployable (the monolith) living in a monorepo alongside other packages.

The concrete driver: a **web dashboard (React/Tailwind) is likely later**, not now. When
it arrives, the bot and the dashboard will want to share TypeScript types — Zod schemas
for guild config, command metadata, DB-derived models — with zero duplication and no
drift. A monorepo makes that sharing a local import instead of a published package.

The risk of a monorepo is over-engineering it *before* there's a second consumer: a
shared package with dual-publish/build wiring that nobody imports yet is pure overhead.

## Decision

Use a **pnpm workspace** monorepo with this layout:

```
apps/bot          # the only deployable today
packages/shared   # STUB now — will hold shared Zod schemas/types when the dashboard lands
```

- pnpm (not npm/yarn) for fast, disk-efficient workspaces and strict dependency
  isolation.
- `packages/shared` exists as a placeholder so the structure is ready, **but the bot does
  not import it yet** — avoiding the dual-package/build-wiring hazard until a real second
  consumer exists.
- When the dashboard is built (`apps/web`), `shared` is promoted from stub to real, and
  both apps adopt it. That adoption gets documented then.

## Consequences

**Positive**
- Dashboard slots in later with shared types and no repo split.
- One install, one lockfile, atomic cross-cutting changes.
- Plays to a TypeScript-first workflow.

**Negative / accepted**
- Slightly more config than a single package (workspace file, per-package tsconfig).
- Must resist importing `shared` until it's genuinely shared (enforced by it being empty).

## Alternatives considered

- **Single package, no workspace** — simplest, but forces a repo split or copy-paste types
  the moment the dashboard appears. Rejected because the dashboard is a stated "later".
- **Polyrepo (separate bot/dashboard repos) + published shared package** — versioning and
  release overhead unjustified for a solo project.
- **Monorepo with `shared` wired in now** — rejected: dual-build hazard for a package with
  no second consumer yet.
