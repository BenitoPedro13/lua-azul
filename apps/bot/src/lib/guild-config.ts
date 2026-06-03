import type { GuildConfig } from '@prisma/client';
import { prisma } from './db.js';

/**
 * Fetch a guild's config, creating a default row on first access. Centralized so
 * every module reads settings the same way (music volume, DJ role, log channel…).
 */
export async function getGuildConfig(guildId: string): Promise<GuildConfig> {
  return prisma.guildConfig.upsert({
    where: { guildId },
    update: {},
    create: {
      guild: { connectOrCreate: { where: { id: guildId }, create: { id: guildId } } },
    },
  });
}
