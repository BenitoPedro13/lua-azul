import { EmbedBuilder } from 'discord.js';
import { defineEvent } from '../../../core/types.js';
import { LOG_COLORS, LOG_EVENT_LABELS, dispatchLog } from '../util.js';

export const guildMemberAdd = defineEvent({
  name: 'guildMemberAdd',
  async execute(member) {
    const createdUnix = Math.floor(member.user.createdTimestamp / 1000);

    const embed = new EmbedBuilder()
      .setColor(LOG_COLORS.join)
      .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL() })
      .setTitle(LOG_EVENT_LABELS.guildMemberAdd)
      .addFields(
        { name: 'User', value: `<@${member.id}>`, inline: true },
        { name: 'Account created', value: `<t:${createdUnix}:R>`, inline: true },
        { name: 'Member count', value: `${member.guild.memberCount}`, inline: true },
      )
      .setTimestamp();

    await dispatchLog(member.guild, 'guildMemberAdd', {
      embed,
      actorId: member.id,
      payload: { userId: member.id, tag: member.user.tag },
    });
  },
});
