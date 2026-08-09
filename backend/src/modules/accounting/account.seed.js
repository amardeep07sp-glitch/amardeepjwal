import { accountRepository } from './account.repository.js';
import { ACCOUNT_TYPES, SYSTEM_ACCOUNT_CODES } from './accounting.constants.js';

// The fixed set of accounts every accounting-event hook (Sales/Purchase/
// Wallet/Expense) looks up by code - seeded once, idempotently, at server
// boot, same bootstrap discipline as warehouseService.ensureDefaultWarehouse
// / customerSegmentService.ensureSystemSegments. Never edited by an admin
// (see account.service.js's isSystem guard) - only new, additional
// non-system accounts may be freely added on top.
const SYSTEM_ACCOUNTS = [
  { code: SYSTEM_ACCOUNT_CODES.CASH, name: 'Cash', type: ACCOUNT_TYPES.ASSET },
  { code: SYSTEM_ACCOUNT_CODES.BANK, name: 'Bank', type: ACCOUNT_TYPES.ASSET },
  { code: SYSTEM_ACCOUNT_CODES.ACCOUNTS_RECEIVABLE, name: 'Accounts Receivable', type: ACCOUNT_TYPES.ASSET },
  { code: SYSTEM_ACCOUNT_CODES.INVENTORY_ASSET, name: 'Inventory Asset', type: ACCOUNT_TYPES.ASSET },
  { code: SYSTEM_ACCOUNT_CODES.INPUT_CGST, name: 'Input CGST Receivable', type: ACCOUNT_TYPES.ASSET },
  { code: SYSTEM_ACCOUNT_CODES.INPUT_SGST, name: 'Input SGST Receivable', type: ACCOUNT_TYPES.ASSET },
  { code: SYSTEM_ACCOUNT_CODES.INPUT_IGST, name: 'Input IGST Receivable', type: ACCOUNT_TYPES.ASSET },
  { code: SYSTEM_ACCOUNT_CODES.ACCOUNTS_PAYABLE, name: 'Accounts Payable', type: ACCOUNT_TYPES.LIABILITY },
  { code: SYSTEM_ACCOUNT_CODES.OUTPUT_CGST, name: 'Output CGST Payable', type: ACCOUNT_TYPES.LIABILITY },
  { code: SYSTEM_ACCOUNT_CODES.OUTPUT_SGST, name: 'Output SGST Payable', type: ACCOUNT_TYPES.LIABILITY },
  { code: SYSTEM_ACCOUNT_CODES.OUTPUT_IGST, name: 'Output IGST Payable', type: ACCOUNT_TYPES.LIABILITY },
  { code: SYSTEM_ACCOUNT_CODES.WALLET_LIABILITY, name: 'Customer Wallet Balance', type: ACCOUNT_TYPES.LIABILITY },
  { code: SYSTEM_ACCOUNT_CODES.OPENING_BALANCE_EQUITY, name: 'Opening Balance Equity', type: ACCOUNT_TYPES.EQUITY },
  { code: SYSTEM_ACCOUNT_CODES.OWNERS_EQUITY, name: "Owner's Equity", type: ACCOUNT_TYPES.EQUITY },
  { code: SYSTEM_ACCOUNT_CODES.SALES_REVENUE, name: 'Sales Revenue', type: ACCOUNT_TYPES.INCOME },
  { code: SYSTEM_ACCOUNT_CODES.SHIPPING_INCOME, name: 'Shipping & Handling Income', type: ACCOUNT_TYPES.INCOME },
  { code: SYSTEM_ACCOUNT_CODES.WALLET_REDEMPTION_REVENUE, name: 'Wallet Redemption Revenue', type: ACCOUNT_TYPES.INCOME },
  { code: SYSTEM_ACCOUNT_CODES.SALES_RETURNS, name: 'Sales Returns & Allowances', type: ACCOUNT_TYPES.INCOME },
  { code: SYSTEM_ACCOUNT_CODES.WALLET_CREDITS_EXPENSE, name: 'Wallet Credits Issued', type: ACCOUNT_TYPES.EXPENSE },
  { code: SYSTEM_ACCOUNT_CODES.COST_OF_GOODS_SOLD, name: 'Cost of Goods Sold', type: ACCOUNT_TYPES.EXPENSE },
  { code: SYSTEM_ACCOUNT_CODES.OPERATING_EXPENSES, name: 'General Operating Expenses', type: ACCOUNT_TYPES.EXPENSE },
];

export const accountSeed = {
  async ensureSystemAccounts() {
    for (const account of SYSTEM_ACCOUNTS) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await accountRepository.findByCode(account.code);
      if (!existing) {
        // eslint-disable-next-line no-await-in-loop
        await accountRepository.create({ ...account, isSystem: true });
      }
    }
  },
};
