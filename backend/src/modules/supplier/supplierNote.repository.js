import { SupplierNote } from './supplierNote.model.js';

export const supplierNoteRepository = {
  findBySupplier(supplierId) {
    return SupplierNote.find({ supplier: supplierId })
      .sort({ isPinned: -1, createdAt: -1 })
      .populate({ path: 'createdBy', select: 'name' })
      .populate('attachments');
  },

  findById(id) {
    return SupplierNote.findById(id);
  },

  create(data) {
    return SupplierNote.create(data);
  },

  async updateById(id, data) {
    const existing = await SupplierNote.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return SupplierNote.findByIdAndDelete(id);
  },
};
