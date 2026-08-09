import { SavedFilter } from './savedFilter.model.js';

export const savedFilterRepository = {
  findByUserAndReport(userId, reportKey) {
    return SavedFilter.find({ createdBy: userId, reportKey }).sort({ createdAt: -1 });
  },

  findById(id) {
    return SavedFilter.findById(id);
  },

  create(data) {
    return SavedFilter.create(data);
  },

  deleteById(id) {
    return SavedFilter.findByIdAndDelete(id);
  },
};
