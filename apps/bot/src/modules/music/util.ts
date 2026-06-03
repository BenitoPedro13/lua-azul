import { type ChatInputCommandInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import type { Player, Track, UnresolvedTrack } from 'lavalink-client';
import { formatDuration, truncate } from '../../lib/format.js';

export const MUSIC_COLOR = 0x5865f2;

/** The voice channel the invoking member is currently in, or null. */
export function memberVoiceChannelId(interaction: ChatInputCommandInteraction<'cached'>): string | null {
  return interaction.member.voice.channelId;
}

/** Reply with an ephemeral error, whether or not the interaction was deferred. */
export async function fail(
  interaction: ChatInputCommandInteraction<'cached'>,
  message: string,
): Promise<void> {
  if (interaction.deferred || interaction.replied) await interaction.editReply({ content: message });
  else await interaction.reply({ content: message, flags: MessageFlags.Ephemeral });
}

/**
 * Resolve the guild's active player, enforcing that something is playing and that
 * the member shares the bot's voice channel. Replies + returns null on failure.
 */
export async function requireActivePlayer(
  interaction: ChatInputCommandInteraction<'cached'>,
): Promise<Player | null> {
  const player = interaction.client.lavalink.getPlayer(interaction.guildId);
  if (!player || !player.queue.current) {
    await fail(interaction, 'Nothing is playing right now.');
    return null;
  }
  if (memberVoiceChannelId(interaction) !== player.voiceChannelId) {
    await fail(interaction, 'You need to be in my voice channel to do that.');
    return null;
  }
  return player;
}

/** Build the standard "track" embed (now playing / added to queue). */
export function trackEmbed(track: Track | UnresolvedTrack, title: string): EmbedBuilder {
  const { info } = track;
  const embed = new EmbedBuilder()
    .setColor(MUSIC_COLOR)
    .setAuthor({ name: title })
    .setTitle(truncate(info.title, 100))
    .addFields(
      { name: 'Artist', value: truncate(info.author ?? 'Unknown', 100), inline: true },
      { name: 'Duration', value: formatDuration(info.duration, info.isStream), inline: true },
    );
  if (info.uri) embed.setURL(info.uri);
  if (info.artworkUrl) embed.setThumbnail(info.artworkUrl);
  return embed;
}
