import { pino } from 'pino';
import { env, isDev } from '../config/env.js';

/**
 * Application logger (structured JSON in prod, pretty in dev).
 *
 * This is *app* logging — operational telemetry about the process. It is
 * deliberately distinct from the bot's audit-logging feature (server events
 * persisted to Postgres + posted to a channel), which lives in the logging module.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
});

export type Logger = typeof logger;
