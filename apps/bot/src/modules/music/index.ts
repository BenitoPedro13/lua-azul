import type { BotModule } from '../../core/types.js';
import { nowplaying } from './commands/nowplaying.js';
import { play } from './commands/play.js';
import { queue } from './commands/queue.js';
import { skip } from './commands/skip.js';
import { stop } from './commands/stop.js';
import { volume } from './commands/volume.js';
import { setupLavalink } from './lavalink.js';

/**
 * Music playback via Lavalink (see ADR-0009). `init` wires the manager + the voice
 * bridge; commands talk to it through `interaction.client.lavalink`.
 *
 * Requires the GuildVoiceStates intent (already enabled in client.ts).
 */
export const musicModule: BotModule = {
  name: 'music',
  commands: [play, skip, stop, queue, nowplaying, volume],
  init: ({ client }) => {
    setupLavalink(client);
  },
};
