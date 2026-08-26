import { FooterColumn } from './footerColumn.model.js';

export const footerColumnRepository = {
  findAll() {
    return FooterColumn.find().sort({ order: 1 });
  },

  findActive() {
    return FooterColumn.find({ isActive: true }).sort({ order: 1 });
  },

  findById(id) {
    return FooterColumn.findById(id);
  },

  create(data) {
    return FooterColumn.create(data);
  },

  updateById(id, data) {
    return FooterColumn.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return FooterColumn.findByIdAndDelete(id);
  },
};
