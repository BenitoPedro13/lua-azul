# ADR-0007 — Module / command / event architecture

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** project owner

## Context

Inside the monolith ([ADR-0001](./0001-modular-monolith-over-microservices.md)) we need a structure that keeps features (music,
logging, engagement) genuinely decoupled without a network boundary forcing it. A common
failure mode in Discord bots is a giant `commands/` folder and a giant `events/` folder
where everything is mixed together and feature ownership is unclear.

We want: adding a feature is "drop in a folder", and a feature's commands + event handlers
+ setup live together.

## Decision

Organize by **module**, where a module is a folder exposing a manifest:

```ts
interface Command {
  data: SlashCommandBuilder;                    // definition (for registration)
  execute(ctx): Promise<void>;                  // runtime handler
  // optional: autocomplete, component handlers, guild gating
}

interface Event<K extends keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute(...args: ClientEvents[K]): Promise<void> | void;
}

interface BotModule {
  name: string;
  commands?: Command[];
  events?: Event[];
  init?(ctx): Promise<void>;   // one-time setup, e.g. connect Lavalink
}
```

A `core/` loader:
1. imports each module's manifest,
2. flattens `commands` into one registry keyed by command name (used both to register
   definitions and to route `interactionCreate`),
3. binds each `event` to the client,
4. awaits each `init()`.

Layout:

```
src/
  core/        # contracts + loader + interaction router
  modules/
    music/     index.ts (manifest) · commands/ · events/ · lavalink.ts
    logging/   index.ts · commands/ · events/
    engagement/…
  lib/         logger · db
```

## Consequences

**Positive**
- Feature cohesion: a module owns everything it needs in one place.
- Adding/removing a feature is local and low-risk.
- The module boundary is the natural extraction seam if a service split is ever justified
  ([ADR-0001](./0001-modular-monolith-over-microservices.md)) — though we don't build toward that.
- One registry → registration and runtime routing can't drift out of sync.

**Negative / accepted**
- A tiny bit of ceremony (manifest per module) vs. dumping files in shared folders.
- Cross-module concerns (shared `GuildConfig` access) go through `lib/`, requiring some
  discipline about what's "core" vs "module-local".

## Alternatives considered

- **Flat `commands/` + `events/` folders** — simple at first, becomes an unowned tangle.
  Rejected.
- **A command framework (Sapphire, Necord)** — batteries included, but a large abstraction
  to learn/fight for a small bot; we keep a thin, owned core over discord.js. Reconsider
  if the hand-rolled loader grows unwieldy (would be a new ADR).
