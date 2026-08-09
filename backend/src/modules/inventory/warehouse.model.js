import mongoose from 'mongoose';
import { WAREHOUSE_STATUSES } from './inventory.constants.js';

// Multi-warehouse from day one - "current implementation may use one
// warehouse" (see warehouse.service.js#ensureDefaultWarehouse) but nothing
// in this schema assumes a single warehouse exists.
const warehouseSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    address: { type: String, trim: true, default: '' },
    contactPerson: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    status: { type: String, enum: Object.values(WAREHOUSE_STATUSES), default: WAREHOUSE_STATUSES.ACTIVE },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// DB-level safety net (same partial-unique-index technique as
// Variant.combinationKey): at most one document can have isDefault: true.
// warehouse.service.js#setDefault also unsets every other warehouse first,
// but this index means a bug there can never produce two defaults.
warehouseSchema.index({ isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

export const Warehouse = mongoose.model('Warehouse', warehouseSchema);
