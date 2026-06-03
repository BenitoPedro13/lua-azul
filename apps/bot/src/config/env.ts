import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

// Load the repo-root .env regardless of cwd. From this file:
//   src/config/env.ts      -> ../../../../.env   (apps/bot/src/config -> root)
//   dist/config/env.js     -> ../../../../.env   (apps/bot/dist/config -> root)
// In production, env vars are injected by the platform and the file simply won't
// exist — dotenv silently no-ops, which is fine.
const here = dirname(fileURLToPath(import.meta.url));
loadDotenv({ path: resolve(here, '../../../../.env') });
loadDotenv(); // also pick up a local apps/bot/.env if present (does not override)

// A "false"/"true" string env flag → boolean. (z.coerce.boolean treats any
// non-empty string as true, so "false" would wrongly become true — avoid it.)
const boolish = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

const schema = z.object({
  // Discord
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required'),
  DISCORD_DEV_GUILD_ID: z.string().optional(),

  // Runtime
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  // Database
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid connection URL'),

  // Lavalink
  LAVALINK_HOST: z.string().default('localhost'),
  LAVALINK_PORT: z.coerce.number().int().positive().default(2333),
  LAVALINK_PASSWORD: z.string().min(1, 'LAVALINK_PASSWORD is required'),
  LAVALINK_SECURE: boolish.default('false'),

  // Features
  // Gates the logging module + its privileged intents. Keep false until the
  // Server Members + Message Content intents are enabled in the Developer Portal.
  LOGGING_ENABLED: boolish.default('false'),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  • ${i.path.join('.') || '(root)'}: ${i.message}`)
    .join('\n');
  // Use console here: the logger depends on this module, so it isn't ready yet.
  console.error(`\n❌ Invalid environment configuration:\n${issues}\n`);
  console.error('Check your .env against .env.example.\n');
  process.exit(1);
}

/** Validated, frozen environment. Import this instead of touching process.env. */
export const env = Object.freeze(parsed.data);
export type Env = typeof env;

export const isProd = env.NODE_ENV === 'production';
export const isDev = env.NODE_ENV === 'development';
