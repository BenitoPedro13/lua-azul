import { MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../core/types.js';

export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check that the bot is alive and see its gateway latency.'),

  async execute(interaction) {
    const ws = Math.round(interaction.client.ws.ping);
    const latency = ws < 0 ? 'measuring…' : `\`${ws}ms\``;
    await interaction.reply({
      content: `🏓 Pong! Gateway heartbeat: ${latency}.`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
