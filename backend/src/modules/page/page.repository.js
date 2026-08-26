import { Page } from './page.model.js';
import { PAGE_STATUSES } from '../../constants/cms.js';

const POPULATE_FIELDS = ['heroMedia', 'ogImageMedia'];

export const pageRepository = {
  findAll() {
    return Page.find().sort({ createdAt: -1 }).populate(POPULATE_FIELDS);
  },

  findPublishedBySlug(slug) {
    return Page.findOne({ slug, status: PAGE_STATUSES.PUBLISHED }).populate(POPULATE_FIELDS);
  },

  findById(id) {
    return Page.findById(id).populate(POPULATE_FIELDS);
  },

  create(data) {
    return Page.create(data).then((page) => page.populate(POPULATE_FIELDS));
  },

  async updateById(id, data) {
    const existing = await Page.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    await existing.save();
    return existing.populate(POPULATE_FIELDS);
  },

  deleteById(id) {
    return Page.findByIdAndDelete(id);
  },
};
