import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../core/types.js';
import { truncate } from '../../../lib/format.js';
import { requireActivePlayer } from '../util.js';

export const skip: Command = {
  guildOnly: true,
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current track.'),

  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const player = await requireActivePlayer(interaction);
    if (!player) return;

    const skipped = player.queue.current;
    const hasNext = player.queue.tracks.length > 0;

    // throwError=false so skipping the last track stops cleanly instead of throwing.
    await player.skip(undefined, false);

    const title = skipped ? truncate(skipped.info.title, 100) : 'the track';
    await interaction.reply({
      content: hasNext ? `⏭️ Skipped **${title}**.` : `⏭️ Skipped **${title}** — queue is now empty.`,
    });
  },
};
