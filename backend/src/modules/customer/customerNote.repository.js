import { CustomerNote } from './customerNote.model.js';

export const customerNoteRepository = {
  findByCustomer(customerId) {
    return CustomerNote.find({ customer: customerId })
      .sort({ isPinned: -1, createdAt: -1 })
      .populate({ path: 'createdBy', select: 'name' })
      .populate('attachments');
  },

  findById(id) {
    return CustomerNote.findById(id);
  },

  create(data) {
    return CustomerNote.create(data);
  },

  async updateById(id, data) {
    const existing = await CustomerNote.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return CustomerNote.findByIdAndDelete(id);
  },
};
