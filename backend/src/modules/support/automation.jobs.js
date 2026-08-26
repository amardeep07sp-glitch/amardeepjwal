import cron from 'node-cron';
import { logger } from '../../config/logger.js';
import { supportAutomation } from './supportAutomation.service.js';

// Phase 59's other two sweep-driven automations (payment failure is event-
// driven off the Razorpay webhook instead, see orderPayment.service.js).
// Every 30 minutes is frequent enough that a stuck refund or a delayed
// shipment is caught same-day without adding meaningful load - same
// cadence class as the SLA sweep, just less time-sensitive.
export function startAutomationSweeps() {
  cron.schedule('*/30 * * * *', async () => {
    try {
      const flagged = await supportAutomation.sweepDelayedRefunds();
      if (flagged) logger.info({ flagged }, 'Automation: delayed-refund sweep');
    } catch (err) {
      logger.error({ err: err.message }, 'Automation: delayed-refund sweep failed');
    }

    try {
      const notified = await supportAutomation.sweepDelayedDeliveries();
      if (notified) logger.info({ notified }, 'Automation: delayed-delivery sweep');
    } catch (err) {
      logger.error({ err: err.message }, 'Automation: delayed-delivery sweep failed');
    }
  });
}
