import { InventoryMovement } from './inventoryMovement.model.js';

// Append-only by design - intentionally no updateById/deleteById here.
export const inventoryMovementRepository = {
  async create(data, session) {
    const [created] = await InventoryMovement.create([data], { session: session ?? undefined });
    return created;
  },

  async findPaginatedByInventory(inventoryId, { page, limit }) {
    const filter = { inventory: inventoryId };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      InventoryMovement.find(filter)
        .populate('performedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      InventoryMovement.countDocuments(filter),
    ]);

    return { items, total };
  },

  findRecent(limit = 10) {
    return InventoryMovement.find({})
      .populate('product', 'name sku')
      .populate('performedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  },
};
