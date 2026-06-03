import { EmbedBuilder } from 'discord.js';
import { defineEvent } from '../../../core/types.js';
import { LOG_COLORS, LOG_EVENT_LABELS, dispatchLog } from '../util.js';

export const guildMemberRemove = defineEvent({
  name: 'guildMemberRemove',
  async execute(member) {
    const tag = member.user?.tag ?? 'Unknown user';

    const embed = new EmbedBuilder()
      .setColor(LOG_COLORS.leave)
      .setAuthor({ name: tag, iconURL: member.user?.displayAvatarURL() })
      .setTitle(LOG_EVENT_LABELS.guildMemberRemove)
      .addFields({ name: 'User', value: `<@${member.id}>`, inline: true })
      .setTimestamp();

    if (member.joinedTimestamp) {
      embed.addFields({
        name: 'Joined',
        value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
        inline: true,
      });
    }

    await dispatchLog(member.guild, 'guildMemberRemove', {
      embed,
      actorId: member.id,
      payload: { userId: member.id, tag },
    });
  },
});
