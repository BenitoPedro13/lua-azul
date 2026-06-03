import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../core/types.js';
import { formatDuration, truncate } from '../../../lib/format.js';
import { MUSIC_COLOR, requireActivePlayer } from '../util.js';

const PAGE_SIZE = 10;

export const queue: Command = {
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName('queue')
    .setDescription('Show the current track and what’s coming up.'),

  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const current = player.queue.current;
    const upcoming = player.queue.tracks;

    const embed = new EmbedBuilder().setColor(MUSIC_COLOR).setTitle('Queue');

    if (current) {
      embed.addFields({
        name: '▶️ Now playing',
        value: `[${truncate(current.info.title, 80)}](${current.info.uri}) · ${formatDuration(
          current.info.duration,
          current.info.isStream,
        )}`,
      });
    }

    if (upcoming.length > 0) {
      const lines = upcoming
        .slice(0, PAGE_SIZE)
        .map((track, i) => {
          const title = truncate(track.info.title, 60);
          const dur = formatDuration(track.info.duration, track.info.isStream);
          return `\`${i + 1}.\` [${title}](${track.info.uri}) · ${dur}`;
        })
        .join('\n');
      const remaining = upcoming.length - PAGE_SIZE;
      embed.addFields({
        name: `⏭️ Up next — ${upcoming.length} track${upcoming.length === 1 ? '' : 's'}`,
        value: remaining > 0 ? `${lines}\n…and ${remaining} more` : lines,
      });
    } else {
      embed.setFooter({ text: 'Nothing queued — add more with /play.' });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
