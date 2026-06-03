import type { Client } from 'discord.js';
import { prisma } from '../lib/db.js';
import { logger } from '../lib/logger.js';
import type { BotModule, Command } from './types.js';

/**
 * Load modules into the client:
 *   1. collect every command into one registry (used for routing + deploy),
 *   2. wire each event handler (with error isolation),
 *   3. run each module's optional init().
 *
 * Returns the command registry keyed by command name.
 */
export async function loadModules(
  client: Client,
  modules: BotModule[],
): Promise<Map<string, Command>> {
  const commands = new Map<string, Command>();

  for (const mod of modules) {
    for (const command of mod.commands ?? []) {
      const name = command.data.name;
      if (commands.has(name)) {
        logger.warn({ command: name, module: mod.name }, 'duplicate command name — overwriting');
      }
      commands.set(name, command);
    }

    for (const event of mod.events ?? []) {
      // Wrap so one throwing handler can never crash the process.
      const handler = (...args: unknown[]) =>
        Promise.resolve((event.execute as (...a: unknown[]) => unknown)(...args)).catch((err) =>
          logger.error({ err, event: event.name, module: mod.name }, 'event handler threw'),
        );
      // discord.js overloads on() per event; our generic handler needs a cast.
      if (event.once) client.once(event.name, handler as never);
      else client.on(event.name, handler as never);
    }

    await mod.init?.({ client, logger, prisma });

    logger.info(
      {
        module: mod.name,
        commands: mod.commands?.length ?? 0,
        events: mod.events?.length ?? 0,
      },
      'module loaded',
    );
  }

  return commands;
}
