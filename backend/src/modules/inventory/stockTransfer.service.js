import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { stockTransferRepository } from './stockTransfer.repository.js';
import { inventoryRepository } from './inventory.repository.js';
import { inventoryLedgerService } from './inventoryLedger.service.js';
import { TRANSFER_STATUSES, MOVEMENT_TYPES } from './inventory.constants.js';

const REFERENCE_TYPE = 'stock_transfer';

export const stockTransferService = {
  listTransfers(query) {
    return stockTransferRepository.findPaginated(query);
  },

  async getTransferById(id) {
    const transfer = await stockTransferRepository.findById(id);
    if (!transfer) throw new ApiError(404, 'Stock transfer not found');
    return transfer;
  },

  async requestTransfer(data, requestingUserId) {
    const sourceInventory = await inventoryRepository.findRawById(data.inventory);
    if (!sourceInventory) throw new ApiError(404, 'Source inventory record not found');
    if (String(sourceInventory.warehouse) !== String(data.fromWarehouse)) {
      throw new ApiError(400, 'fromWarehouse must match the inventory record\'s current warehouse');
    }
    if (String(data.fromWarehouse) === String(data.toWarehouse)) {
      throw new ApiError(400, 'Source and destination warehouse must be different');
    }
    if (sourceInventory.availableQuantity < data.quantity) {
      throw new ApiError(400, 'Insufficient available stock to request this transfer');
    }

    return stockTransferRepository.create({ ...data, requestedBy: requestingUserId });
  },

  async approveTransfer(id, approverId) {
    const transfer = await stockTransferRepository.findRawById(id);
    if (!transfer) throw new ApiError(404, 'Stock transfer not found');
    if (transfer.status !== TRANSFER_STATUSES.REQUESTED) {
      throw new ApiError(400, `Transfer is already ${transfer.status}`);
    }

    return stockTransferRepository.updateById(id, { status: TRANSFER_STATUSES.APPROVED, approvedBy: approverId });
  },

  async rejectTransfer(id, approverId) {
    const transfer = await stockTransferRepository.findRawById(id);
    if (!transfer) throw new ApiError(404, 'Stock transfer not found');
    if (![TRANSFER_STATUSES.REQUESTED, TRANSFER_STATUSES.APPROVED].includes(transfer.status)) {
      throw new ApiError(400, `Transfer is already ${transfer.status}`);
    }

    return stockTransferRepository.updateById(id, { status: TRANSFER_STATUSES.REJECTED, approvedBy: approverId });
  },

  // Transfer Approval -> Transfer Completion -> two ledger entries
  // (TRANSFER_OUT at source, TRANSFER_IN at destination) written atomically
  // in one transaction - either both happen or neither does.
  async completeTransfer(id, performedBy) {
    const transfer = await stockTransferRepository.findRawById(id);
    if (!transfer) throw new ApiError(404, 'Stock transfer not found');
    if (transfer.status !== TRANSFER_STATUSES.APPROVED) {
      throw new ApiError(400, 'Transfer must be approved before it can be completed');
    }

    const sourceInventory = await inventoryRepository.findRawById(transfer.inventory);
    if (!sourceInventory) throw new ApiError(404, 'Source inventory record not found');

    let destInventory = await inventoryRepository.findOneByScope(
      sourceInventory.product,
      sourceInventory.variant,
      transfer.toWarehouse
    );

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      if (!destInventory) {
        destInventory = await inventoryRepository.create(
          {
            product: sourceInventory.product,
            variant: sourceInventory.variant,
            warehouse: transfer.toWarehouse,
            sku: sourceInventory.sku,
          },
          session
        );
      }

      await inventoryLedgerService.recordMovement(
        {
          inventoryId: sourceInventory._id,
          movementType: MOVEMENT_TYPES.TRANSFER_OUT,
          quantityChanged: -transfer.quantity,
          reason: 'Stock transfer completed',
          referenceType: REFERENCE_TYPE,
          referenceId: transfer._id,
          performedBy,
        },
        session
      );

      await inventoryLedgerService.recordMovement(
        {
          inventoryId: destInventory._id,
          movementType: MOVEMENT_TYPES.TRANSFER_IN,
          quantityChanged: transfer.quantity,
          reason: 'Stock transfer completed',
          referenceType: REFERENCE_TYPE,
          referenceId: transfer._id,
          performedBy,
        },
        session
      );

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    // Both recordMovement calls above ran under our externalSession, so
    // neither evaluated alerts itself (see inventoryLedger.service.js) -
    // now that our own transaction is genuinely committed, do it for both
    // sides of the transfer.
    await inventoryLedgerService.evaluateAlertsAfterCommit(sourceInventory._id);
    await inventoryLedgerService.evaluateAlertsAfterCommit(destInventory._id);

    return stockTransferRepository.updateById(id, {
      status: TRANSFER_STATUSES.COMPLETED,
      completedAt: new Date(),
    });
  },

  async cancelTransfer(id) {
    const transfer = await stockTransferRepository.findRawById(id);
    if (!transfer) throw new ApiError(404, 'Stock transfer not found');
    if (transfer.status === TRANSFER_STATUSES.COMPLETED) {
      throw new ApiError(400, 'A completed transfer cannot be cancelled');
    }

    return stockTransferRepository.updateById(id, { status: TRANSFER_STATUSES.CANCELLED });
  },
};
