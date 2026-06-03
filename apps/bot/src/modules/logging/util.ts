import { Prisma } from '@prisma/client';
import type { EmbedBuilder, Guild } from 'discord.js';
import { prisma } from '../../lib/db.js';
import { getGuildConfig } from '../../lib/guild-config.js';
import { logger } from '../../lib/logger.js';

/** The events the logging module can record. Stored in `GuildConfig.logEvents`. */
export const ALL_LOG_EVENTS = [
  'messageDelete',
  'messageUpdate',
  'guildMemberAdd',
  'guildMemberRemove',
] as const;

export type LogEventType = (typeof ALL_LOG_EVENTS)[number];

export const LOG_EVENT_LABELS: Record<LogEventType, string> = {
  messageDelete: 'Message deleted',
  messageUpdate: 'Message edited',
  guildMemberAdd: 'Member joined',
  guildMemberRemove: 'Member left',
};

export const LOG_COLORS = {
  delete: 0xed4245,
  edit: 0xfee75c,
  join: 0x57f287,
  leave: 0xeb6f92,
} as const;

interface LogPayload {
  embed: EmbedBuilder;
  actorId?: string | null;
  channelId?: string | null;
  payload?: Prisma.InputJsonValue;
}

/**
 * The single sink every logging event flows through: checks the guild's config,
 * persists an AuditLog row, and posts the embed to the configured channel. A
 * no-op if logging is off, no channel is set, or this event type is disabled.
 */
export async function dispatchLog(
  guild: Guild,
  type: LogEventType,
  { embed, actorId, channelId, payload }: LogPayload,
): Promise<void> {
  const config = await getGuildConfig(guild.id);
  if (!config.loggingEnabled || !config.logChannelId || !config.logEvents.includes(type)) {
    return;
  }

  // Persist first (cheap, durable) — the channel post is best-effort.
  await prisma.auditLog
    .create({
      data: {
        guildId: guild.id,
        type,
        actorId: actorId ?? null,
        channelId: channelId ?? null,
        payload: payload ?? Prisma.JsonNull,
      },
    })
    .catch((err) => logger.error({ err, type }, 'failed to write audit log'));

  const channel = guild.channels.cache.get(config.logChannelId);
  if (channel?.isTextBased()) {
    await channel
      .send({ embeds: [embed] })
      .catch((err) => logger.warn({ err, type }, 'failed to post log embed'));
  }
}
