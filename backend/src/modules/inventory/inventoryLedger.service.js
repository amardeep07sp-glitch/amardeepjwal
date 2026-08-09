import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { inventoryRepository } from './inventory.repository.js';
import { inventoryMovementRepository } from './inventoryMovement.repository.js';
import { inventoryAlertService } from './inventoryAlert.service.js';
import { resolveStockStatus } from './inventory.stockStatus.js';
import { MOVEMENT_TARGET_FIELD, ALERT_TYPES } from './inventory.constants.js';

// ===========================================================================
// THE single choke-point for every stock quantity change in the platform.
//
// Purchase -> recordMovement -> Inventory updated
// Sale     -> recordMovement -> Inventory updated
// Adjustment -> recordMovement -> Inventory updated
// Transfer / Reservation / Audit - all the same.
//
// No other file may call inventoryRepository.applyMovementDelta(). Every
// service in this module (Adjustment, Transfer, Audit, Reservation, and any
// future Purchase/Sale) must go through recordMovement() so that a ledger
// row is written in the SAME transaction as the quantity change - there is
// no code path where Inventory changes without a matching, immutable
// InventoryMovement record explaining why.
// ===========================================================================
export const inventoryLedgerService = {
  /**
   * @param {object} params
   * @param {string} params.inventoryId
   * @param {string} params.movementType - one of MOVEMENT_TYPES
   * @param {number} params.quantityChanged - signed delta applied to the
   *   movement type's primary field (see MOVEMENT_TARGET_FIELD)
   * @param {Record<string, number>} [params.extraFieldDeltas] - additional
   *   signed deltas applied atomically alongside the primary field (e.g. a
   *   DAMAGE movement both decrements availableQuantity and increments
   *   damagedQuantity in the same write)
   * @param {string} [params.reason]
   * @param {string} [params.referenceType]
   * @param {string} [params.referenceId]
   * @param {string} [params.performedBy]
   * @param {string} [params.primaryFieldOverride] - use this field as the
   *   "primary" one instead of MOVEMENT_TARGET_FIELD[movementType]. Only
   *   needed for a movement type whose usual field doesn't apply to this
   *   specific call (e.g. converting a reservation to a sale changes
   *   reservedQuantity, not availableQuantity, even though movementType is
   *   still 'sale' for ledger/reporting purposes).
   * @param {import('mongoose').ClientSession} [externalSession] - pass this
   *   when the caller already has an open transaction (e.g. a Transfer
   *   calling recordMovement twice, once per warehouse, must not commit
   *   independently between the two)
   */
  async recordMovement(params, externalSession) {
    const {
      inventoryId,
      movementType,
      quantityChanged,
      extraFieldDeltas = {},
      reason = '',
      referenceType = '',
      referenceId = null,
      performedBy = null,
      primaryFieldOverride = null,
    } = params;

    const primaryField = primaryFieldOverride ?? MOVEMENT_TARGET_FIELD[movementType];
    if (!primaryField) throw new ApiError(400, `Unknown movement type: ${movementType}`);

    const session = externalSession ?? (await mongoose.startSession());
    const ownsSession = !externalSession;
    if (ownsSession) session.startTransaction();

    try {
      const inventory = await inventoryRepository.findRawById(inventoryId, session);
      if (!inventory) throw new ApiError(404, 'Inventory record not found');

      const quantityBefore = inventory[primaryField];
      const quantityAfter = quantityBefore + quantityChanged;

      const fieldDeltas = { [primaryField]: quantityChanged, ...extraFieldDeltas };
      for (const [field, delta] of Object.entries(fieldDeltas)) {
        const resultingValue = (inventory[field] ?? 0) + delta;
        if (resultingValue < 0) {
          // Alert first (best-effort, outside the failing transaction),
          // then reject - "Negative Stock Attempt" per the Alert Engine spec.
          await inventoryAlertService.raiseAlert(
            inventoryId,
            ALERT_TYPES.NEGATIVE_STOCK_ATTEMPT,
            `A ${movementType} movement was rejected - it would have made ${field} negative.`
          );
          throw new ApiError(400, `Insufficient stock: ${field} would go negative (${resultingValue})`);
        }
      }

      const newAvailableQuantity = inventory.availableQuantity + (fieldDeltas.availableQuantity ?? 0);
      const newStockStatus = resolveStockStatus(inventory.stockStatus, {
        availableQuantity: newAvailableQuantity,
        minimumStock: inventory.minimumStock,
      });

      await inventoryRepository.applyMovementDelta(inventoryId, fieldDeltas, newStockStatus, session);

      const movement = await inventoryMovementRepository.create(
        {
          inventory: inventoryId,
          product: inventory.product,
          variant: inventory.variant,
          warehouse: inventory.warehouse,
          movementType,
          quantityBefore,
          quantityChanged,
          quantityAfter,
          reason,
          referenceType,
          referenceId,
          performedBy,
        },
        session
      );

      if (ownsSession) {
        await session.commitTransaction();

        // Alert evaluation happens after the transaction is safely
        // committed - it reads the fresh state (without a session, since
        // this call just committed the one it had) and is best-effort
        // (never throws), so it must never be allowed to roll back a real,
        // already-committed change.
        //
        // When an externalSession was passed in (e.g. a Transfer calling
        // this twice under one shared transaction), this call does NOT own
        // the commit - the outer transaction may still be open, so a
        // session-less "fresh" read here would see stale or (for a
        // just-created record) not-yet-visible data. The caller that owns
        // the outer session is responsible for evaluating alerts itself
        // once IT commits - see stockTransfer.service.js#completeTransfer.
        const freshInventory = await inventoryRepository.findRawById(inventoryId);
        await inventoryAlertService.evaluateForInventory(freshInventory, newStockStatus);
      }

      return movement;
    } catch (err) {
      if (ownsSession) {
        await session.abortTransaction();
      }
      throw err;
    } finally {
      if (ownsSession) {
        session.endSession();
      }
    }
  },

  // For callers that drove recordMovement with their own externalSession
  // (only stockTransfer.service.js#completeTransfer today) - call this once,
  // per affected inventory record, AFTER your own transaction has committed.
  // Safe to call with a plain, session-less fresh read at that point since
  // the write is now genuinely durable and visible.
  async evaluateAlertsAfterCommit(inventoryId) {
    const freshInventory = await inventoryRepository.findRawById(inventoryId);
    if (!freshInventory) return;
    await inventoryAlertService.evaluateForInventory(freshInventory, freshInventory.stockStatus);
  },
};
