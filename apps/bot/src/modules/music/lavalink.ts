import type { Client } from 'discord.js';
import { Events } from 'discord.js';
import { LavalinkManager } from 'lavalink-client';
import { env } from '../../config/env.js';
import { logger } from '../../lib/logger.js';

// Make the manager reachable as `client.lavalink` (and `interaction.client.lavalink`)
// with full typing, instead of threading it through every command.
declare module 'discord.js' {
  interface Client {
    lavalink: LavalinkManager;
  }
}

/**
 * Create the LavalinkManager, attach it to the client, and wire the two-way voice
 * bridge Discord requires (see ADR-0009):
 *   - the bot forwards Discord's raw voice payloads to Lavalink (`sendRawData`),
 *   - Lavalink asks the bot to send gateway voice ops via `sendToShard`.
 *
 * Called once from the music module's init(). The manager itself is started on the
 * client `ready` event, when the bot's user id is known.
 */
export function setupLavalink(client: Client): LavalinkManager {
  const manager = new LavalinkManager({
    nodes: [
      {
        id: 'main',
        host: env.LAVALINK_HOST,
        port: env.LAVALINK_PORT,
        authorization: env.LAVALINK_PASSWORD,
        secure: env.LAVALINK_SECURE,
      },
    ],
    sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard?.send(payload),
    playerOptions: {
      defaultSearchPlatform: 'ytsearch',
      onEmptyQueue: { destroyAfterMs: 60_000 }, // leave the channel after 1 min idle
    },
  });

  client.lavalink = manager;

  // Forward Discord's raw gateway voice packets to Lavalink. Without this, audio
  // never flows.
  client.on(Events.Raw, (packet) => {
    void manager.sendRawData(packet);
  });

  // Start the manager once we know our own user id.
  client.once(Events.ClientReady, (c) => {
    void manager
      .init({ id: c.user.id, username: c.user.username })
      .then(() => logger.info('lavalink manager initialised'))
      .catch((err) => logger.error({ err }, 'lavalink init failed'));
  });

  wireNodeEvents(manager);
  wirePlayerEvents(manager);

  return manager;
}

function wireNodeEvents(manager: LavalinkManager): void {
  manager.nodeManager
    .on('connect', (node) => logger.info({ node: node.id }, 'lavalink node connected'))
    .on('disconnect', (node, reason) =>
      logger.warn({ node: node.id, reason }, 'lavalink node disconnected'),
    )
    .on('error', (node, error) => logger.error({ node: node.id, err: error }, 'lavalink node error'));
}

function wirePlayerEvents(manager: LavalinkManager): void {
  manager
    .on('trackStart', (player, track) =>
      logger.debug({ guild: player.guildId, track: track?.info.title }, 'track start'),
    )
    .on('trackError', (player, track, payload) =>
      logger.warn(
        { guild: player.guildId, track: track?.info.title, err: payload.exception?.message },
        'track error',
      ),
    )
    .on('queueEnd', (player) => logger.debug({ guild: player.guildId }, 'queue ended'));
}
