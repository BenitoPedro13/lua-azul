import { env } from '../config/env.js';
import type { BotModule } from '../core/types.js';
import { loggingModule } from './logging/index.js';
import { miscModule } from './misc/index.js';
import { musicModule } from './music/index.js';

/**
 * The ordered list of active modules. Add a feature by dropping a folder under
 * modules/ and registering its manifest here. Coming next: engagement
 * (see docs/ROADMAP.md).
 *
 * Logging is gated behind LOGGING_ENABLED because it requires privileged intents —
 * with the flag off, neither the module nor its intents are loaded.
 */
export const modules: BotModule[] = [
  miscModule,
  musicModule,
  ...(env.LOGGING_ENABLED ? [loggingModule] : []),
];
