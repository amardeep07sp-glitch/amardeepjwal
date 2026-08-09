import { ApiError } from '../../utils/ApiError.js';
import { accountRepository } from './account.repository.js';
import { journalService } from './journal.service.js';
import { SYSTEM_ACCOUNT_CODES, ACCOUNTING_EVENT_TYPES } from './accounting.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const accountService = {
  async listAccounts(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await accountRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  listAll(filter) {
    return accountRepository.findAll(filter);
  },

  async getAccountById(id) {
    const account = await accountRepository.findById(id);
    if (!account) throw new ApiError(404, 'Account not found');
    return account;
  },

  getChildren(parentId) {
    return accountRepository.findChildren(parentId);
  },

  // A non-zero openingBalance is never just silently set on the document -
  // it posts a real, balanced "Opening Balance" journal against Opening
  // Balance Equity, so the fundamental double-entry invariant (total debits
  // = total credits, system-wide) holds even for day-one setup.
  async createAccount(data, userId) {
    if (data.parent) {
      const parent = await accountRepository.findRawById(data.parent);
      if (!parent) throw new ApiError(404, 'Parent account not found');
      if (parent.type !== data.type) throw new ApiError(400, 'A child account must have the same type as its parent');
    }

    const account = await accountRepository.create({
      ...data,
      currentBalance: 0,
      isSystem: false,
      createdBy: userId,
      updatedBy: userId,
    });

    if (data.openingBalance) {
      await journalService.recordOpeningBalance(account, data.openingBalance, userId);
    }

    return accountRepository.findById(account._id);
  },

  async updateAccount(id, data, userId) {
    const existing = await accountRepository.findRawById(id);
    if (!existing) throw new ApiError(404, 'Account not found');
    if (existing.isSystem && (data.code || data.type)) {
      throw new ApiError(400, 'A system account\'s code and type cannot be changed');
    }

    const account = await accountRepository.updateById(id, { ...data, updatedBy: userId });
    return accountRepository.findById(account._id);
  },

  async deleteAccount(id) {
    const existing = await accountRepository.findRawById(id);
    if (!existing) throw new ApiError(404, 'Account not found');
    if (existing.isSystem) throw new ApiError(400, 'System accounts cannot be deleted');

    const childCount = await accountRepository.countChildren(id);
    if (childCount > 0) throw new ApiError(400, 'Cannot delete an account that has child accounts');

    await accountRepository.deleteById(id);
  },

  // Financial Dashboard's "Cash" card - Cash + Bank system accounts combined.
  getCashBalance() {
    return accountRepository.sumBalancesByCodes([SYSTEM_ACCOUNT_CODES.CASH, SYSTEM_ACCOUNT_CODES.BANK]);
  },
};
