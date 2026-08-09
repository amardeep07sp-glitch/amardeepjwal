import { Category } from './category.model.js';
import { CATALOG_STATUSES } from '../../constants/catalog.js';

const MEDIA_POPULATE_FIELDS = ['iconMedia', 'bannerMedia', 'thumbnailMedia', 'seo.ogImageMedia'];
// Every "live" read excludes soft-deleted categories by default - only the
// trash-list/restore endpoints opt into seeing them (see findTrashedPaginated).
const NOT_DELETED = { isDeleted: { $ne: true } };
// What the storefront is allowed to see: published, visible, not deleted.
// A draft/hidden/archived category can exist in the admin panel without
// ever being reachable by a customer.
const PUBLIC_FILTER = { ...NOT_DELETED, status: CATALOG_STATUSES.PUBLISHED, isVisible: true };

export const categoryRepository = {
  async findFlatPaginated({ page, limit, status, parent, isFeatured, search, sortBy, sortOrder }) {
    const filter = { ...NOT_DELETED };
    if (status) filter.status = status;
    if (parent === 'none') filter.parent = null;
    else if (parent) filter.parent = parent;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Category.find(filter)
        .populate('parent', 'name slug')
        .populate(MEDIA_POPULATE_FIELDS)
        .sort(sort)
        .skip(skip)
        .limit(limit),
      Category.countDocuments(filter),
    ]);

    return { items, total };
  },

  findAll(filter = {}) {
    return Category.find({ ...filter, ...NOT_DELETED })
      .populate('parent', 'name slug')
      .populate(MEDIA_POPULATE_FIELDS)
      .sort({ order: 1, name: 1 });
  },

  findTrashedPaginated({ page, limit }) {
    const filter = { isDeleted: true };
    const skip = (page - 1) * limit;
    return Promise.all([
      Category.find(filter).populate('parent', 'name slug').sort({ deletedAt: -1 }).skip(skip).limit(limit),
      Category.countDocuments(filter),
    ]).then(([items, total]) => ({ items, total }));
  },

  findById(id) {
    return Category.findOne({ _id: id, ...NOT_DELETED }).populate(MEDIA_POPULATE_FIELDS);
  },

  // Used by delete/restore flows, which need to act on a category regardless
  // of its current soft-delete state.
  findByIdIncludingDeleted(id) {
    return Category.findById(id).populate(MEDIA_POPULATE_FIELDS);
  },

  findByIdWithParentChain(id) {
    return Category.findOne({ _id: id, ...NOT_DELETED })
      .populate('ancestors', 'name slug')
      .populate('parent', 'name slug')
      .populate(MEDIA_POPULATE_FIELDS);
  },

  findByIds(ids) {
    return Category.find({ _id: { $in: ids }, ...NOT_DELETED });
  },

  findBySlug(slug) {
    return Category.findOne({ slug, ...NOT_DELETED });
  },

  // Prefix matches ("gold r..." -> "Gold Rings") rank above matches that only
  // contain the term ("Antique Gold Rings") - the ones a user typing into an
  // autocomplete box is almost always looking for. Two small queries instead
  // of one aggregation pipeline, since that ranking is easier to read this way.
  async searchAutocomplete(searchTerm, limit) {
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixMatches = await Category.find({ name: { $regex: `^${escapedTerm}`, $options: 'i' }, ...NOT_DELETED })
      .select('name slug parent')
      .populate('parent', 'name')
      .limit(limit);

    if (prefixMatches.length >= limit) return prefixMatches;

    const remainingSlots = limit - prefixMatches.length;
    const containsMatches = await Category.find({
      name: { $regex: escapedTerm, $options: 'i' },
      _id: { $nin: prefixMatches.map((category) => category._id) },
      ...NOT_DELETED,
    })
      .select('name slug parent')
      .populate('parent', 'name')
      .limit(remainingSlots);

    return [...prefixMatches, ...containsMatches];
  },

  findDirectChildrenCount(parentId) {
    return Category.countDocuments({ parent: parentId, ...NOT_DELETED });
  },

  findDirectChildren(parentId) {
    return Category.find({ parent: parentId, ...NOT_DELETED });
  },

  // --- Public storefront reads (published + visible only) -----------------

  findPublicBySlug(slug) {
    return Category.findOne({ slug, ...PUBLIC_FILTER })
      .populate('ancestors', 'name slug')
      .populate('parent', 'name slug')
      .populate(MEDIA_POPULATE_FIELDS);
  },

  findPublicTree() {
    return Category.find(PUBLIC_FILTER).populate('parent', 'name slug').populate(MEDIA_POPULATE_FIELDS).sort({
      order: 1,
      name: 1,
    });
  },

  findFeatured(limit) {
    return Category.find({ ...PUBLIC_FILTER, isFeatured: true })
      .populate(MEDIA_POPULATE_FIELDS)
      .sort({ order: 1 })
      .limit(limit);
  },

  findHomepage(limit) {
    return Category.find({ ...PUBLIC_FILTER, showOnHomepage: true })
      .populate(MEDIA_POPULATE_FIELDS)
      .sort({ order: 1 })
      .limit(limit);
  },

  findNavbar() {
    return Category.find({ ...PUBLIC_FILTER, showInNavbar: true })
      .populate('parent', 'name slug')
      .populate(MEDIA_POPULATE_FIELDS)
      .sort({ order: 1 });
  },

  // "Trending" is real signal, not a manually-toggled flag - most-viewed
  // published categories, richest-first. See categoryRepository.incrementViewCount.
  findTrending(limit) {
    return Category.find({ ...PUBLIC_FILTER, viewCount: { $gt: 0 } })
      .populate(MEDIA_POPULATE_FIELDS)
      .sort({ viewCount: -1 })
      .limit(limit);
  },

  incrementViewCount(id) {
    return Category.updateOne({ _id: id }, { $inc: { viewCount: 1 } });
  },

  // The "All Categories" page - every published/visible category, flat and
  // paginated (unlike findPublicTree, which returns everything nested and
  // unpaginated for the mega menu).
  async findPublicPaginated({ page, limit }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Category.find(PUBLIC_FILTER).populate(MEDIA_POPULATE_FIELDS).sort({ order: 1, name: 1 }).skip(skip).limit(limit),
      Category.countDocuments(PUBLIC_FILTER),
    ]);
    return { items, total };
  },

  incrementClickCount(id) {
    return Category.updateOne({ _id: id }, { $inc: { clickCount: 1 } });
  },

  findDescendants(categoryId) {
    return Category.find({ ancestors: categoryId, ...NOT_DELETED });
  },

  findChildrenNotIn(parentIds, excludeIds) {
    return Category.find({ parent: { $in: parentIds }, _id: { $nin: excludeIds }, ...NOT_DELETED }).select(
      'name parent'
    );
  },

  create(data) {
    return Category.create(data).then((category) => category.populate(MEDIA_POPULATE_FIELDS));
  },

  async updateById(id, data, session) {
    const existing = await Category.findOne({ _id: id, ...NOT_DELETED }).session(session ?? null);
    if (!existing) return null;
    Object.assign(existing, data);
    await existing.save({ session });
    return existing.populate(MEDIA_POPULATE_FIELDS);
  },

  // Soft delete - the category leaves every "live" listing/tree query above
  // but its document (and history) is preserved for restore.
  async softDeleteById(id, deletedBy, session) {
    return Category.findOneAndUpdate(
      { _id: id, ...NOT_DELETED },
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy } },
      { new: true, session: session ?? undefined }
    );
  },

  async softDeleteMany(ids, deletedBy) {
    return Category.updateMany(
      { _id: { $in: ids }, ...NOT_DELETED },
      { $set: { isDeleted: true, deletedAt: new Date(), deletedBy } }
    );
  },

  async restoreById(id) {
    return Category.findOneAndUpdate(
      { _id: id, isDeleted: true },
      { $set: { isDeleted: false, deletedAt: null, deletedBy: null } },
      { new: true }
    ).populate(MEDIA_POPULATE_FIELDS);
  },

  // Irreversible - only ever called on an already soft-deleted category
  // (see categoryService.permanentlyDeleteCategory).
  deleteById(id) {
    return Category.findByIdAndDelete(id);
  },

  deleteByIds(ids) {
    return Category.deleteMany({ _id: { $in: ids } });
  },

  updateManyStatus(ids, status, updatedBy) {
    return Category.updateMany({ _id: { $in: ids }, ...NOT_DELETED }, { $set: { status, updatedBy } });
  },

  // Positive/negative delta applied atomically - safe under concurrent
  // product writes, unlike a read-then-write count. Floored at 0 so a
  // mis-ordered delete/create pair can never push it negative.
  async incrementProductCount(categoryId, delta, session) {
    if (!categoryId || !delta) return;
    await Category.updateOne({ _id: categoryId }, [
      { $set: { productCount: { $max: [0, { $add: ['$productCount', delta] }] } } },
    ]).session(session ?? null);
  },

  // Re-parents every direct child of `sourceId` onto `targetId` in one write
  // - used by categoryService.mergeCategories, which recomputes each moved
  // child's ancestors afterwards (a bulk updateMany can't touch that
  // materialized-path field itself).
  reparentChildren(sourceId, targetId, session) {
    return Category.updateMany(
      { parent: sourceId, ...NOT_DELETED },
      { $set: { parent: targetId } }
    ).session(session ?? null);
  },

  // One number per category: its own productCount plus every descendant's
  // (found via the ancestors materialized path, so no recursive tree walk).
  // Powers the "Rings (1,284)" style count Tanishq shows on a parent
  // category, which naturally includes Diamond Rings, Gold Rings, etc.
  async getSubtreeProductCounts() {
    const rows = await Category.aggregate([
      { $match: NOT_DELETED },
      { $project: { contributesTo: { $concatArrays: [['$_id'], '$ancestors'] }, productCount: 1 } },
      { $unwind: '$contributesTo' },
      { $group: { _id: '$contributesTo', total: { $sum: '$productCount' } } },
    ]);

    return new Map(rows.map((row) => [row._id.toString(), row.total]));
  },

  findForAnalytics({ page, limit, sortBy }) {
    const sort = { [sortBy]: -1 };
    const skip = (page - 1) * limit;

    return Promise.all([
      Category.find(NOT_DELETED).select('name slug productCount viewCount clickCount').sort(sort).skip(skip).limit(limit),
      Category.countDocuments(NOT_DELETED),
    ]).then(([items, total]) => ({ items, total }));
  },

  // Recomputes a category's ancestors from its current parent, then recurses
  // into its children so the whole subtree stays consistent after a reparent.
  // Runs inside the caller's session (if any) so a reparent + cascade is
  // all-or-nothing, matching the transactional pattern already used by
  // product.service.js#createProduct.
  async recomputeAncestors(categoryId, session) {
    const category = await Category.findById(categoryId).select('parent ancestors').session(session ?? null);
    if (!category) return;

    const parentDoc = category.parent
      ? await Category.findById(category.parent).select('ancestors').session(session ?? null)
      : null;
    const ancestors = category.parent ? [...(parentDoc?.ancestors ?? []), category.parent] : [];

    await Category.updateOne({ _id: categoryId }, { $set: { ancestors } }).session(session ?? null);

    const children = await Category.find({ parent: categoryId }).select('_id').session(session ?? null);
    for (const child of children) {
      await this.recomputeAncestors(child._id, session);
    }
  },
};
