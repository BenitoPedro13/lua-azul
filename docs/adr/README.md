# Architecture Decision Records

Each ADR captures **one decision**: the context that forced it, what we chose, what we
gave up, and what we considered instead. They're immutable once accepted — to change a
decision, write a new ADR that supersedes the old one (and mark the old one
`Superseded by ADR-XXXX`).

Format is lightweight [MADR](https://adr.github.io/madr/): Status · Context · Decision ·
Consequences · Alternatives.

| #    | Title                                                  | Status   |
|------|--------------------------------------------------------|----------|
| 0001 | [Modular monolith over microservices](./0001-modular-monolith-over-microservices.md) | Accepted |
| 0002 | [Monorepo with pnpm workspaces](./0002-monorepo-pnpm-workspaces.md)                  | Accepted |
| 0003 | [Postgres + Prisma for persistence](./0003-postgres-prisma.md)                        | Accepted |
| 0004 | [Docker Compose for local infrastructure](./0004-docker-compose-local-infra.md)      | Accepted |
| 0005 | [Deploy to Railway / Fly.io](./0005-deploy-railway-fly.md)                            | Accepted |
| 0006 | [Typed configuration via Zod-validated env](./0006-typed-config-zod-env.md)          | Accepted |
| 0007 | [Module / command / event architecture](./0007-module-command-event-architecture.md) | Accepted |
| 0008 | [Gateway interactions, not an HTTP endpoint](./0008-gateway-interactions-not-http.md) | Accepted |
| 0009 | [Music via Lavalink](./0009-music-via-lavalink.md)                                    | Accepted |
| 0010 | [Command deployment & intent strategy](./0010-command-deployment-and-intents.md)      | Accepted |

## Why bother

For a solo/small project, ADRs pay off when *future-you* asks "why did I do it this
weird way?" — the answer is one file away instead of lost. They also make the
microservices-vs-monolith and monorepo-vs-not reasoning explicit, since those are the
choices most tempting to second-guess.
