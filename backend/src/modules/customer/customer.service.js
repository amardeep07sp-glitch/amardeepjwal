import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { customerRepository } from './customer.repository.js';
import { walletService } from './wallet.service.js';
import { loyaltyService } from './loyalty.service.js';
import { walletRepository } from './wallet.repository.js';
import { loyaltyRepository } from './loyalty.repository.js';
import { customerAudit } from './customer.audit.js';
import { customerTimelineRepository } from './customerTimeline.repository.js';
import { customerActivityRepository } from './customerActivity.repository.js';
import { customerNumbering } from './customer.numbering.js';
import { customerReferralService } from './customerReferral.service.js';
import { buildCustomersCsv, buildCustomersExcel, parseCustomersCsv } from './customer.csv.js';
import { buildCustomerStatementPdf } from './customer.pdf.js';
import { orderRepository } from '../order/order.repository.js';
import { CUSTOMER_TIMELINE_EVENTS } from './customer.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Collision is astronomically unlikely (4 random bytes = 4 billion
// combinations) but checked anyway, same defensive precedent as Phase 6's
// barcode value generator - a rare collision becomes a quiet retry, never a
// duplicate-key crash.
async function generateUniqueReferralCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = customerNumbering.generateReferralCode();
    // eslint-disable-next-line no-await-in-loop
    const existing = await customerRepository.findByReferralCode(code);
    if (!existing) return code;
  }
  throw new ApiError(500, 'Could not generate a unique referral code, please retry');
}

export const customerService = {
  async listCustomers(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await customerRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getCustomerById(id) {
    const customer = await customerRepository.findById(id);
    if (!customer) throw new ApiError(404, 'Customer not found');
    return customer;
  },

  getTimeline(customerId) {
    return customerTimelineRepository.findByCustomer(customerId);
  },

  getActivity(customerId) {
    return customerActivityRepository.findByCustomer(customerId);
  },

  // Creates the Customer + auto-provisions a zero-balance Wallet and
  // zero-point Loyalty record in one transaction - mirrors
  // inventoryService.provisionForProduct's auto-provisioning precedent.
  // Prevents duplicate email/phone at the application layer (clean 409)
  // before the unique+sparse indexes would ever have to reject it.
  async createCustomer({ referredByCode, ...data }, userId) {
    if (data.email) {
      const existingByEmail = await customerRepository.findByEmail(data.email);
      if (existingByEmail) throw new ApiError(409, 'A customer with this email already exists');
    }
    if (data.phone) {
      const existingByPhone = await customerRepository.findByPhone(data.phone);
      if (existingByPhone) throw new ApiError(409, 'A customer with this phone number already exists');
    }

    // Referral is resolved (not just trusted) - an invalid/unknown code is
    // silently ignored rather than blocking the whole customer creation.
    let referrer = null;
    if (referredByCode) {
      referrer = await customerRepository.findByReferralCode(referredByCode.toUpperCase());
    }

    const customerCode = await customerNumbering.getNextCustomerCode();
    const referralCode = await generateUniqueReferralCode();

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const customer = await customerRepository.create(
        {
          ...data,
          customerCode,
          referralCode,
          referredBy: referrer?._id ?? null,
          createdBy: userId,
          updatedBy: userId,
        },
        session
      );

      await walletService.provisionForCustomer(customer._id, session);
      await loyaltyService.provisionForCustomer(customer._id, session);

      await customerAudit.record(
        {
          customerId: customer._id,
          event: CUSTOMER_TIMELINE_EVENTS.REGISTERED,
          action: 'customer.created',
          performedBy: userId,
          entityName: customer.displayName,
        },
        session
      );

      await session.commitTransaction();

      // Lightweight tracking record, not a critical invariant - created
      // best-effort after commit, same "the real operation must never be
      // blocked by a side effect" reasoning as order.notifications.js.
      if (referrer) {
        await customerReferralService.createReferral(referrer._id, customer._id);
      }

      return customerRepository.findById(customer._id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async updateCustomer(id, data, userId) {
    const existing = await customerRepository.findRawById(id);
    if (!existing) throw new ApiError(404, 'Customer not found');

    if (data.email && data.email !== existing.email) {
      const dup = await customerRepository.findByEmail(data.email);
      if (dup) throw new ApiError(409, 'A customer with this email already exists');
    }
    if (data.phone && data.phone !== existing.phone) {
      const dup = await customerRepository.findByPhone(data.phone);
      if (dup) throw new ApiError(409, 'A customer with this phone number already exists');
    }

    const oldStatus = existing.status;
    const customer = await customerRepository.updateById(id, { ...data, updatedBy: userId });

    if (data.status && data.status !== oldStatus) {
      await customerAudit.record({
        customerId: id,
        event: CUSTOMER_TIMELINE_EVENTS.STATUS_CHANGED,
        action: 'customer.status_changed',
        oldValue: { status: oldStatus },
        newValue: { status: data.status },
        performedBy: userId,
        entityName: customer.displayName,
      });
    } else {
      await customerAudit.record({
        customerId: id,
        action: 'customer.updated',
        newValue: data,
        performedBy: userId,
        entityName: customer.displayName,
      });
    }

    return customerRepository.findById(id);
  },

  async deleteCustomer(id) {
    const deleted = await customerRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Customer not found');
  },

  async bulkUpdateStatus(ids, status) {
    await customerRepository.updateManyStatus(ids, status);
  },

  async assignTag(customerId, tagId, userId) {
    const customer = await customerRepository.addTag(customerId, tagId);
    if (!customer) throw new ApiError(404, 'Customer not found');
    await customerAudit.record({ customerId, action: 'customer.tag_assigned', newValue: { tagId }, performedBy: userId });
    return customerRepository.findById(customerId);
  },

  async removeTag(customerId, tagId, userId) {
    const customer = await customerRepository.removeTag(customerId, tagId);
    if (!customer) throw new ApiError(404, 'Customer not found');
    await customerAudit.record({ customerId, action: 'customer.tag_removed', oldValue: { tagId }, performedBy: userId });
    return customerRepository.findById(customerId);
  },

  async assignSegment(customerId, segmentId, userId) {
    const customer = await customerRepository.addSegment(customerId, segmentId);
    if (!customer) throw new ApiError(404, 'Customer not found');
    await customerAudit.record({ customerId, action: 'customer.segment_assigned', newValue: { segmentId }, performedBy: userId });
    return customerRepository.findById(customerId);
  },

  async removeSegment(customerId, segmentId, userId) {
    const customer = await customerRepository.removeSegment(customerId, segmentId);
    if (!customer) throw new ApiError(404, 'Customer not found');
    await customerAudit.record({ customerId, action: 'customer.segment_removed', oldValue: { segmentId }, performedBy: userId });
    return customerRepository.findById(customerId);
  },

  async getDashboardTotals() {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 29);
    sinceDate.setHours(0, 0, 0, 0);

    const [totals, orderTotals, returningCustomers, walletTotal, loyaltyTotal] = await Promise.all([
      customerRepository.getDashboardTotals(sinceDate),
      orderRepository.getDashboardTotals(),
      orderRepository.countReturningCustomers(),
      walletRepository.sumAllBalances(),
      loyaltyRepository.sumAllCurrentPoints(),
    ]);

    return {
      ...totals,
      returningCustomers,
      lifetimeValue: orderTotals.totalRevenue,
      totalWalletBalance: walletTotal,
      totalRewardPoints: loyaltyTotal,
    };
  },

  async getGrowthTrend(days = 14) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - (days - 1));
    sinceDate.setHours(0, 0, 0, 0);

    const rows = await customerRepository.getGrowthTrend(sinceDate);
    const byDate = Object.fromEntries(rows.map((r) => [r._id, r.count]));

    const series = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(sinceDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, count: byDate[key] ?? 0 });
    }
    return series;
  },

  async exportCustomersCsv(filter) {
    const customers = await customerRepository.findAllForExport(filter);
    return buildCustomersCsv(customers);
  },

  async exportCustomersExcel(filter) {
    const customers = await customerRepository.findAllForExport(filter);
    return buildCustomersExcel(customers);
  },

  // Bulk-create only - never throws on a bad row, collects per-row errors
  // so one typo doesn't abort an otherwise-good batch (same discipline as
  // inventory.service.js#importInventorySettingsCsv).
  async importCustomersCsv(buffer, userId) {
    const rows = parseCustomersCsv(buffer);
    const result = { created: 0, skipped: 0, errors: [] };

    for (const [index, row] of rows.entries()) {
      if (!row.firstName) {
        result.skipped += 1;
        result.errors.push({ row: index + 2, message: 'Missing firstName' });
        continue; // eslint-disable-line no-continue
      }

      try {
        // eslint-disable-next-line no-await-in-loop
        await this.createCustomer(row, userId);
        result.created += 1;
      } catch (err) {
        result.skipped += 1;
        result.errors.push({ row: index + 2, message: err.message });
      }
    }

    return result;
  },

  async generateStatementPdf(customerId) {
    const customer = await this.getCustomerById(customerId);
    const [orderSummary, wallet, loyalty] = await Promise.all([
      orderRepository.getCustomerOrderSummary(customerId),
      walletService.getWallet(customerId).catch(() => null),
      loyaltyService.getLoyalty(customerId).catch(() => null),
    ]);

    return buildCustomerStatementPdf({ customer, orderSummary, wallet, loyalty });
  },
};
