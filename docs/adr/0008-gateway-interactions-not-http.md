# ADR-0008 — Gateway interactions, not an HTTP endpoint

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** project owner

## Context

Discord delivers slash-command **interactions** to an app one of two ways:

1. **HTTP webhook** — Discord POSTs each interaction to a public HTTPS URL you host. You
   must verify request signatures (Ed25519), expose an inbound endpoint, and (in dev)
   tunnel it with something like ngrok. This is what Discord's "getting started" guide
   demonstrates with an Express server.
2. **Gateway** — interactions arrive as events over the same WebSocket the bot already
   maintains for gateway events. No inbound endpoint.

We're building a long-running bot that already holds a gateway connection (for voice
state, message, and member events). discord.js is gateway-based.

## Decision

Receive interactions **over the gateway**, via discord.js's `interactionCreate` event. We
do **not** run an HTTP interactions endpoint.

Note the distinction that persists regardless: **registering** command *definitions* is
always done over the **REST API** (`PUT /applications/{app}/commands` etc. — see
[ADR-0010](./0010-command-deployment-and-intents.md)). What this ADR decides is how we *receive* interactions at runtime —
gateway, not webhook.

## Consequences

**Positive**
- **No public endpoint, no inbound port, no ngrok, no signature verification** — the bot
  is purely an outbound client.
- One connection for everything (events + interactions); simpler deploy on Railway/Fly
  (no exposed web service needed for the bot itself).
- discord.js handles the gateway lifecycle (identify/heartbeat/resume).

**Negative / accepted**
- The process must stay continuously connected (a bot does anyway) — incompatible with
  serverless, which we already rejected ([ADR-0005](./0005-deploy-railway-fly.md)).
- If we ever want a webhook-style stateless interactions service, that's a different
  architecture and a new ADR.

## Alternatives considered

- **HTTP interactions webhook** — enables stateless/serverless handling and no gateway
  connection, but we *need* the gateway anyway (voice, message, member events), so a
  webhook would be a second inbound surface for no benefit. Rejected.
