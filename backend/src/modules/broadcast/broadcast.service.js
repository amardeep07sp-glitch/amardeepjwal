import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../config/logger.js';
import { broadcastRepository } from './broadcast.repository.js';
import { customerRepository } from '../customer/customer.repository.js';
import { customerPreferenceRepository } from '../customer/customerPreference.repository.js';
import { notificationSender } from '../shared/notification.sender.js';
import { BROADCAST_CHANNELS, BROADCAST_STATUSES } from './broadcast.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Every provider call here is already best-effort/never-throwing
// (notificationSender), so a batch is just "fire N sends, wait for all,
// tally what happened" - no partial-batch rollback concept applies to a
// broadcast the way it would to a financial transaction.
const CHUNK_SIZE = 25;
// A small pause between chunks - not required for correctness, just polite
// to Resend/WhatsApp's own per-second rate limits on a list that could be
// thousands of customers long.
const CHUNK_DELAY_MS = 200;
const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

async function loadPreferenceMap() {
  const prefs = await customerPreferenceRepository.findAllCommunicationPrefs();
  return new Map(prefs.map((p) => [String(p.customer), p.communicationPreference]));
}

// The actual fan-out - deliberately NOT awaited by the controller
// (broadcast.controller.js#createBroadcast responds as soon as the
// Broadcast row is created). No job queue exists in this backend yet (see
// apikey.todo / launch audit), so this runs as a background async task on
// the same process rather than a durable queue - acceptable for this
// scale, but a crash mid-run leaves the broadcast stuck at "sending"
// (visible to the admin via status, not silently lost).
async function processBroadcast(broadcastId) {
  const broadcast = await broadcastRepository.findById(broadcastId);
  if (!broadcast) return;

  const wantsEmail = broadcast.channels.includes(BROADCAST_CHANNELS.EMAIL);
  const wantsWhatsapp = broadcast.channels.includes(BROADCAST_CHANNELS.WHATSAPP);

  await broadcastRepository.updateById(broadcastId, { status: BROADCAST_STATUSES.SENDING, startedAt: new Date() });

  if (!wantsEmail && !wantsWhatsapp) {
    // Website-only broadcast - nothing to send, the row itself is the banner.
    await broadcastRepository.updateById(broadcastId, { status: BROADCAST_STATUSES.COMPLETED, completedAt: new Date() });
    return;
  }

  const stats = {
    totalRecipients: 0,
    emailSent: 0,
    emailFailed: 0,
    emailSkipped: 0,
    whatsappSent: 0,
    whatsappFailed: 0,
    whatsappSkipped: 0,
  };

  try {
    const prefMap = await loadPreferenceMap();
    const cursor = customerRepository.streamAllContacts();
    let chunk = [];

    const flushChunk = async () => {
      if (chunk.length === 0) return;
      stats.totalRecipients += chunk.length;

      await Promise.all(
        chunk.map(async (customer) => {
          const pref = prefMap.get(String(customer._id));
          const emailOptedIn = pref?.email !== false;
          const whatsappOptedIn = pref?.whatsapp !== false;

          if (wantsEmail) {
            if (!customer.email || !emailOptedIn) {
              stats.emailSkipped += 1;
            } else {
              const result = await notificationSender.sendEmail(customer.email, broadcast.title, `<p>${broadcast.message}</p>`);
              if (result.sent) stats.emailSent += 1;
              else stats.emailFailed += 1;
            }
          }

          if (wantsWhatsapp) {
            if (!customer.phone || !whatsappOptedIn) {
              stats.whatsappSkipped += 1;
            } else {
              const result = await notificationSender.sendWhatsApp(customer.phone, `${broadcast.title}\n\n${broadcast.message}`);
              if (result.sent) stats.whatsappSent += 1;
              else stats.whatsappFailed += 1;
            }
          }
        })
      );

      await broadcastRepository.updateById(broadcastId, { stats });
      chunk = [];
      await sleep(CHUNK_DELAY_MS);
    };

    // eslint-disable-next-line no-restricted-syntax
    for await (const customer of cursor) {
      chunk.push(customer);
      if (chunk.length >= CHUNK_SIZE) await flushChunk(); // eslint-disable-line no-await-in-loop
    }
    await flushChunk();

    await broadcastRepository.updateById(broadcastId, { status: BROADCAST_STATUSES.COMPLETED, completedAt: new Date() });
  } catch (err) {
    logger.error({ err: err.message, broadcastId: String(broadcastId) }, 'Broadcast processing failed');
    await broadcastRepository.updateById(broadcastId, {
      status: BROADCAST_STATUSES.FAILED,
      completedAt: new Date(),
      failureReason: err.message,
      stats,
    });
  }
}

export const broadcastService = {
  async createBroadcast(data, userId) {
    const broadcast = await broadcastRepository.create({
      title: data.title,
      message: data.message,
      channels: data.channels,
      expiresAt: data.expiresAt ?? null,
      createdBy: userId,
    });

    // Fire-and-forget - the admin gets an immediate response with the
    // broadcast's id and polls GET /:id for live progress, rather than the
    // request hanging open for however long a full customer-list send
    // takes.
    processBroadcast(broadcast._id).catch((err) => {
      logger.error({ err: err.message, broadcastId: String(broadcast._id) }, 'Unhandled broadcast processing error');
    });

    return broadcast;
  },

  async listBroadcasts(query) {
    const { page, limit } = query;
    const { items, total } = await broadcastRepository.findPaginated({ page, limit });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getBroadcastById(id) {
    const broadcast = await broadcastRepository.findById(id);
    if (!broadcast) throw new ApiError(404, 'Broadcast not found');
    return broadcast;
  },

  async deactivateBroadcast(id) {
    const broadcast = await broadcastRepository.updateById(id, { isActive: false });
    if (!broadcast) throw new ApiError(404, 'Broadcast not found');
    return broadcast;
  },

  getActiveWebsiteBroadcasts() {
    return broadcastRepository.findActiveWebsite();
  },
};
