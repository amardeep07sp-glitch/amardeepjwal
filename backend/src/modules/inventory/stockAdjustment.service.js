import { ApiError } from '../../utils/ApiError.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { stockAdjustmentRepository } from './stockAdjustment.repository.js';
import { inventoryLedgerService } from './inventoryLedger.service.js';
import { ADJUSTMENT_TYPES, ADJUSTMENT_STATUSES, MOVEMENT_TYPES } from './inventory.constants.js';

const REFERENCE_TYPE = 'stock_adjustment';

const applyAdjustmentMovement = (adjustment, performedBy) =>
  inventoryLedgerService.recordMovement({
    inventoryId: adjustment.inventory,
    movementType: MOVEMENT_TYPES.MANUAL_ADJUSTMENT,
    quantityChanged: adjustment.type === ADJUSTMENT_TYPES.INCREASE ? adjustment.quantity : -adjustment.quantity,
    reason: adjustment.reason,
    referenceType: REFERENCE_TYPE,
    referenceId: adjustment._id,
    performedBy,
  });

export const stockAdjustmentService = {
  listAdjustments(query) {
    return stockAdjustmentRepository.findPaginated(query);
  },

  async getAdjustmentById(id) {
    const adjustment = await stockAdjustmentRepository.findById(id);
    if (!adjustment) throw new ApiError(404, 'Stock adjustment not found');
    return adjustment;
  },

  // Reason is mandatory (enforced by the schema's required:true). Privileged
  // roles (manager/admin/super_admin) are auto-approved and applied
  // immediately; anyone else's request is created pending, waiting for a
  // privileged approve/reject action.
  async createAdjustment(data, requestingUser) {
    const isPrivileged = PRIVILEGED_ROLES.includes(requestingUser.role);

    const adjustment = await stockAdjustmentRepository.create({
      ...data,
      status: isPrivileged ? ADJUSTMENT_STATUSES.APPROVED : ADJUSTMENT_STATUSES.PENDING,
      requestedBy: requestingUser._id,
      approvedBy: isPrivileged ? requestingUser._id : null,
    });

    if (isPrivileged) {
      await applyAdjustmentMovement(adjustment, requestingUser._id);
    }

    return adjustment;
  },

  async approveAdjustment(id, approverId) {
    const adjustment = await stockAdjustmentRepository.findById(id);
    if (!adjustment) throw new ApiError(404, 'Stock adjustment not found');
    if (adjustment.status !== ADJUSTMENT_STATUSES.PENDING) {
      throw new ApiError(400, `Adjustment is already ${adjustment.status}`);
    }

    await applyAdjustmentMovement(adjustment, approverId);
    return stockAdjustmentRepository.updateById(id, { status: ADJUSTMENT_STATUSES.APPROVED, approvedBy: approverId });
  },

  async rejectAdjustment(id, approverId) {
    const adjustment = await stockAdjustmentRepository.findById(id);
    if (!adjustment) throw new ApiError(404, 'Stock adjustment not found');
    if (adjustment.status !== ADJUSTMENT_STATUSES.PENDING) {
      throw new ApiError(400, `Adjustment is already ${adjustment.status}`);
    }

    return stockAdjustmentRepository.updateById(id, { status: ADJUSTMENT_STATUSES.REJECTED, approvedBy: approverId });
  },
};
