# ADR-0009 — Music via Lavalink

- **Status:** Accepted
- **Date:** 2026-06-03
- **Deciders:** project owner

## Context

Playing audio into Discord voice channels is hard to do well in-process: you must join
voice, negotiate the voice gateway, fetch/stream/transcode audio to Opus, and manage
buffering and reconnects. Doing this inside Node (e.g. `@discordjs/voice` + ytdl) is
fragile, CPU-heavy, and breaks often as providers change. We want Spotify, SoundCloud,
and YouTube support.

`lavalink-client` is already a dependency.

## Decision

Use **Lavalink** — a standalone Java audio node — driven by **`lavalink-client`** from the
bot.

- **Lavalink** does the heavy lifting: resolving tracks, streaming, transcoding to Opus,
  buffering. It runs as a container ([ADR-0004](./0004-docker-compose-local-infra.md) locally, [ADR-0005](./0005-deploy-railway-fly.md) in prod).
- **Providers via plugins** in `application.yml`:
  - `youtube-plugin` → YouTube / YouTube Music,
  - `lavasrc` → Spotify links (resolved via search mirrors; needs Spotify client id/secret),
  - built-in → SoundCloud, Bandcamp, Twitch, HTTP.
- **Voice forwarding:** Lavalink joins voice on the bot's behalf, but Discord sends voice
  state/server updates to the *bot's* gateway connection. The bot must forward Discord's
  raw `VOICE_STATE_UPDATE` / `VOICE_SERVER_UPDATE` payloads to Lavalink —
  `lavalink-client` wires this through the client's `raw` event + a `sendToShard`
  callback. This requires the **`GuildVoiceStates`** intent (non-privileged).
- The bot keeps only lightweight per-guild player state (queue, volume, now-playing);
  Lavalink holds the audio pipeline.

## Consequences

**Positive**
- Robust, battle-tested playback; offloads CPU/transcoding from the Node process.
- Multi-provider out of the box via plugins.
- Survives provider changes by updating the Lavalink plugin, not our code.

**Negative / accepted**
- Operational cost: a **second service** (JVM) to run and deploy ([ADR-0005](./0005-deploy-railway-fly.md)).
- A network hop between bot and Lavalink (negligible on the same host/region).
- Must keep `application.yml` and plugin versions maintained.

## Alternatives considered

- **In-process `@discordjs/voice` + ytdl/play-dl** — no extra service, but fragile,
  CPU-bound, frequent breakage, weak multi-provider story. Rejected for a music-first bot.
- **A hosted/public Lavalink node** — unreliable and a privacy/availability risk.
  Rejected; we run our own.
