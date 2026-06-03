import { EmbedBuilder } from 'discord.js';
import { defineEvent } from '../../../core/types.js';
import { truncate } from '../../../lib/format.js';
import { LOG_COLORS, LOG_EVENT_LABELS, dispatchLog } from '../util.js';

export const messageDelete = defineEvent({
  name: 'messageDelete',
  async execute(message) {
    if (!message.guild) return; // ignore DMs
    if (message.author?.bot) return; // ignore bot messages (incl. our own)

    const content = message.content?.length
      ? truncate(message.content, 1024)
      : '*no cached content (message was sent before the bot started)*';

    const embed = new EmbedBuilder()
      .setColor(LOG_COLORS.delete)
      .setTitle(LOG_EVENT_LABELS.messageDelete)
      .setDescription(content)
      .addFields({ name: 'Channel', value: `<#${message.channelId}>`, inline: true })
      .setTimestamp();

    if (message.author) {
      embed
        .setAuthor({ name: message.author.tag, iconURL: message.author.displayAvatarURL() })
        .addFields({ name: 'Author', value: `<@${message.author.id}>`, inline: true });
    }

    await dispatchLog(message.guild, 'messageDelete', {
      embed,
      actorId: message.author?.id ?? null,
      channelId: message.channelId,
      payload: { content: message.content ?? null, authorId: message.author?.id ?? null },
    });
  },
});
