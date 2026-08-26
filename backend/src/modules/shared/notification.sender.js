import { Resend } from 'resend';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

// Extracted from order.notifications.js (Phase 7) once a second domain
// (Customer, Phase 8) needed the identical Resend/WhatsApp mechanics -
// "no duplicate code". Both order.notifications.js and
// customer/customer.notifications.js are now thin per-domain wrappers over
// this: each owns its own message copy/templates, this owns only how a
// message actually gets sent.
//
// Best-effort by design - never throws. No-ops silently (returns
// { sent: false }) if the relevant env keys are unset, same graceful
// -degrade contract as Cloudinary/Redis elsewhere in this app.
const resendClient = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const notificationSender = {
  isEmailConfigured: () => Boolean(resendClient),
  isWhatsAppConfigured: () => Boolean(env.WHATSAPP_TOKEN && env.WHATSAPP_PHONE_ID),

  async sendEmail(to, subject, html) {
    if (!resendClient || !to) return { sent: false, reason: 'Email not configured or no recipient' };
    try {
      await resendClient.emails.send({ from: 'notifications@amardeepshitalaprashad.com', to, subject, html });
      return { sent: true };
    } catch (err) {
      logger.warn({ err: err.message, to }, 'Notification email failed');
      return { sent: false, reason: err.message };
    }
  },

  async sendWhatsApp(to, message) {
    if (!env.WHATSAPP_TOKEN || !env.WHATSAPP_PHONE_ID || !to) {
      return { sent: false, reason: 'WhatsApp not configured or no recipient' };
    }
    try {
      const res = await fetch(`https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: message },
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        logger.warn({ status: res.status, body, to }, 'Notification WhatsApp send failed');
        return { sent: false, reason: `HTTP ${res.status}` };
      }
      return { sent: true };
    } catch (err) {
      logger.warn({ err: err.message, to }, 'Notification WhatsApp send failed');
      return { sent: false, reason: err.message };
    }
  },
};
