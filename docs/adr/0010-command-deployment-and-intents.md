# ADR-0010 — Command deployment & intent strategy

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** project owner

## Context

Two runtime-shaping facts come straight from the Discord docs and need an explicit policy:

**1. Command registration is separate from command handling.** Slash-command *definitions*
are uploaded to Discord over the **REST API**; they don't auto-appear from the gateway.
Discord offers two scopes with very different behavior:

| Scope  | Endpoint                                            | Propagation        | Use |
|--------|-----------------------------------------------------|--------------------|-----|
| Guild  | `PUT /applications/{app}/guilds/{guild}/commands`   | **instant**        | dev |
| Global | `PUT /applications/{app}/commands`                  | up to **~1 hour**  | prod|

Limits to respect: **100** CHAT_INPUT commands per scope, and **200 command-creates per
day per guild**. A bulk-overwrite `PUT` is one call for the whole set.

**2. Intents are least-privilege and some are privileged.** The gateway only sends events
we opt into; `GuildMembers` and `MessageContent` are **privileged** (Portal toggle +
approval past 100 guilds).

## Decision

**Deployment:**
- A dedicated `deploy-commands.ts` script does **bulk overwrite** (`PUT`) of all module
  command definitions — never incremental create-per-command (stays well under the
  200/day limit, one idempotent call).
- **Dev:** if `DISCORD_DEV_GUILD_ID` is set, deploy to that guild → instant iteration.
- **Prod:** with no dev guild, deploy **globally**.
- Deployment is a **manual/CI step** (`pnpm deploy:commands`), decoupled from bot boot —
  the bot doesn't re-register on every restart. (The script is named `deploy:commands`,
  not `deploy`, because `pnpm deploy` is a built-in pnpm subcommand that would shadow it.)

**Intents:** request the minimal set, enabled per feature:
- Always: `Guilds`.
- Music: `GuildVoiceStates`.
- Logging: `GuildMessages`, plus the **privileged** `GuildMembers` and `MessageContent`.

Privileged intents are only required by the logging module; document them in
`.env`/README so a music-only deployment can leave them off in the Portal.

**Permission gating:** admin commands (e.g. `/logging setup`) set
`default_member_permissions` (e.g. `ManageGuild`) so non-admins don't see/use them.

## Consequences

**Positive**
- Instant command iteration in dev; clean global rollout in prod — same code, switched by
  one env var.
- Bulk overwrite is idempotent and rate-limit-safe.
- Least-privilege intents minimize the privileged-intent approval surface.

**Negative / accepted**
- Global command changes take up to ~1h to appear — expected; dev guild avoids it while iterating.
- Someone must run `pnpm deploy:commands` after changing command definitions (not on
  every boot) — documented in the roadmap/README.

## Alternatives considered

- **Auto-register on startup** — convenient but risks hitting create limits on crash-loops
  and couples deploy to boot. Rejected in favor of an explicit step.
- **Always global (even in dev)** — the ~1h propagation makes iteration painful. Rejected;
  dev guild is instant.
- **Request all intents broadly** — simpler but triggers unnecessary privileged-intent
  review and over-collects data. Rejected for least-privilege.
