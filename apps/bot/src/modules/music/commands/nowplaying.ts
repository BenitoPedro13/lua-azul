import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../core/types.js';
import { formatDuration } from '../../../lib/format.js';
import { requireActivePlayer, trackEmbed } from '../util.js';

export const nowplaying: Command = {
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName('nowplaying')
    .setDescription('Show the track currently playing.'),

  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const current = player.queue.current;
    if (!current) return; // requireActivePlayer guarantees this, but narrows the type

    const embed = trackEmbed(current, 'Now playing');
    if (!current.info.isStream) {
      const elapsed = formatDuration(player.position);
      const total = formatDuration(current.info.duration);
      embed.addFields({ name: 'Position', value: `${elapsed} / ${total}`, inline: true });
    }
    embed.addFields({ name: 'Volume', value: `${player.volume}%`, inline: true });

    await interaction.reply({ embeds: [embed] });
  },
};
