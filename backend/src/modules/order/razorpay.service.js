import Razorpay from 'razorpay';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';

// Unconfigured (missing keys) is a valid state in dev - callers check
// isConfigured() first and fall back to manual payment recording, same
// graceful-degrade contract as Cloudinary/Redis elsewhere in this app.
const razorpayClient =
  env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    ? new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
    : null;

export const razorpayService = {
  isConfigured: () => Boolean(razorpayClient),

  // Razorpay amounts are always in the smallest currency unit (paise for
  // INR) - the rest of this app works in rupees, so the conversion happens
  // at this one boundary only.
  async createOrder({ amount, currency = 'INR', receipt }) {
    if (!razorpayClient) throw new ApiError(503, 'Razorpay is not configured on this server');
    return razorpayClient.orders.create({ amount: Math.round(amount * 100), currency, receipt });
  },

  // Server-to-server webhook - the authoritative payment-confirmation path.
  // Verified against RAZORPAY_WEBHOOK_SECRET (the dashboard-configured
  // webhook secret, distinct from the API key secret).
  verifyWebhookSignature(rawBody, signature) {
    if (!env.RAZORPAY_WEBHOOK_SECRET || !signature) return false;
    return Razorpay.validateWebhookSignature(rawBody, signature, env.RAZORPAY_WEBHOOK_SECRET);
  },

  // Frontend Checkout success-callback path (razorpay_order_id +
  // razorpay_payment_id + razorpay_signature) - verified against the API
  // key secret. Faster UX than waiting on the webhook, but the webhook
  // still fires and is idempotent (see orderPayment.service.js), so this
  // is a convenience, not the only path that can confirm a payment.
  verifyPaymentSignature({ orderId, paymentId, signature }) {
    if (!razorpayClient || !env.RAZORPAY_KEY_SECRET) return false;
    return Razorpay.validatePaymentVerification(
      { order_id: orderId, payment_id: paymentId },
      signature,
      env.RAZORPAY_KEY_SECRET
    );
  },
};
