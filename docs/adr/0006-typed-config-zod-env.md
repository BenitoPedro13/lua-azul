# ADR-0006 — Typed configuration via Zod-validated env

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** project owner

## Context

The bot needs secrets and settings: Discord token + client id, database URL, Lavalink
host/port/password, log level. Reading `process.env.FOO` ad-hoc throughout the codebase
means: values are `string | undefined` everywhere, typos fail silently, and a missing
token surfaces as a confusing error deep inside a handler at runtime instead of at boot.

We already use Zod (it's a dependency) for runtime validation.

## Decision

A single **`config/env.ts`** module loads `.env` (via dotenv) and **validates the entire
environment with a Zod schema at process start**. It exports one typed, frozen `env`
object that the rest of the code imports. Nothing else reads `process.env` directly.

- Required vars (token, client id, database url, Lavalink creds) are non-optional in the
  schema → a missing one **crashes the process immediately** with a precise message.
- Types/coercion handled by the schema (e.g. port → number, secure flag → boolean,
  `LOG_LEVEL` → enum).
- `.env.example` is the human-readable contract for what's required and mirrors the schema.

## Consequences

**Positive**
- **Fail fast:** misconfiguration is caught at boot with a clear error, not mid-command.
- Fully typed config — no `string | undefined` noise, no repeated parsing.
- One obvious place to see everything the bot needs to run.

**Negative / accepted**
- The schema and `.env.example` must be kept in sync (small, and reviewable).

## Alternatives considered

- **Raw `process.env` access** — untyped, scattered, fails late. Rejected.
- **A config library (convict, env-var, etc.)** — extra dependency for what ~30 lines of
  Zod (already in the tree) does with better types. Rejected.
- **Validate lazily on first use** — defeats fail-fast; a bad config could lurk until a
  rarely-used feature runs. Rejected.
