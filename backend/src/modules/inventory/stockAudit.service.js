import { ApiError } from '../../utils/ApiError.js';
import { stockAuditRepository } from './stockAudit.repository.js';
import { inventoryRepository } from './inventory.repository.js';
import { inventoryLedgerService } from './inventoryLedger.service.js';
import { AUDIT_STATUSES, MOVEMENT_TYPES } from './inventory.constants.js';

const REFERENCE_TYPE = 'stock_audit';

export const stockAuditService = {
  listAudits(query) {
    return stockAuditRepository.findPaginated(query);
  },

  async getAuditById(id) {
    const audit = await stockAuditRepository.findById(id);
    if (!audit) throw new ApiError(404, 'Stock audit not found');
    return audit;
  },

  // Physical Count -> Difference (recorded now, as a draft) -> Adjustment ->
  // Ledger Entry (only on completeAudit, below).
  async createAudit({ inventory: inventoryId, countedQuantity }, performedBy) {
    const inventory = await inventoryRepository.findRawById(inventoryId);
    if (!inventory) throw new ApiError(404, 'Inventory record not found');

    const systemQuantity = inventory.availableQuantity;
    return stockAuditRepository.create({
      inventory: inventoryId,
      countedQuantity,
      systemQuantity,
      difference: countedQuantity - systemQuantity,
      performedBy,
    });
  },

  // Audit history is never deleted, and every completed audit creates a
  // ledger entry - even a zero-difference one - so "we counted and nothing
  // was wrong" is as much a permanent record as a correction is.
  async completeAudit(id, performedBy) {
    const audit = await stockAuditRepository.findRawById(id);
    if (!audit) throw new ApiError(404, 'Stock audit not found');
    if (audit.status === AUDIT_STATUSES.COMPLETED) {
      throw new ApiError(400, 'Audit is already completed');
    }

    await inventoryLedgerService.recordMovement({
      inventoryId: audit.inventory,
      movementType: MOVEMENT_TYPES.STOCK_AUDIT,
      quantityChanged: audit.difference,
      reason: `Stock audit: counted ${audit.countedQuantity}, system had ${audit.systemQuantity}`,
      referenceType: REFERENCE_TYPE,
      referenceId: audit._id,
      performedBy,
    });

    return stockAuditRepository.updateById(id, { status: AUDIT_STATUSES.COMPLETED });
  },
};
