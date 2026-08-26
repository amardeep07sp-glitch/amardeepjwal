import { Brand } from './brand.model.js';
import { CATALOG_STATUSES } from '../../constants/catalog.js';

const MEDIA_POPULATE_FIELDS = ['logoMedia', 'bannerMedia', 'seo.ogImageMedia', 'showcase.heroImageMedia', 'showcase.storyImageMedia'];

// Same shape as category.repository.js's PUBLIC_FILTER - published AND
// visible, the only two gates a storefront read ever needs.
const PUBLIC_FILTER = { status: CATALOG_STATUSES.PUBLISHED, isVisible: true };

export const brandRepository = {
  async findPaginated({ page, limit, status, isFeatured, search, sortBy, sortOrder }) {
    const filter = {};
    if (status) filter.status = status;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Brand.find(filter).populate(MEDIA_POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
      Brand.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return Brand.findById(id).populate(MEDIA_POPULATE_FIELDS);
  },

  create(data) {
    return Brand.create(data).then((brand) => brand.populate(MEDIA_POPULATE_FIELDS));
  },

  async updateById(id, data) {
    const existing = await Brand.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    await existing.save();
    return existing.populate(MEDIA_POPULATE_FIELDS);
  },

  deleteById(id) {
    return Brand.findByIdAndDelete(id);
  },

  deleteByIds(ids) {
    return Brand.deleteMany({ _id: { $in: ids } });
  },

  updateManyStatus(ids, status) {
    return Brand.updateMany({ _id: { $in: ids } }, { $set: { status } });
  },

  // --- Public storefront reads (published + visible only) -----------------

  async findPublicPaginated({ page, limit }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Brand.find(PUBLIC_FILTER).populate(MEDIA_POPULATE_FIELDS).sort({ order: 1, name: 1 }).skip(skip).limit(limit),
      Brand.countDocuments(PUBLIC_FILTER),
    ]);
    return { items, total };
  },

  findPublicBySlug(slug) {
    return Brand.findOne({ slug, ...PUBLIC_FILTER }).populate(MEDIA_POPULATE_FIELDS);
  },

  findPublicFeatured(limit) {
    return Brand.find({ ...PUBLIC_FILTER, isFeatured: true }).populate(MEDIA_POPULATE_FIELDS).sort({ order: 1, name: 1 }).limit(limit);
  },

  // The facet list for the product filter sidebar - every published+visible
  // brand, real ids only (never resolved by name, which could collide).
  findAllPublicIds() {
    return Brand.find(PUBLIC_FILTER).select('_id name slug');
  },
};
