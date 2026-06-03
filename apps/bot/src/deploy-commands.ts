import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { modules } from './modules/index.js';

/**
 * Register slash-command DEFINITIONS with Discord over REST (see ADR-0010).
 * This is separate from handling interactions at runtime, and is a manual/CI
 * step (`pnpm deploy`) — not run on every boot.
 *
 *   - dev (DISCORD_DEV_GUILD_ID set): register to that guild  → instant.
 *   - prod (unset):                   register globally        → up to ~1h.
 *
 * Uses a single bulk-overwrite PUT (idempotent, rate-limit-safe).
 */
async function main(): Promise<void> {
  const body = modules.flatMap((m) => m.commands ?? []).map((c) => c.data.toJSON());

  const rest = new REST().setToken(env.DISCORD_TOKEN);

  if (env.DISCORD_DEV_GUILD_ID) {
    await rest.put(
      Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_DEV_GUILD_ID),
      { body },
    );
    logger.info(
      { count: body.length, guild: env.DISCORD_DEV_GUILD_ID },
      'registered guild commands (instant)',
    );
  } else {
    await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), { body });
    logger.info({ count: body.length }, 'registered global commands (propagates in up to ~1h)');
  }
}

main().catch((err) => {
  logger.error({ err }, 'failed to deploy commands');
  process.exit(1);
});
