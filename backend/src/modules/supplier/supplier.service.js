import { ApiError } from '../../utils/ApiError.js';
import { supplierRepository } from './supplier.repository.js';
import { supplierAudit } from './supplier.audit.js';
import { supplierTimelineRepository } from './supplierTimeline.repository.js';
import { supplierActivityRepository } from './supplierActivity.repository.js';
import { supplierNumbering } from './supplier.numbering.js';
import { SUPPLIER_TIMELINE_EVENTS } from './supplier.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const supplierService = {
  async listSuppliers(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await supplierRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getSupplierById(id) {
    const supplier = await supplierRepository.findById(id);
    if (!supplier) throw new ApiError(404, 'Supplier not found');
    return supplier;
  },

  getTimeline(supplierId) {
    return supplierTimelineRepository.findBySupplier(supplierId);
  },

  getActivity(supplierId) {
    return supplierActivityRepository.findBySupplier(supplierId);
  },

  // Prevents duplicate email/phone/GST at the application layer (clean 409)
  // before the unique+sparse indexes would ever have to reject it - same
  // discipline as customerService.createCustomer.
  async createSupplier(data, userId) {
    if (data.email) {
      const existing = await supplierRepository.findByEmail(data.email);
      if (existing) throw new ApiError(409, 'A supplier with this email already exists');
    }
    if (data.phone) {
      const existing = await supplierRepository.findByPhone(data.phone);
      if (existing) throw new ApiError(409, 'A supplier with this phone number already exists');
    }
    if (data.gstNumber) {
      const existing = await supplierRepository.findByGstNumber(data.gstNumber.toUpperCase());
      if (existing) throw new ApiError(409, 'A supplier with this GST number already exists');
    }

    const supplierCode = await supplierNumbering.getNextSupplierCode();
    const supplier = await supplierRepository.create({ ...data, supplierCode, createdBy: userId, updatedBy: userId });

    await supplierAudit.record({
      supplierId: supplier._id,
      event: SUPPLIER_TIMELINE_EVENTS.REGISTERED,
      action: 'supplier.created',
      performedBy: userId,
      entityName: supplier.name,
    });

    return supplier;
  },

  async updateSupplier(id, data, userId) {
    const existing = await supplierRepository.findRawById(id);
    if (!existing) throw new ApiError(404, 'Supplier not found');

    if (data.email && data.email !== existing.email) {
      const dup = await supplierRepository.findByEmail(data.email);
      if (dup) throw new ApiError(409, 'A supplier with this email already exists');
    }
    if (data.phone && data.phone !== existing.phone) {
      const dup = await supplierRepository.findByPhone(data.phone);
      if (dup) throw new ApiError(409, 'A supplier with this phone number already exists');
    }

    const oldStatus = existing.status;
    const supplier = await supplierRepository.updateById(id, { ...data, updatedBy: userId });

    if (data.status && data.status !== oldStatus) {
      await supplierAudit.record({
        supplierId: id,
        event: SUPPLIER_TIMELINE_EVENTS.STATUS_CHANGED,
        action: 'supplier.status_changed',
        oldValue: { status: oldStatus },
        newValue: { status: data.status },
        performedBy: userId,
        entityName: supplier.name,
      });
    } else {
      await supplierAudit.record({
        supplierId: id,
        action: 'supplier.updated',
        newValue: data,
        performedBy: userId,
        entityName: supplier.name,
      });
    }

    return supplier;
  },

  async deleteSupplier(id) {
    const deleted = await supplierRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Supplier not found');
  },

  async getDashboardTotals() {
    const [totalSuppliers, activeSuppliers, outstandingPayments] = await Promise.all([
      supplierRepository.countTotal(),
      supplierRepository.countActive(),
      supplierRepository.sumOutstandingBalances(),
    ]);
    return { totalSuppliers, activeSuppliers, outstandingPayments };
  },
};
