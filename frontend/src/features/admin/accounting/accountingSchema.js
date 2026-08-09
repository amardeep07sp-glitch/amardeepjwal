export const ACCOUNT_TYPE_LABELS = {
  asset: 'Asset',
  liability: 'Liability',
  equity: 'Equity',
  income: 'Income',
  expense: 'Expense',
};

export const ACCOUNT_TYPE_BADGE_VARIANTS = {
  asset: 'info',
  liability: 'warning',
  equity: 'secondary',
  income: 'success',
  expense: 'destructive',
};

export const JOURNAL_EVENT_TYPE_LABELS = {
  sale: 'Sale',
  sale_payment: 'Sale Payment',
  sale_refund: 'Sale Refund',
  sale_cancellation: 'Sale Cancellation',
  cogs: 'Cost of Goods Sold',
  purchase: 'Purchase',
  supplier_payment: 'Supplier Payment',
  purchase_return: 'Purchase Return',
  expense: 'Expense',
  wallet_credit: 'Wallet Credit',
  wallet_debit: 'Wallet Debit',
  opening_balance: 'Opening Balance',
  manual: 'Manual Journal',
};

export const JOURNAL_STATUS_BADGE_VARIANTS = {
  posted: 'success',
  reversed: 'secondary',
};

export const EXPENSE_STATUS_LABELS = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const EXPENSE_STATUS_BADGE_VARIANTS = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
};

export const EXPENSE_PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  bank: 'Bank',
};
