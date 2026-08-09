import mongoose from 'mongoose';
import { PAYMENT_METHODS, PAYMENT_STATUSES } from './order.constants.js';

const orderPaymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    method: { type: String, enum: Object.values(PAYMENT_METHODS), required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(PAYMENT_STATUSES), default: PAYMENT_STATUSES.PENDING },
    transactionReference: { type: String, trim: true, default: '' },
    // Razorpay-specific - null for manual methods (cash/upi/card/bank
    // transfer/wallet/cod recorded by an admin, not the gateway).
    gatewayOrderId: { type: String, trim: true, default: null },
    gatewayPaymentId: { type: String, trim: true, default: null },
    gatewaySignature: { type: String, trim: true, default: null },
    paidAt: { type: Date, default: null },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Idempotency guard for "prevent double payment processing" (Security
// section, Phase 7 spec) - a webhook or verify-callback firing twice for
// the same Razorpay payment can never create two OrderPayment rows. Partial
// so multiple manual-method rows (gatewayPaymentId: null) never collide.
orderPaymentSchema.index(
  { gatewayPaymentId: 1 },
  { unique: true, partialFilterExpression: { gatewayPaymentId: { $type: 'string' } } }
);

export const OrderPayment = mongoose.model('OrderPayment', orderPaymentSchema);
