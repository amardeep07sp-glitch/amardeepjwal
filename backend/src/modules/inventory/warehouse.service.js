import { ApiError } from '../../utils/ApiError.js';
import { warehouseRepository } from './warehouse.repository.js';
import { inventoryRepository } from './inventory.repository.js';

export const warehouseService = {
  listWarehouses(query) {
    return warehouseRepository.findPaginated(query);
  },

  listAllWarehouses() {
    return warehouseRepository.findAll();
  },

  async getWarehouseById(id) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) throw new ApiError(404, 'Warehouse not found');
    return warehouse;
  },

  // Idempotent bootstrap - called once at server startup. The very first
  // warehouse ever created becomes the default automatically so Inventory
  // provisioning always has somewhere to put opening stock, even before an
  // admin has configured warehouses at all.
  async ensureDefaultWarehouse() {
    const existingDefault = await warehouseRepository.findDefault();
    if (existingDefault) return existingDefault;

    const anyWarehouse = await warehouseRepository.findAll();
    if (anyWarehouse.length > 0) {
      return warehouseRepository.updateById(anyWarehouse[0]._id, { isDefault: true });
    }

    return warehouseRepository.create({
      name: 'Default Warehouse',
      code: 'MAIN',
      isDefault: true,
    });
  },

  async createWarehouse(data) {
    const warehouse = await warehouseRepository.create(data);
    if (data.isDefault) {
      await warehouseRepository.unsetDefaultExcept(warehouse._id);
    }
    return warehouse;
  },

  async updateWarehouse(id, data) {
    const warehouse = await warehouseRepository.updateById(id, data);
    if (!warehouse) throw new ApiError(404, 'Warehouse not found');
    if (data.isDefault) {
      await warehouseRepository.unsetDefaultExcept(warehouse._id);
    }
    return warehouse;
  },

  async setDefault(id) {
    const warehouse = await warehouseRepository.updateById(id, { isDefault: true });
    if (!warehouse) throw new ApiError(404, 'Warehouse not found');
    await warehouseRepository.unsetDefaultExcept(warehouse._id);
    return warehouse;
  },

  // DELETE RULE: a warehouse cannot be removed while any Inventory record
  // still points to it - the admin must transfer/clear stock out first.
  async deleteWarehouse(id) {
    const warehouse = await warehouseRepository.findById(id);
    if (!warehouse) throw new ApiError(404, 'Warehouse not found');

    const inventoryCount = await inventoryRepository.countByWarehouse(id);
    if (inventoryCount > 0) {
      throw new ApiError(409, `Cannot delete warehouse. ${inventoryCount} inventory record(s) still reference it.`);
    }
    if (warehouse.isDefault) {
      throw new ApiError(400, 'Cannot delete the default warehouse. Set another warehouse as default first.');
    }

    await warehouseRepository.deleteById(id);
  },

  async bulkUpdateStatus(ids, status) {
    await warehouseRepository.updateManyStatus(ids, status);
  },
};
