import { Variant } from './variant.model.js';
import { CATALOG_STATUSES } from '../../../constants/catalog.js';

const POPULATE_FIELDS = [{ path: 'attributes.attribute', select: 'name slug type' }, { path: 'attributes.value', select: 'value hexColor imageUrl' }];

// What the storefront is allowed to see: published + visible - same rule
// as product.repository.js's PUBLIC_FILTER.
const PUBLIC_FILTER = { status: CATALOG_STATUSES.PUBLISHED, isVisible: true };

export const variantRepository = {
  async findPaginatedByProduct(productId, { page, limit, status, search, sortBy, sortOrder }) {
    const filter = { product: productId };
    if (status) filter.status = status;
    if (search) filter.sku = { $regex: search, $options: 'i' };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Variant.find(filter).populate(POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
      Variant.countDocuments(filter),
    ]);

    return { items, total };
  },

  findAllByProduct(productId) {
    return Variant.find({ product: productId }).populate(POPULATE_FIELDS).sort({ order: 1, createdAt: 1 });
  },

  findFirstByProduct(productId) {
    return Variant.findOne({ product: productId }).sort({ order: 1, createdAt: 1 });
  },

  findById(id) {
    return Variant.findById(id).populate(POPULATE_FIELDS);
  },

  findRawById(id) {
    return Variant.findById(id);
  },

  countByProduct(productId) {
    return Variant.countDocuments({ product: productId });
  },

  async findExistingCombinationKeys(productId, combinationKeys) {
    const existing = await Variant.find({ product: productId, combinationKey: { $in: combinationKeys } }).select(
      'combinationKey'
    );
    return new Set(existing.map((v) => v.combinationKey));
  },

  findByCombinationKey(productId, combinationKey) {
    return Variant.findOne({ product: productId, combinationKey });
  },

  findDefaultByProduct(productId) {
    return Variant.findOne({ product: productId, isDefault: true });
  },

  async create(data, session) {
    const [created] = await Variant.create([data], { session: session ?? undefined });
    return created;
  },

  insertMany(dataArray, session) {
    return Variant.insertMany(dataArray, { session: session ?? undefined });
  },

  async updateById(id, data) {
    const existing = await Variant.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    await existing.save();
    return existing.populate(POPULATE_FIELDS);
  },

  deleteById(id) {
    return Variant.findByIdAndDelete(id);
  },

  deleteByIds(ids) {
    return Variant.deleteMany({ _id: { $in: ids } });
  },

  updateManyStatus(ids, status) {
    return Variant.updateMany({ _id: { $in: ids } }, { $set: { status } });
  },

  unsetDefaultForProduct(productId, exceptVariantId) {
    return Variant.updateMany(
      { product: productId, _id: { $ne: exceptVariantId } },
      { $set: { isDefault: false } }
    );
  },

  setDefault(variantId) {
    return Variant.findByIdAndUpdate(variantId, { $set: { isDefault: true } });
  },

  // --- Public storefront reads (published + visible only) -----------------

  findPublicByProduct(productId) {
    return Variant.find({ product: productId, ...PUBLIC_FILTER })
      .populate(POPULATE_FIELDS)
      .sort({ order: 1, createdAt: 1 });
  },
};
