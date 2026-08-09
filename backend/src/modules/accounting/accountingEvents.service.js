import { ApiError } from '../../utils/ApiError.js';
import { accountRepository } from './account.repository.js';
import { journalRepository } from './journal.repository.js';
import { journalService } from './journal.service.js';
import { taxService } from './tax.service.js';
import { ACCOUNTING_EVENT_TYPES, SYSTEM_ACCOUNT_CODES, TENDER_ACCOUNT_BY_METHOD, PARTY_TYPES } from './accounting.constants.js';

// ===========================================================================
// THE only surface Orders/Purchase/CRM(Wallet)/Inventory ever import from
// the accounting module. Every method here is a thin, named wrapper that
// (a) knows which system accounts a given business event touches and
// (b) calls journalService.postJournal() - it never mutates a Journal/
// JournalLine/Account document itself. This is the literal embodiment of
// the Phase 10 spec's "No accounting logic inside Orders, Purchase,
// Inventory or CRM. Accounting is an independent Financial Engine." - the
// calling module reports "this happened" with raw business data (amounts,
// ids); Accounting alone decides debit/credit accounts and posts the entry.
// Every method accepts the caller's existing transaction session so the
// journal is posted atomically with the business change it explains -
// same session-threading contract as inventoryLedgerService.recordMovement.
// ===========================================================================

async function resolveAccount(code, session) {
  const account = await accountRepository.findByCode(code, session);
  if (!account) throw new ApiError(500, `Accounting system account "${code}" is missing - run account seeding`);
  return account;
}

function resolveTenderAccountCode(method) {
  return TENDER_ACCOUNT_BY_METHOD[method] ?? SYSTEM_ACCOUNT_CODES.BANK;
}

export const accountingEvents = {
  // Order confirmed - the point a sale becomes a real, committed
  // receivable. Dr Accounts Receivable (grandTotal) / Cr Sales Revenue
  // (subtotal) / Cr Shipping & Handling Income / Dr Sales Returns &
  // Allowances (couponDiscount, contra-revenue) - built to balance against
  // Order's own grandTotal formula exactly (see order.service.js
  // #recalculateOrderTotals): grandTotal = subtotal - couponDiscount +
  // shippingCharge + handlingCharge.
  async recordSaleInvoice({ orderId, customerId, orderNumber, subtotal, couponDiscount, shippingCharge, handlingCharge, grandTotal, performedBy }, session) {
    const [ar, revenue, shippingIncome, salesReturns] = await Promise.all([
      resolveAccount(SYSTEM_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, session),
      resolveAccount(SYSTEM_ACCOUNT_CODES.SALES_REVENUE, session),
      resolveAccount(SYSTEM_ACCOUNT_CODES.SHIPPING_INCOME, session),
      resolveAccount(SYSTEM_ACCOUNT_CODES.SALES_RETURNS, session),
    ]);

    const party = { type: PARTY_TYPES.CUSTOMER, id: customerId };
    const lines = [{ account: ar._id, debit: grandTotal, credit: 0, party }];
    if (subtotal > 0) lines.push({ account: revenue._id, debit: 0, credit: subtotal });
    if (shippingCharge + handlingCharge > 0) lines.push({ account: shippingIncome._id, debit: 0, credit: shippingCharge + handlingCharge });
    if (couponDiscount > 0) lines.push({ account: salesReturns._id, debit: couponDiscount, credit: 0 });

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.SALE,
        referenceType: 'order',
        referenceId: orderId,
        narration: `Sale invoice for order ${orderNumber}`,
        lines,
        performedBy,
      },
      session
    );
  },

  // Cost of Goods Sold, recognized when reserved stock actually converts to
  // a sale (order.service.js#markDelivered) - the Inventory Asset side of
  // the loop Purchase Accounting's GRN entry opened. Dr COGS / Cr Inventory
  // Asset, valued at the product's cost price at the moment of sale.
  async recordCogs({ orderId, orderNumber, amount, performedBy }, session) {
    if (amount <= 0) return null;
    const [cogs, inventoryAsset] = await Promise.all([
      resolveAccount(SYSTEM_ACCOUNT_CODES.COST_OF_GOODS_SOLD, session),
      resolveAccount(SYSTEM_ACCOUNT_CODES.INVENTORY_ASSET, session),
    ]);

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.COGS,
        referenceType: 'order',
        referenceId: orderId,
        narration: `Cost of goods sold for order ${orderNumber}`,
        lines: [
          { account: cogs._id, debit: amount, credit: 0 },
          { account: inventoryAsset._id, debit: 0, credit: amount },
        ],
        performedBy,
      },
      session
    );
  },

  // A payment is recorded against an order - Dr Cash/Bank (money actually
  // received) / Cr Accounts Receivable (the debt is settled).
  async recordSalePayment({ orderId, customerId, orderNumber, method, amount, performedBy }, session) {
    const [tender, ar] = await Promise.all([
      resolveAccount(resolveTenderAccountCode(method), session),
      resolveAccount(SYSTEM_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, session),
    ]);

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.SALE_PAYMENT,
        referenceType: 'order',
        referenceId: orderId,
        narration: `Payment received for order ${orderNumber}`,
        lines: [
          { account: tender._id, debit: amount, credit: 0 },
          { account: ar._id, debit: 0, credit: amount, party: { type: PARTY_TYPES.CUSTOMER, id: customerId } },
        ],
        performedBy,
      },
      session
    );
  },

  // Money actually paid back to a customer - Dr Sales Returns & Allowances
  // (revenue given back) / Cr Cash/Bank.
  async recordSaleRefund({ orderId, customerId, orderNumber, method, amount, performedBy }, session) {
    const [salesReturns, tender] = await Promise.all([
      resolveAccount(SYSTEM_ACCOUNT_CODES.SALES_RETURNS, session),
      resolveAccount(resolveTenderAccountCode(method), session),
    ]);

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.SALE_REFUND,
        referenceType: 'order',
        referenceId: orderId,
        narration: `Refund issued for order ${orderNumber}`,
        lines: [
          { account: salesReturns._id, debit: amount, credit: 0, party: { type: PARTY_TYPES.CUSTOMER, id: customerId } },
          { account: tender._id, debit: 0, credit: amount },
        ],
        performedBy,
      },
      session
    );
  },

  // An order is cancelled before/without payment - reverses the original
  // Sale Invoice journal (if one was ever posted) so revenue recognized on
  // a now-void order is fully undone. A no-op if no invoice journal exists
  // yet (e.g. the order was cancelled before confirmation).
  async recordSaleCancellation({ orderId, reason, performedBy }, session) {
    const original = await journalRepository.findByReference('order', orderId, session);
    if (!original) return null;
    return journalService.reverseJournal(original._id, { reason: reason || 'Order cancelled', performedBy }, session);
  },

  // Goods Receipt Note - Dr Inventory Asset (ex-tax value received) / Dr
  // Input GST (the received line's proportional share of the PO's total
  // tax) / Cr Accounts Payable.
  async recordPurchaseReceipt({ purchaseOrderId, supplierId, poNumber, grnValue, taxAmount, isInterState, performedBy }, session) {
    const [inventoryAsset, ap] = await Promise.all([
      resolveAccount(SYSTEM_ACCOUNT_CODES.INVENTORY_ASSET, session),
      resolveAccount(SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE, session),
    ]);

    const lines = [{ account: inventoryAsset._id, debit: grnValue, credit: 0 }];

    if (taxAmount > 0) {
      const split = taxService.splitTax(taxAmount, isInterState);
      if (split.igst > 0) {
        const igst = await resolveAccount(SYSTEM_ACCOUNT_CODES.INPUT_IGST, session);
        lines.push({ account: igst._id, debit: split.igst, credit: 0 });
      }
      if (split.cgst > 0) {
        const cgst = await resolveAccount(SYSTEM_ACCOUNT_CODES.INPUT_CGST, session);
        lines.push({ account: cgst._id, debit: split.cgst, credit: 0 });
      }
      if (split.sgst > 0) {
        const sgst = await resolveAccount(SYSTEM_ACCOUNT_CODES.INPUT_SGST, session);
        lines.push({ account: sgst._id, debit: split.sgst, credit: 0 });
      }
    }

    lines.push({ account: ap._id, debit: 0, credit: grnValue + taxAmount, party: { type: PARTY_TYPES.SUPPLIER, id: supplierId } });

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.PURCHASE,
        referenceType: 'purchase_order',
        referenceId: purchaseOrderId,
        narration: `Goods received against ${poNumber}`,
        lines,
        performedBy,
      },
      session
    );
  },

  // A payment is made to a supplier - Dr Accounts Payable / Cr Cash/Bank.
  async recordSupplierPayment({ supplierId, purchaseOrderId, method, amount, performedBy }, session) {
    const [ap, tender] = await Promise.all([
      resolveAccount(SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE, session),
      resolveAccount(resolveTenderAccountCode(method), session),
    ]);

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.SUPPLIER_PAYMENT,
        referenceType: 'purchase_order',
        referenceId: purchaseOrderId,
        narration: 'Payment made to supplier',
        lines: [
          { account: ap._id, debit: amount, credit: 0, party: { type: PARTY_TYPES.SUPPLIER, id: supplierId } },
          { account: tender._id, debit: 0, credit: amount },
        ],
        performedBy,
      },
      session
    );
  },

  // A previously-recorded supplier payment is refunded/reversed - the exact
  // opposite of recordSupplierPayment.
  async recordSupplierPaymentRefund({ supplierId, purchaseOrderId, method, amount, performedBy }, session) {
    const [tender, ap] = await Promise.all([
      resolveAccount(resolveTenderAccountCode(method), session),
      resolveAccount(SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE, session),
    ]);

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.SUPPLIER_PAYMENT,
        referenceType: 'purchase_order',
        referenceId: purchaseOrderId,
        narration: 'Supplier payment refunded',
        lines: [
          { account: tender._id, debit: amount, credit: 0 },
          { account: ap._id, debit: 0, credit: amount, party: { type: PARTY_TYPES.SUPPLIER, id: supplierId } },
        ],
        performedBy,
      },
      session
    );
  },

  // Goods sent back to a supplier - Dr Accounts Payable (what we owe them
  // shrinks) / Cr Inventory Asset (the stock value leaves) / Cr Input GST
  // (its proportional tax is reversed too).
  async recordPurchaseReturn({ purchaseOrderId, supplierId, returnNumber, returnValue, taxAmount, isInterState, performedBy }, session) {
    const [ap, inventoryAsset] = await Promise.all([
      resolveAccount(SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE, session),
      resolveAccount(SYSTEM_ACCOUNT_CODES.INVENTORY_ASSET, session),
    ]);

    const lines = [{ account: ap._id, debit: returnValue + taxAmount, credit: 0, party: { type: PARTY_TYPES.SUPPLIER, id: supplierId } }];
    lines.push({ account: inventoryAsset._id, debit: 0, credit: returnValue });

    if (taxAmount > 0) {
      const split = taxService.splitTax(taxAmount, isInterState);
      if (split.igst > 0) {
        const igst = await resolveAccount(SYSTEM_ACCOUNT_CODES.INPUT_IGST, session);
        lines.push({ account: igst._id, debit: 0, credit: split.igst });
      }
      if (split.cgst > 0) {
        const cgst = await resolveAccount(SYSTEM_ACCOUNT_CODES.INPUT_CGST, session);
        lines.push({ account: cgst._id, debit: 0, credit: split.cgst });
      }
      if (split.sgst > 0) {
        const sgst = await resolveAccount(SYSTEM_ACCOUNT_CODES.INPUT_SGST, session);
        lines.push({ account: sgst._id, debit: 0, credit: split.sgst });
      }
    }

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.PURCHASE_RETURN,
        referenceType: 'purchase_return',
        referenceId: purchaseOrderId,
        narration: `Goods returned to supplier (${returnNumber})`,
        lines,
        performedBy,
      },
      session
    );
  },

  // An approved expense is posted - Dr the expense category's account (or
  // General Operating Expenses if the category has none) / Cr Cash/Bank.
  async recordExpense({ expenseId, accountId, method, amount, description, performedBy }, session) {
    const [expenseAccount, tender] = await Promise.all([
      accountId ? accountRepository.findRawById(accountId, session) : resolveAccount(SYSTEM_ACCOUNT_CODES.OPERATING_EXPENSES, session),
      resolveAccount(resolveTenderAccountCode(method), session),
    ]);
    if (!expenseAccount) throw new ApiError(404, 'Expense account not found');

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.EXPENSE,
        referenceType: 'expense',
        referenceId: expenseId,
        narration: description || 'Expense',
        lines: [
          { account: expenseAccount._id, debit: amount, credit: 0 },
          { account: tender._id, debit: 0, credit: amount },
        ],
        performedBy,
      },
      session
    );
  },

  // A wallet credit increases our liability to the customer - treated as a
  // goodwill/marketing expense unless a future phase distinguishes a real
  // cash top-up. Dr Wallet Credits Issued (Expense) / Cr Customer Wallet
  // Balance (Liability).
  async recordWalletCredit({ customerId, amount, reason, performedBy }, session) {
    const [expense, walletLiability] = await Promise.all([
      resolveAccount(SYSTEM_ACCOUNT_CODES.WALLET_CREDITS_EXPENSE, session),
      resolveAccount(SYSTEM_ACCOUNT_CODES.WALLET_LIABILITY, session),
    ]);

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.WALLET_CREDIT,
        referenceType: 'customer_wallet',
        referenceId: customerId,
        narration: reason || 'Wallet credited',
        lines: [
          { account: expense._id, debit: amount, credit: 0, party: { type: PARTY_TYPES.CUSTOMER, id: customerId } },
          { account: walletLiability._id, debit: 0, credit: amount, party: { type: PARTY_TYPES.CUSTOMER, id: customerId } },
        ],
        performedBy,
      },
      session
    );
  },

  // A wallet debit/redemption reduces the liability and is recognized as
  // revenue (the stored value has now actually been spent) - Dr Customer
  // Wallet Balance (Liability) / Cr Wallet Redemption Revenue (Income).
  async recordWalletDebit({ customerId, amount, reason, performedBy }, session) {
    const [walletLiability, revenue] = await Promise.all([
      resolveAccount(SYSTEM_ACCOUNT_CODES.WALLET_LIABILITY, session),
      resolveAccount(SYSTEM_ACCOUNT_CODES.WALLET_REDEMPTION_REVENUE, session),
    ]);

    return journalService.postJournal(
      {
        eventType: ACCOUNTING_EVENT_TYPES.WALLET_DEBIT,
        referenceType: 'customer_wallet',
        referenceId: customerId,
        narration: reason || 'Wallet debited',
        lines: [
          { account: walletLiability._id, debit: amount, credit: 0, party: { type: PARTY_TYPES.CUSTOMER, id: customerId } },
          { account: revenue._id, debit: 0, credit: amount, party: { type: PARTY_TYPES.CUSTOMER, id: customerId } },
        ],
        performedBy,
      },
      session
    );
  },
};
