import { Collection } from './collection.model.js';
import { CATALOG_STATUSES } from '../../constants/catalog.js';
import { PUBLIC_VISIBLE_LEVELS } from './collection.constants.js';

const MEDIA_POPULATE_FIELDS = ['bannerMedia', 'thumbnailMedia', 'mobileBannerMedia', 'promoVideoMedia', 'seo.ogImageMedia'];
// Detail reads only - list reads skip this (same "populate only what each
// read shape needs" discipline product.repository.js already follows).
const RELATION_POPULATE_FIELDS = [
  { path: 'relatedCollections', select: 'name slug thumbnailMedia' },
  { path: 'parentCampaign', select: 'name slug' },
];

// What the storefront is allowed to see: published + a public visibility
// level (members/vip/hidden fail closed - see collection.constants.js) - the
// schedule window itself is applied per-query below since a static object
// can't express "right now" at import time.
const PUBLIC_BASE_FILTER = { status: CATALOG_STATUSES.PUBLISHED, visibility: { $in: PUBLIC_VISIBLE_LEVELS } };

function withScheduleWindow(filter, now = new Date()) {
  return {
    ...filter,
    $and: [
      { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
      { $or: [{ endDate: null }, { endDate: { $gte: now } }] },
    ],
  };
}

export const collectionRepository = {
  async findPaginated({ page, limit, status, type, isFeatured, search, sortBy, sortOrder }) {
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Collection.find(filter).populate(MEDIA_POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
      Collection.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return Collection.findById(id).populate(MEDIA_POPULATE_FIELDS).populate(RELATION_POPULATE_FIELDS);
  },

  create(data) {
    return Collection.create(data).then((collection) => collection.populate([...MEDIA_POPULATE_FIELDS, ...RELATION_POPULATE_FIELDS]));
  },

  async updateById(id, data) {
    const existing = await Collection.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    await existing.save();
    return existing.populate([...MEDIA_POPULATE_FIELDS, ...RELATION_POPULATE_FIELDS]);
  },

  deleteById(id) {
    return Collection.findByIdAndDelete(id);
  },

  deleteByIds(ids) {
    return Collection.deleteMany({ _id: { $in: ids } });
  },

  updateManyStatus(ids, status) {
    return Collection.updateMany({ _id: { $in: ids } }, { $set: { status } });
  },

  // --- Public storefront reads (published + public-visible + in-schedule) ---

  async findPublicPaginated({ page, limit, type }) {
    const filter = withScheduleWindow({ ...PUBLIC_BASE_FILTER, ...(type ? { type } : {}) });
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Collection.find(filter).populate(MEDIA_POPULATE_FIELDS).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit),
      Collection.countDocuments(filter),
    ]);
    return { items, total };
  },

  findPublicBySlug(slug) {
    const filter = withScheduleWindow({ slug, ...PUBLIC_BASE_FILTER });
    return Collection.findOne(filter).populate(MEDIA_POPULATE_FIELDS).populate(RELATION_POPULATE_FIELDS);
  },

  incrementViewCount(id) {
    return Collection.updateOne({ _id: id }, { $inc: { viewCount: 1 } });
  },

  incrementClickCount(id) {
    return Collection.updateOne({ _id: id }, { $inc: { clickCount: 1 } });
  },

  // --- Scheduling cron targets (collection.jobs.js) ------------------------

  findDueForAutoPublish(now = new Date()) {
    return Collection.find({ autoPublish: true, status: CATALOG_STATUSES.DRAFT, startDate: { $ne: null, $lte: now } });
  },

  findDueForAutoArchive(now = new Date()) {
    return Collection.find({ autoArchive: true, status: CATALOG_STATUSES.PUBLISHED, endDate: { $ne: null, $lte: now } });
  },

  // --- Dashboard (no fabrication - real grouped counts) ---------------------

  getStatusCounts() {
    return Collection.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  },

  getTypeCounts() {
    return Collection.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]);
  },

  // "Scheduled" = has a real future date-window boundary set, regardless of
  // current status - a simple, honest count for the dashboard.
  countScheduled(now = new Date()) {
    return Collection.countDocuments({ $or: [{ startDate: { $gt: now } }, { endDate: { $gt: now } }] });
  },
};
