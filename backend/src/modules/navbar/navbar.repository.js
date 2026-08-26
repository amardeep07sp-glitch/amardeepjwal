import { NavbarItem } from './navbar.model.js';

export const navbarRepository = {
  findAll() {
    return NavbarItem.find().populate('page', 'title slug').sort({ order: 1 });
  },

  findActive() {
    return NavbarItem.find({ isActive: true }).populate('page', 'title slug').sort({ order: 1 });
  },

  findById(id) {
    return NavbarItem.findById(id);
  },

  create(data) {
    return NavbarItem.create(data);
  },

  updateById(id, data) {
    return NavbarItem.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  deleteById(id) {
    return NavbarItem.findByIdAndDelete(id);
  },
};
