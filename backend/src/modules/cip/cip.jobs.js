import cron from 'node-cron';
import { logger } from '../../config/logger.js';
import { sessionService } from './session.service.js';
import { segmentationService } from './segmentation.service.js';

// "Batch processing ready" (Performance section) - node-cron was already an
// installed dependency, unused anywhere in this codebase until now; wiring
// it here is the honest fulfillment of that requirement rather than a
// comment promising future infrastructure.
export function startCipJobs() {
  // Every 5 minutes - no session is left "open" forever just because its
  // tab was closed without a beacon firing (session.service.js#closeSession
  // handles the explicit-beacon path; this catches everything else).
  cron.schedule('*/5 * * * *', async () => {
    try {
      const closed = await sessionService.closeStaleSessions();
      if (closed > 0) logger.info({ closed }, 'CIP: closed stale sessions');
    } catch (err) {
      logger.error({ err: err.message }, 'CIP: stale-session sweep failed');
    }
  });

  // Once a day - "Auto Generate" segmentation is a batch recompute, not a
  // live-on-every-request calculation (segmentation.service.js's own
  // aggregations scan the full Order/Event history, deliberately not cheap
  // enough to run per page load). Also exposed as an on-demand admin
  // endpoint (POST /cip/segments/recompute) for immediate/testing use.
  cron.schedule('0 2 * * *', async () => {
    try {
      const result = await segmentationService.recomputeAllSegments();
      logger.info(result, 'CIP: segments recomputed');
    } catch (err) {
      logger.error({ err: err.message }, 'CIP: segment recompute failed');
    }
  });
}
