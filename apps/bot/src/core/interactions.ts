import { type Client, Events, type InteractionReplyOptions, MessageFlags } from 'discord.js';
import { logger } from '../lib/logger.js';
import type { Command } from './types.js';

/**
 * Route incoming interactions to the matching command. Slash commands and their
 * autocomplete share the same registry. A throwing handler replies with an error
 * instead of taking down the process.
 */
export function registerInteractionRouter(client: Client, commands: Map<string, Command>): void {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = commands.get(interaction.commandName);
      if (!command) {
        logger.warn({ command: interaction.commandName }, 'received unknown command');
        return;
      }

      if (command.guildOnly && !interaction.inGuild()) {
        await interaction.reply({
          content: 'This command can only be used in a server.',
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      try {
        await command.execute(interaction);
      } catch (err) {
        logger.error({ err, command: interaction.commandName }, 'command execution failed');
        const payload: InteractionReplyOptions = {
          content: '⚠️ Something went wrong running that command.',
          flags: MessageFlags.Ephemeral,
        };
        try {
          if (interaction.replied || interaction.deferred) await interaction.followUp(payload);
          else await interaction.reply(payload);
        } catch {
          // The interaction may have expired (>3s with no defer) — nothing to do.
        }
      }
      return;
    }

    if (interaction.isAutocomplete()) {
      const command = commands.get(interaction.commandName);
      if (!command?.autocomplete) return;
      try {
        await command.autocomplete(interaction);
      } catch (err) {
        logger.error({ err, command: interaction.commandName }, 'autocomplete failed');
      }
    }
  });
}
