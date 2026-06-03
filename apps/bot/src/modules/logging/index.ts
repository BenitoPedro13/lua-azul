import type { BotModule } from '../../core/types.js';
import { logging } from './commands/logging.js';
import { guildMemberAdd } from './events/member-add.js';
import { guildMemberRemove } from './events/member-remove.js';
import { messageDelete } from './events/message-delete.js';
import { messageUpdate } from './events/message-update.js';

/**
 * Audit logging (see ADR-0010). Records server events to the AuditLog table and
 * posts them to a configured channel; `/logging` (Manage Server only) controls it.
 *
 * Requires the privileged GuildMembers + MessageContent intents — enabled in the
 * Developer Portal and in client.ts.
 */
export const loggingModule: BotModule = {
  name: 'logging',
  commands: [logging],
  events: [messageDelete, messageUpdate, guildMemberAdd, guildMemberRemove],
};
