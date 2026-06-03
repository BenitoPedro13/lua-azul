import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { env } from './config/env.js';

/**
 * Build the discord.js client with least-privilege intents (see ADR-0010).
 *
 * Non-privileged (always on — the bot logs in out of the box):
 *   - Guilds            baseline caches
 *   - GuildVoiceStates  music: who's in which voice channel
 *   - GuildMessages     logging: message delete/edit events
 *
 * Privileged (only requested when LOGGING_ENABLED=true). These MUST also be toggled
 * on in the Developer Portal, or the gateway rejects login with "Used disallowed
 * intents":
 *   - GuildMembers      member join/leave
 *   - MessageContent    content of deleted/edited messages
 */
export function createClient(): Client {
  const intents = [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
  ];

  if (env.LOGGING_ENABLED) {
    intents.push(GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent);
  }

  return new Client({
    intents,
    // Needed to receive events for uncached messages/channels (e.g. old message deletes).
    partials: [Partials.Message, Partials.Channel],
  });
}
