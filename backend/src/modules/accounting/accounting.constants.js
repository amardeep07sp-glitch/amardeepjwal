export const ACCOUNT_TYPES = Object.freeze({
  ASSET: 'asset',
  LIABILITY: 'liability',
  EQUITY: 'equity',
  INCOME: 'income',
  EXPENSE: 'expense',
});

// Which side of a debit/credit pair INCREASES an account's balance, per
// standard double-entry rules - the single place this is decided, consulted
// by journal.service.js#postJournal so no caller ever has to know it.
// Asset/Expense: debit increases. Liability/Equity/Income: credit increases.
export const NORMAL_BALANCE_SIDE = Object.freeze({
  [ACCOUNT_TYPES.ASSET]: 'debit',
  [ACCOUNT_TYPES.EXPENSE]: 'debit',
  [ACCOUNT_TYPES.LIABILITY]: 'credit',
  [ACCOUNT_TYPES.EQUITY]: 'credit',
  [ACCOUNT_TYPES.INCOME]: 'credit',
});

// The fixed, well-known Chart of Accounts every integration hook looks up
// BY CODE (never by name) - seeded once, idempotently, by account.seed.js
// at server boot. Admins may add further (non-system) accounts freely; only
// these codes are ever hardcoded in accountingEvents.service.js.
export const SYSTEM_ACCOUNT_CODES = Object.freeze({
  CASH: '1000',
  BANK: '1010',
  ACCOUNTS_RECEIVABLE: '1100',
  INVENTORY_ASSET: '1200',
  INPUT_CGST: '1800',
  INPUT_SGST: '1810',
  INPUT_IGST: '1820',
  ACCOUNTS_PAYABLE: '2000',
  OUTPUT_CGST: '2100',
  OUTPUT_SGST: '2110',
  OUTPUT_IGST: '2120',
  WALLET_LIABILITY: '2200',
  OPENING_BALANCE_EQUITY: '3000',
  OWNERS_EQUITY: '3100',
  SALES_REVENUE: '4000',
  SHIPPING_INCOME: '4100',
  WALLET_REDEMPTION_REVENUE: '4200',
  SALES_RETURNS: '5000',
  WALLET_CREDITS_EXPENSE: '5100',
  COST_OF_GOODS_SOLD: '6000',
  OPERATING_EXPENSES: '7000',
});

export const JOURNAL_STATUSES = Object.freeze({
  POSTED: 'posted',
  REVERSED: 'reversed',
});

// Every journal.service.js#postJournal call is tagged with exactly one of
// these - the audit trail of "why does this journal exist" without having
// to inspect referenceType/referenceId.
export const ACCOUNTING_EVENT_TYPES = Object.freeze({
  SALE: 'sale',
  SALE_PAYMENT: 'sale_payment',
  SALE_REFUND: 'sale_refund',
  SALE_CANCELLATION: 'sale_cancellation',
  COGS: 'cogs',
  PURCHASE: 'purchase',
  SUPPLIER_PAYMENT: 'supplier_payment',
  PURCHASE_RETURN: 'purchase_return',
  EXPENSE: 'expense',
  WALLET_CREDIT: 'wallet_credit',
  WALLET_DEBIT: 'wallet_debit',
  OPENING_BALANCE: 'opening_balance',
  MANUAL: 'manual',
});

export const PARTY_TYPES = Object.freeze({
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
});

export const EXPENSE_STATUSES = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const EXPENSE_PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  BANK: 'bank',
});

export const TAX_TYPES = Object.freeze({
  CGST: 'cgst',
  SGST: 'sgst',
  IGST: 'igst',
});

// Manual/Sale/Purchase payment methods all resolve to one of these two
// physical-money accounts - see accountingEvents.service.js#resolveTenderAccount.
export const TENDER_ACCOUNT_BY_METHOD = Object.freeze({
  cash: SYSTEM_ACCOUNT_CODES.CASH,
  upi: SYSTEM_ACCOUNT_CODES.BANK,
  card: SYSTEM_ACCOUNT_CODES.BANK,
  bank_transfer: SYSTEM_ACCOUNT_CODES.BANK,
  bank: SYSTEM_ACCOUNT_CODES.BANK,
  wallet: SYSTEM_ACCOUNT_CODES.BANK,
  cod: SYSTEM_ACCOUNT_CODES.CASH,
  razorpay: SYSTEM_ACCOUNT_CODES.BANK,
  cheque: SYSTEM_ACCOUNT_CODES.BANK,
});
