import type { BotModule } from '../../core/types.js';
import { ping } from './commands/ping.js';

/** Small utility commands not tied to a bigger feature. */
export const miscModule: BotModule = {
  name: 'misc',
  commands: [ping],
};
