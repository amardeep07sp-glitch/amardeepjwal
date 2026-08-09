import { ApiError } from '../../utils/ApiError.js';
import { inventoryAlertRepository } from './inventoryAlert.repository.js';
import { ALERT_TYPES, ALERT_STATUSES, STOCK_STATUSES } from './inventory.constants.js';

export const inventoryAlertService = {
  // Best-effort, deliberately never throws - called as a side effect of a
  // ledger write that has already succeeded (or, for NEGATIVE_STOCK_ATTEMPT,
  // right before a write is rejected). A failure here must never mask the
  // real inventory operation's own result.
  async raiseAlert(inventoryId, type, message) {
    try {
      const existing = await inventoryAlertRepository.findOpenByInventoryAndType(inventoryId, type);
      if (existing) return existing;
      return await inventoryAlertRepository.create({ inventory: inventoryId, type, message });
    } catch {
      return null;
    }
  },

  // Called after every successful ledger movement with the inventory's fresh
  // state - "Future Notifications Ready" per spec: this only ever creates
  // the InventoryAlert row, a future dispatcher decides what to do with it.
  async evaluateForInventory(inventory, newStockStatus) {
    if (newStockStatus === STOCK_STATUSES.OUT_OF_STOCK) {
      await this.raiseAlert(inventory._id, ALERT_TYPES.OUT_OF_STOCK, `${inventory.sku || 'Item'} is out of stock.`);
    } else if (newStockStatus === STOCK_STATUSES.LOW_STOCK) {
      await this.raiseAlert(inventory._id, ALERT_TYPES.LOW_STOCK, `${inventory.sku || 'Item'} is running low on stock.`);
    }

    if (inventory.reorderLevel > 0 && inventory.availableQuantity <= inventory.reorderLevel) {
      await this.raiseAlert(inventory._id, ALERT_TYPES.REORDER_REQUIRED, `${inventory.sku || 'Item'} has reached its reorder level.`);
    }

    if (!inventory.active) {
      await this.raiseAlert(inventory._id, ALERT_TYPES.INACTIVE_INVENTORY, `${inventory.sku || 'Item'} is inactive but still holds stock.`);
    }
  },

  listAlerts(query) {
    return inventoryAlertRepository.findPaginated(query);
  },

  async acknowledgeAlert(id) {
    const alert = await inventoryAlertRepository.updateById(id, { status: ALERT_STATUSES.ACKNOWLEDGED });
    if (!alert) throw new ApiError(404, 'Alert not found');
    return alert;
  },

  async resolveAlert(id) {
    const alert = await inventoryAlertRepository.updateById(id, { status: ALERT_STATUSES.RESOLVED });
    if (!alert) throw new ApiError(404, 'Alert not found');
    return alert;
  },
};
