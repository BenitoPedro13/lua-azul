import { Events } from 'discord.js';
import { createClient } from './client.js';
import { env } from './config/env.js';
import { registerInteractionRouter } from './core/interactions.js';
import { loadModules } from './core/loader.js';
import { prisma } from './lib/db.js';
import { logger } from './lib/logger.js';
import { modules } from './modules/index.js';

async function main(): Promise<void> {
  logger.info({ env: env.NODE_ENV }, 'starting Lua Azul');

  const client = createClient();

  const commands = await loadModules(client, modules);
  registerInteractionRouter(client, commands);

  client.once(Events.ClientReady, (c) => {
    logger.info(
      { tag: c.user.tag, id: c.user.id, guilds: c.guilds.cache.size, commands: commands.size },
      'ready',
    );
  });

  client.on(Events.Error, (err) => logger.error({ err }, 'client error'));
  client.on(Events.Warn, (msg) => logger.warn({ msg }, 'client warning'));

  // Graceful shutdown so the gateway disconnects cleanly and the DB pool drains.
  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'shutting down');
    await client.destroy();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await client.login(env.DISCORD_TOKEN);
}

main().catch((err) => {
  logger.fatal({ err }, 'fatal error during boot');
  process.exit(1);
});
