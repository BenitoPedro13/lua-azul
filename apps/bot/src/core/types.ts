import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  Client,
  ClientEvents,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import type { Db } from '../lib/db.js';
import type { Logger } from '../lib/logger.js';

/** Any of the slash-command builder shapes — all expose `.name` and `.toJSON()`. */
export type SlashCommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder
  | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;

/** A single slash command: its definition + runtime handlers. */
export interface Command {
  data: SlashCommandData;
  /** If true, the command only works inside a guild (rejected in DMs). */
  guildOnly?: boolean;
  execute(interaction: ChatInputCommandInteraction): Promise<void> | void;
  autocomplete?(interaction: AutocompleteInteraction): Promise<void> | void;
}

/** A typed gateway event handler. Use `defineEvent` for full inference. */
export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute(...args: ClientEvents[K]): Promise<void> | void;
}

/** Authoring helper that preserves the event-name → args type relationship. */
export function defineEvent<K extends keyof ClientEvents>(event: Event<K>): Event<K> {
  return event;
}

/** Context handed to a module's optional `init()`. */
export interface ModuleContext {
  client: Client;
  logger: Logger;
  prisma: Db;
}

/** A self-contained feature: its commands, events, and one-time setup. */
export interface BotModule {
  name: string;
  commands?: Command[];
  events?: Event[];
  /** Run once during boot, after events are wired (e.g. connect Lavalink). */
  init?(ctx: ModuleContext): Promise<void> | void;
}
