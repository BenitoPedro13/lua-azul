import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../core/types.js';
import { prisma } from '../../../lib/db.js';
import { requireActivePlayer } from '../util.js';

const MAX_VOLUME = 200;

export const volume: Command = {
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Set playback volume (0–200%).')
    .addIntegerOption((o) =>
      o
        .setName('percent')
        .setDescription('Volume from 0 to 200')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(MAX_VOLUME),
    ),

  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const percent = interaction.options.getInteger('percent', true);
    await player.setVolume(percent);

    // Persist as the guild's default so future sessions start here.
    await prisma.guildConfig.update({
      where: { guildId: interaction.guildId },
      data: { defaultVolume: percent },
    });

    await interaction.reply({ content: `🔊 Volume set to **${percent}%**.` });
  },
};
