import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { purchaseOrderRepository } from './purchaseOrder.repository.js';
import { supplierPaymentRepository } from './supplierPayment.repository.js';
import { supplierLedgerService } from './supplierLedger.service.js';
import { accountingEvents } from '../accounting/accountingEvents.service.js';
import { purchaseAudit } from './purchase.audit.js';
import { PO_PAYMENT_STATUSES, SUPPLIER_PAYMENT_STATUSES, SUPPLIER_LEDGER_TYPES } from './purchase.constants.js';
import { SUPPLIER_TIMELINE_EVENTS } from '../supplier/supplier.constants.js';

// Recomputes PurchaseOrder.paymentStatus from the sum of its 'paid'
// SupplierPayment rows vs grandTotal - the single place this rollup is
// derived, exact mirror of orderPayment.service.js
// #recomputeOrderPaymentStatus.
async function recomputePurchaseOrderPaymentStatus(purchaseOrderId, session) {
  const purchaseOrder = await purchaseOrderRepository.findRawById(purchaseOrderId, session);
  const totalPaid = await supplierPaymentRepository.sumPaidByPurchaseOrder(purchaseOrderId, session);

  if (totalPaid <= 0) purchaseOrder.paymentStatus = PO_PAYMENT_STATUSES.PENDING;
  else if (totalPaid < purchaseOrder.grandTotal) purchaseOrder.paymentStatus = PO_PAYMENT_STATUSES.PARTIAL;
  else purchaseOrder.paymentStatus = PO_PAYMENT_STATUSES.PAID;

  await purchaseOrder.save({ session: session ?? undefined });
  return purchaseOrder;
}

export const supplierPaymentService = {
  listForSupplier(supplierId) {
    return supplierPaymentRepository.findBySupplier(supplierId);
  },

  listForPurchaseOrder(purchaseOrderId) {
    return supplierPaymentRepository.findByPurchaseOrder(purchaseOrderId);
  },

  // Cash/UPI/Bank/Cheque - a staff member is physically confirming money
  // already paid out, so the row is recorded as paid immediately (no
  // separate "authorized" step, mirroring OrderPayment's manual path).
  async recordPayment(supplierId, { purchaseOrder, method, amount, transactionReference }, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const payment = await supplierPaymentRepository.create(
        {
          supplier: supplierId,
          purchaseOrder: purchaseOrder || null,
          method,
          amount,
          status: SUPPLIER_PAYMENT_STATUSES.PAID,
          transactionReference: transactionReference || '',
          paidAt: new Date(),
          recordedBy: userId,
        },
        session
      );

      // Paying the supplier reduces what we owe them - a negative ledger
      // delta against outstandingBalance.
      await supplierLedgerService.recordEntry(
        {
          supplierId,
          type: SUPPLIER_LEDGER_TYPES.PAYMENT,
          amount: -amount,
          reason: 'Payment made to supplier',
          referenceType: 'supplier_payment',
          referenceId: payment._id,
          performedBy: userId,
        },
        session
      );

      await accountingEvents.recordSupplierPayment({ supplierId, purchaseOrderId: purchaseOrder || null, method, amount, performedBy: userId }, session);

      if (purchaseOrder) {
        await recomputePurchaseOrderPaymentStatus(purchaseOrder, session);
      }

      await purchaseAudit.record(
        {
          supplierId,
          event: SUPPLIER_TIMELINE_EVENTS.PAYMENT_RECORDED,
          action: 'supplier_payment.recorded',
          newValue: { method, amount, purchaseOrder },
          performedBy: userId,
        },
        session
      );

      await session.commitTransaction();
      return payment;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // A previously recorded payment turns out to be wrong (overpaid, wrong
  // supplier, etc.) - reverses its ledger effect rather than deleting the
  // historical row (immutable ledger, per Phase 9 spec).
  async refundPayment(paymentId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const payment = await supplierPaymentRepository.findById(paymentId, session);
      if (!payment) throw new ApiError(404, 'Payment not found');
      if (payment.status === SUPPLIER_PAYMENT_STATUSES.REFUNDED) {
        throw new ApiError(400, 'This payment has already been refunded');
      }

      payment.status = SUPPLIER_PAYMENT_STATUSES.REFUNDED;
      await payment.save({ session });

      // Reversing a payment increases what we owe again - a positive
      // ledger delta.
      await supplierLedgerService.recordEntry(
        {
          supplierId: payment.supplier,
          type: SUPPLIER_LEDGER_TYPES.PAYMENT,
          amount: payment.amount,
          reason: 'Supplier payment refunded/reversed',
          referenceType: 'supplier_payment',
          referenceId: payment._id,
          performedBy: userId,
        },
        session
      );

      await accountingEvents.recordSupplierPaymentRefund(
        { supplierId: payment.supplier, purchaseOrderId: payment.purchaseOrder || null, method: payment.method, amount: payment.amount, performedBy: userId },
        session
      );

      if (payment.purchaseOrder) {
        await recomputePurchaseOrderPaymentStatus(payment.purchaseOrder, session);
      }

      await purchaseAudit.record(
        {
          supplierId: payment.supplier,
          event: SUPPLIER_TIMELINE_EVENTS.PAYMENT_REFUNDED,
          action: 'supplier_payment.refunded',
          newValue: { amount: payment.amount },
          performedBy: userId,
        },
        session
      );

      await session.commitTransaction();
      return payment;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};
