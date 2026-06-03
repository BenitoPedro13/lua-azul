import {
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import type { Command } from '../../../core/types.js';
import { prisma } from '../../../lib/db.js';
import { getGuildConfig } from '../../../lib/guild-config.js';
import { ALL_LOG_EVENTS, LOG_EVENT_LABELS, type LogEventType } from '../util.js';

export const logging: Command = {
  guildOnly: true,
  data: new SlashCommandBuilder()
    .setName('logging')
    .setDescription('Configure server audit logging.')
    // Hidden from members without Manage Server (Discord enforces this).
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sc) =>
      sc
        .setName('setup')
        .setDescription('Enable logging and choose the channel.')
        .addChannelOption((o) =>
          o
            .setName('channel')
            .setDescription('Channel to post logs in')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
            .setRequired(true),
        ),
    )
    .addSubcommand((sc) =>
      sc.setName('status').setDescription('Show the current logging configuration.'),
    )
    .addSubcommand((sc) => sc.setName('disable').setDescription('Turn logging off.'))
    .addSubcommand((sc) =>
      sc
        .setName('toggle')
        .setDescription('Enable or disable a specific event.')
        .addStringOption((o) =>
          o
            .setName('event')
            .setDescription('Which event to toggle')
            .setRequired(true)
            .addChoices(...ALL_LOG_EVENTS.map((e) => ({ name: LOG_EVENT_LABELS[e], value: e }))),
        ),
    ),

  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;
    const sub = interaction.options.getSubcommand();

    if (sub === 'setup') {
      const channel = interaction.options.getChannel('channel', true);
      await getGuildConfig(interaction.guildId); // ensure the row exists
      await prisma.guildConfig.update({
        where: { guildId: interaction.guildId },
        data: { loggingEnabled: true, logChannelId: channel.id, logEvents: [...ALL_LOG_EVENTS] },
      });
      await interaction.reply({
        content: `✅ Logging enabled in <#${channel.id}> for all events. Fine-tune with \`/logging toggle\`.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (sub === 'disable') {
      await getGuildConfig(interaction.guildId);
      await prisma.guildConfig.update({
        where: { guildId: interaction.guildId },
        data: { loggingEnabled: false },
      });
      await interaction.reply({ content: '🛑 Logging disabled.', flags: MessageFlags.Ephemeral });
      return;
    }

    if (sub === 'toggle') {
      const event = interaction.options.getString('event', true) as LogEventType;
      const config = await getGuildConfig(interaction.guildId);
      const isOn = config.logEvents.includes(event);
      const next = isOn
        ? config.logEvents.filter((e) => e !== event)
        : [...config.logEvents, event];
      await prisma.guildConfig.update({
        where: { guildId: interaction.guildId },
        data: { logEvents: next },
      });
      await interaction.reply({
        content: `${isOn ? '➖ Disabled' : '➕ Enabled'} logging for **${LOG_EVENT_LABELS[event]}**.`,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // status
    const config = await getGuildConfig(interaction.guildId);
    const embed = new EmbedBuilder()
      .setTitle('Logging configuration')
      .setColor(config.loggingEnabled ? 0x57f287 : 0xed4245)
      .addFields(
        {
          name: 'Status',
          value: config.loggingEnabled ? '🟢 Enabled' : '🔴 Disabled',
          inline: true,
        },
        {
          name: 'Channel',
          value: config.logChannelId ? `<#${config.logChannelId}>` : '*not set*',
          inline: true,
        },
        {
          name: 'Events',
          value: ALL_LOG_EVENTS.map(
            (e) => `${config.logEvents.includes(e) ? '✅' : '⬜'} ${LOG_EVENT_LABELS[e]}`,
          ).join('\n'),
        },
      );
    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
