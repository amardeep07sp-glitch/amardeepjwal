import cron from 'node-cron';
import { logger } from '../../config/logger.js';
import { collectionService } from './collection.service.js';

// Scheduling's "real automation" half (Collection Engine v2.0). The
// customer-facing public read already masks an out-of-window collection at
// request time (collection.repository.js's schedule-window filter) so it's
// correct even before this ever ticks - this sweep exists so the ADMIN list
// view (which shows raw stored `status`, not a computed effective one) stays
// honest too, exactly the same two-layer approach banner scheduling never
// had a cron for, but this spec explicitly asks for.
export function startCollectionJobs() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const published = await collectionService.runAutoPublishSweep();
      const archived = await collectionService.runAutoArchiveSweep();
      if (published || archived) logger.info({ published, archived }, 'Collection: schedule sweep');
    } catch (err) {
      logger.error({ err: err.message }, 'Collection: schedule sweep failed');
    }
  });
}
