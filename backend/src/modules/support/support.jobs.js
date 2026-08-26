import cron from 'node-cron';
import { logger } from '../../config/logger.js';
import { slaService } from './sla.service.js';

// SLA Engine's real automation half (Phase 26/58) - every open ticket
// already has its firstResponseDueAt/resolutionDueAt computed at creation/
// priority-change time; this sweep is what actually notices a deadline has
// passed and flips `slaBreached`, same "compute eagerly, sweep to catch
// what elapsed since" split as collection.jobs.js's own scheduling sweep.
export function startSupportSlaSweep() {
  cron.schedule('*/10 * * * *', async () => {
    try {
      const breached = await slaService.sweepBreaches();
      if (breached) logger.info({ breached }, 'Support: SLA sweep');
    } catch (err) {
      logger.error({ err: err.message }, 'Support: SLA sweep failed');
    }
  });
}
