import { PrismaClient } from '@prisma/client';
import { isDev } from '../config/env.js';

/**
 * Single shared Prisma client for the process. Generated types come from
 * `prisma generate` (run via `pnpm db:generate` / the build step) — until that
 * runs once, the `@prisma/client` import won't resolve.
 */
export const prisma = new PrismaClient({
  log: isDev ? ['warn', 'error'] : ['error'],
});

export type Db = typeof prisma;
