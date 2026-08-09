import { HomepageSection } from './homepageSection.model.js';

const POPULATE_FIELDS = [
  { path: 'banner', select: 'title primaryMedia linkUrl', populate: { path: 'primaryMedia' } },
  { path: 'primaryMedia' },
];

export const homepageSectionRepository = {
  findAll() {
    return HomepageSection.find().populate(POPULATE_FIELDS).sort({ order: 1 });
  },

  findById(id) {
    return HomepageSection.findById(id).populate(POPULATE_FIELDS);
  },

  create(data) {
    return HomepageSection.create(data).then((section) => section.populate(POPULATE_FIELDS));
  },

  updateById(id, data) {
    return HomepageSection.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate(
      POPULATE_FIELDS
    );
  },

  deleteById(id) {
    return HomepageSection.findByIdAndDelete(id);
  },
};
