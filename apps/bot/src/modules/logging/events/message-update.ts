import { EmbedBuilder } from 'discord.js';
import { defineEvent } from '../../../core/types.js';
import { truncate } from '../../../lib/format.js';
import { LOG_COLORS, LOG_EVENT_LABELS, dispatchLog } from '../util.js';

export const messageUpdate = defineEvent({
  name: 'messageUpdate',
  async execute(oldMessage, newMessage) {
    // The "new" side may be partial if the message wasn't cached — fetch to fill it.
    if (newMessage.partial) {
      try {
        await newMessage.fetch();
      } catch {
        return;
      }
    }

    if (!newMessage.guild) return;
    if (newMessage.author?.bot) return;

    const before = oldMessage.content;
    const after = newMessage.content;
    // Only text changes are interesting; embeds/attachments/pins also fire this event.
    if (before === after) return;

    const embed = new EmbedBuilder()
      .setColor(LOG_COLORS.edit)
      .setTitle(LOG_EVENT_LABELS.messageUpdate)
      .addFields(
        { name: 'Before', value: before?.length ? truncate(before, 1024) : '*uncached or empty*' },
        { name: 'After', value: after?.length ? truncate(after, 1024) : '*empty*' },
        { name: 'Channel', value: `<#${newMessage.channelId}>`, inline: true },
        { name: 'Jump', value: `[message](${newMessage.url})`, inline: true },
      )
      .setTimestamp();

    if (newMessage.author) {
      embed.setAuthor({
        name: newMessage.author.tag,
        iconURL: newMessage.author.displayAvatarURL(),
      });
    }

    await dispatchLog(newMessage.guild, 'messageUpdate', {
      embed,
      actorId: newMessage.author?.id ?? null,
      channelId: newMessage.channelId,
      payload: { before: before ?? null, after: after ?? null, authorId: newMessage.author?.id ?? null },
    });
  },
});
