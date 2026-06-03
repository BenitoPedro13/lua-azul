import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../core/types.js';
import { requireActivePlayer } from '../util.js';

export const stop: Command = {
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback, clear the queue, and leave the voice channel.'),

  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const player = await requireActivePlayer(interaction);
    if (!player) return;

    await player.destroy('stopped by user');
    await interaction.reply({ content: '⏹️ Stopped and left the channel.' });
  },
};
