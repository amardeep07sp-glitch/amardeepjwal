import { issueService } from '../issue/issue.service.js';
import { orderRefundRepository } from '../order/orderRefund.repository.js';
import { orderShipmentRepository } from '../order/orderShipment.repository.js';
import { customerRepository } from '../customer/customer.repository.js';
import { customerNotifications } from '../customer/customer.notifications.js';
import { logger } from '../../config/logger.js';
import { ISSUE_CATEGORIES, ISSUE_SOURCES } from '../issue/issue.constants.js';

// Phase 59's automation engine - deliberately narrow: it only ever does
// what the spec's own examples show (auto-flag a payment failure, escalate
// a stuck refund, notify on a late delivery). It never auto-creates a
// SupportTicket (a real conversation thread implies someone should decide
// to start one) - only lightweight IssueReports for staff visibility, or a
// plain customer notification, matching "do not create unnecessary
// tickets automatically".
const REFUND_STALE_HOURS = 72;

export const supportAutomation = {
  // Hooked from orderPayment.service.js#handleWebhookEvent's payment.failed
  // branch. Best-effort - a failure here must never break payment webhook
  // processing itself.
  async onPaymentFailed({ orderId, customerId, orderNumber }) {
    try {
      await issueService.createIssue(
        {
          reporterId: customerId,
          category: ISSUE_CATEGORIES.PAYMENT,
          subCategory: 'payment_failed',
          entityType: 'order',
          entityId: String(orderId),
          description: `Automated: a payment attempt failed for order ${orderNumber}.`,
          metadata: { orderNumber },
          source: ISSUE_SOURCES.AUTOMATED,
        },
        null
      );
    } catch (err) {
      logger.error({ err: err.message, orderId }, 'Automation: onPaymentFailed failed');
    }
  },

  // Cron-callable (support.jobs.js) - refunds sitting in PENDING/PROCESSING
  // longer than REFUND_STALE_HOURS get a HIGH-visibility issue report so
  // staff notice without a customer having to complain first. Issue-level
  // dedup (issue.service.js#createIssue) already prevents this from
  // spamming a new report every sweep tick for the same still-stuck refund.
  async sweepDelayedRefunds() {
    const cutoff = new Date(Date.now() - REFUND_STALE_HOURS * 3600000);
    const stale = await orderRefundRepository.findStalePending(cutoff);
    let flagged = 0;

    for (const refund of stale) {
      // eslint-disable-next-line no-await-in-loop
      const order = refund.order;
      if (!order?.customer) continue; // eslint-disable-line no-continue
      try {
        // eslint-disable-next-line no-await-in-loop
        const { isDuplicate } = await issueService.createIssue(
          {
            reporterId: order.customer,
            category: ISSUE_CATEGORIES.REFUND,
            subCategory: 'refund_delayed',
            entityType: 'order_refund',
            entityId: String(refund._id),
            description: `Automated: refund of ₹${refund.amount} for order ${order.orderNumber} has been ${refund.status} for over ${REFUND_STALE_HOURS} hours.`,
            metadata: { orderNumber: order.orderNumber, amount: refund.amount, status: refund.status },
            source: ISSUE_SOURCES.AUTOMATED,
          },
          null
        );
        if (!isDuplicate) flagged += 1;
      } catch (err) {
        logger.error({ err: err.message, refundId: refund._id }, 'Automation: sweepDelayedRefunds failed for one refund');
      }
    }

    return flagged;
  },

  // Cron-callable - a shipment past its own estimatedDelivery and not yet
  // delivered gets the customer a real notification (not a ticket - "notify
  // the customer" is literally the spec's own example for this case).
  // `delayNotifiedAt` makes this idempotent per shipment.
  async sweepDelayedDeliveries() {
    const now = new Date();
    const delayed = await orderShipmentRepository.findDelayedUnnotified(now);
    let notified = 0;

    for (const shipment of delayed) {
      const order = shipment.order;
      if (!order?.customer) continue; // eslint-disable-line no-continue
      try {
        // eslint-disable-next-line no-await-in-loop
        const customer = await customerRepository.findRawById(order.customer);
        if (customer) {
          // eslint-disable-next-line no-await-in-loop
          await customerNotifications.send(customer, {
            subject: `Update on your delivery - order ${order.orderNumber}`,
            message: `Your order ${order.orderNumber} is taking longer than expected to arrive. We're following up with the courier and will update you as soon as we know more.`,
          });
        }
        // eslint-disable-next-line no-await-in-loop
        await orderShipmentRepository.markDelayNotified(shipment._id);
        notified += 1;
      } catch (err) {
        logger.error({ err: err.message, shipmentId: shipment._id }, 'Automation: sweepDelayedDeliveries failed for one shipment');
      }
    }

    return notified;
  },
};
