import { EmbedBuilder, MessageFlags, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../core/types.js';
import { formatDuration, truncate } from '../../../lib/format.js';
import { getGuildConfig } from '../../../lib/guild-config.js';
import { MUSIC_COLOR, memberVoiceChannelId, trackEmbed } from '../util.js';

export const play: Command = {
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a track or playlist (Spotify, YouTube, SoundCloud, or a search).')
    .addStringOption((o) =>
      o.setName('query').setDescription('A link or search terms').setRequired(true),
    ),

  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const voiceChannelId = memberVoiceChannelId(interaction);
    if (!voiceChannelId) {
      await interaction.reply({
        content: 'Join a voice channel first.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const { lavalink } = interaction.client;
    if (!lavalink.useable) {
      await interaction.reply({
        content: '⚠️ The music backend isn’t connected yet — try again in a moment.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const query = interaction.options.getString('query', true);
    await interaction.deferReply();

    const config = await getGuildConfig(interaction.guildId);

    const player =
      lavalink.getPlayer(interaction.guildId) ??
      lavalink.createPlayer({
        guildId: interaction.guildId,
        voiceChannelId,
        textChannelId: interaction.channelId,
        selfDeaf: true,
        volume: config.defaultVolume,
      });

    if (!player.connected) await player.connect();

    const result = await player.search({ query }, interaction.user);
    const first = result.tracks[0];
    if (!first) {
      await interaction.editReply('No results found for that query.');
      return;
    }

    if (result.loadType === 'playlist') {
      player.queue.add(result.tracks);
      const embed = new EmbedBuilder()
        .setColor(MUSIC_COLOR)
        .setAuthor({ name: 'Added playlist to queue' })
        .setTitle(truncate(result.playlist?.name ?? 'Playlist', 100))
        .addFields({ name: 'Tracks', value: `${result.tracks.length}`, inline: true });
      if (!player.playing && !player.paused) await player.play();
      await interaction.editReply({ embeds: [embed] });
      return;
    }

    player.queue.add(first);
    if (!player.playing && !player.paused) await player.play();

    const position = player.queue.tracks.length;
    const label = player.queue.current && position > 0 ? `Added to queue (#${position})` : 'Now playing';
    await interaction.editReply({ embeds: [trackEmbed(first, label)] });
  },
};
