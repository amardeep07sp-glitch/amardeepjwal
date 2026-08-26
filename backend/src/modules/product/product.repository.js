import mongoose from 'mongoose';
import { Product } from './product.model.js';
import { CATALOG_STATUSES } from '../../constants/catalog.js';

const POPULATE_FIELDS = [
  { path: 'category', select: 'name slug' },
  { path: 'brand', select: 'name slug' },
  { path: 'collectionId', select: 'name slug' },
  { path: 'attributeGroups', select: 'name slug' },
  { path: 'seo.ogImageMedia' },
];

// What the storefront is allowed to see: published + visible + actually
// priced. A draft/hidden/archived product can exist in the admin panel
// without ever being reachable by a customer - and a product an admin has
// only half-finished setting up (created, but pricing never configured)
// would otherwise show up as a broken-looking "₹0" card, so it's excluded
// the same way an unpublished one is, not specially handled by the UI.
const PUBLIC_FILTER = { status: CATALOG_STATUSES.PUBLISHED, isVisible: true, 'pricing.finalPrice': { $gt: 0 } };
const PUBLIC_POPULATE_FIELDS = [
  { path: 'category', select: 'name slug' },
  { path: 'brand', select: 'name slug' },
];

export const productRepository = {
  async findPaginated({ page, limit, status, category, brand, collectionId, isFeatured, search, sortBy, sortOrder }) {
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (collectionId) filter.collectionId = collectionId;
    if (isFeatured !== undefined) filter.isFeatured = isFeatured;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find(filter).populate(POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return Product.findById(id).populate(POPULATE_FIELDS);
  },

  // Unpopulated - safe to feed straight back into create() when cloning,
  // since populated ref fields would otherwise need to be re-flattened to ids.
  findRawById(id, session) {
    return Product.findById(id).session(session ?? null);
  },

  // The promotion engine's own scope-matching read (coupon.service.js) -
  // raw category/brand/collectionId/metal/purity/gemstoneType/pricing,
  // regardless of publish status (a cart item's product must still be
  // evaluable even if it's since been unpublished).
  findRawByIds(ids) {
    return Product.find({ _id: { $in: ids } }).select('category brand collectionId metal purity gemstoneType pricing');
  },

  async create(data, session) {
    const [created] = await Product.create([data], { session: session ?? undefined });
    return created;
  },

  countByPrefix(prefix) {
    return Product.countDocuments({ sku: { $regex: `^${prefix}-`, $options: 'i' } });
  },

  // Used by categoryService's delete guard - a category with live products
  // assigned to it can't be removed.
  countByCategory(categoryId) {
    return Product.countDocuments({ category: categoryId });
  },

  // Grouped counts for a set of product ids, read just before those products
  // are deleted - lets bulkDelete decrement each affected category's
  // productCount by the right amount in one pass instead of one query per id.
  countsByCategoryForIds(ids) {
    return Product.aggregate([
      { $match: { _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
  },

  async updateById(id, data, { allowSkuChange = false } = {}) {
    const existing = await Product.findById(id);
    if (!existing) return null;
    if (allowSkuChange) existing.$locals.allowSkuChange = true;
    Object.assign(existing, data);
    await existing.save();
    return existing.populate(POPULATE_FIELDS);
  },

  // Dedicated, minimal write for review.service.js's rating aggregate -
  // a direct findByIdAndUpdate (not the full updateById above) so writing
  // a recomputed average/count never re-runs the slug/SKU save hooks or
  // pulls in the full populate chain for what's just two numbers.
  updateRatingSummary(id, { ratingAverage, reviewCount }) {
    return Product.findByIdAndUpdate(id, { $set: { ratingAverage, reviewCount } });
  },

  deleteById(id) {
    return Product.findByIdAndDelete(id);
  },

  deleteByIds(ids) {
    return Product.deleteMany({ _id: { $in: ids } });
  },

  updateManyStatus(ids, status) {
    return Product.updateMany({ _id: { $in: ids } }, { $set: { status } });
  },

  // Used by categoryService.mergeCategories - every product pointing at the
  // category being merged away is repointed at the surviving one, in place.
  reassignCategory(fromCategoryId, toCategoryId, session) {
    return Product.updateMany(
      { category: fromCategoryId },
      { $set: { category: toCategoryId } }
    ).session(session ?? null);
  },

  // --- Public storefront reads (published + visible only) -----------------

  // The general-purpose listing read - powers the New Arrivals full page,
  // a category page, the Offers page, and the All Products page's filter
  // sidebar, all through one query shape.
  async findPublicPaginated({ page, limit, categoryIds, brandIds, tags, minPrice, maxPrice, sortBy, onSale, gender, occasion, search }) {
    const filter = { ...PUBLIC_FILTER };
    if (categoryIds?.length) filter.category = { $in: categoryIds };
    if (brandIds?.length) filter.brand = { $in: brandIds };
    if (tags?.length) filter.tags = { $in: tags };
    if (gender) filter.gender = gender;
    if (occasion?.length) filter.occasion = { $in: occasion };
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter['pricing.finalPrice'] = {
        ...filter['pricing.finalPrice'],
        ...(minPrice !== undefined ? { $gte: minPrice } : {}),
        ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
      };
    }
    // Mongo can't compare two fields of the same document with a plain
    // filter - $expr is the one place that's allowed.
    if (onSale) filter.$expr = { $lt: ['$pricing.finalPrice', '$pricing.mrp'] };
    // Runs on the weighted text index (product.model.js) - stemmed,
    // relevance-scored, not a regex scan. Combines fine with every other
    // filter above (category/price/gender/... + search all narrow the same
    // query together, exactly like a real product search page).
    if (search) filter.$text = { $search: search };

    const sort =
      {
        featured: { isFeatured: -1, createdAt: -1 },
        price_asc: { 'pricing.finalPrice': 1 },
        price_desc: { 'pricing.finalPrice': -1 },
      }[sortBy] ?? { createdAt: -1 };
    // A search with no explicit sort choice ranks by how well it matches,
    // not by how new/featured it is - `sortBy` only overrides this when the
    // caller actually picked a sort (price high/low, newest).
    const useRelevance = Boolean(search) && sortBy === 'featured';

    const skip = (page - 1) * limit;
    let query = Product.find(filter, useRelevance ? { score: { $meta: 'textScore' } } : undefined).populate(
      PUBLIC_POPULATE_FIELDS
    );
    query = useRelevance ? query.sort({ score: { $meta: 'textScore' } }) : query.sort(sort);

    const [items, total] = await Promise.all([query.skip(skip).limit(limit), Product.countDocuments(filter)]);

    return { items, total };
  },

  // The header search bar's live-typing dropdown - same two-pass
  // prefix-then-contains shape as categoryRepository.searchAutocomplete,
  // not the weighted text index above (a text index needs whole tokens;
  // "ring" typed as "rin" should still suggest something as the visitor is
  // still typing). Deliberately lightweight (name only, small `limit`) -
  // the full-text/full-filter search lives in findPublicPaginated once they
  // actually submit.
  async searchAutocomplete(searchTerm, limit) {
    const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prefixMatches = await Product.find({ name: { $regex: `^${escapedTerm}`, $options: 'i' }, ...PUBLIC_FILTER })
      .select('name slug pricing')
      .populate(PUBLIC_POPULATE_FIELDS)
      .limit(limit);

    if (prefixMatches.length >= limit) return prefixMatches;

    const remainingSlots = limit - prefixMatches.length;
    const containsMatches = await Product.find({
      name: { $regex: escapedTerm, $options: 'i' },
      _id: { $nin: prefixMatches.map((product) => product._id) },
      ...PUBLIC_FILTER,
    })
      .select('name slug pricing')
      .populate(PUBLIC_POPULATE_FIELDS)
      .limit(remainingSlots);

    return [...prefixMatches, ...containsMatches];
  },

  // The sidebar's facet data - real numbers, not the arbitrary bucket
  // counts a mockup shows. Deliberately global (not narrowed by the
  // filters currently applied) - a simpler, still-honest v1; narrowing
  // facets by the current selection is a real future refinement, not a
  // fabrication concern.
  async getPublicPriceRange() {
    const [row] = await Product.aggregate([
      { $match: PUBLIC_FILTER },
      { $group: { _id: null, min: { $min: '$pricing.finalPrice' }, max: { $max: '$pricing.finalPrice' } } },
    ]);
    return row ? { min: row.min, max: row.max } : { min: 0, max: 0 };
  },

  getPublicTagCounts() {
    return Product.aggregate([
      { $match: { ...PUBLIC_FILTER, tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);
  },

  // Real counts per Gender/Occasion value (see constants/catalog.js) - same
  // shape/intent as getPublicTagCounts, just grouped by these two dedicated
  // fields instead of the free-text tags array. A value with 0 matching
  // products simply doesn't appear - the storefront never shows a facet
  // option that would lead to an empty page.
  getPublicGenderCounts() {
    return Product.aggregate([
      { $match: { ...PUBLIC_FILTER, gender: { $ne: null } } },
      { $group: { _id: '$gender', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  },

  getPublicOccasionCounts() {
    return Product.aggregate([
      { $match: { ...PUBLIC_FILTER, occasion: { $exists: true, $ne: [] } } },
      { $unwind: '$occasion' },
      { $group: { _id: '$occasion', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  },

  // Keyed by brand id (a real ObjectId, unlike tags/gender/occasion's plain
  // string values) - callers join this against the Brand collection
  // themselves (see brand.service.js#listPublicBrands and
  // product.service.js#getPublicFacets) rather than this repository
  // reaching across modules to resolve names.
  getPublicBrandCounts() {
    return Product.aggregate([
      { $match: { ...PUBLIC_FILTER, brand: { $ne: null } } },
      { $group: { _id: '$brand', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  },

  findPublicNewArrivals(limit) {
    return Product.find(PUBLIC_FILTER).populate(PUBLIC_POPULATE_FIELDS).sort({ createdAt: -1 }).limit(limit);
  },

  findPublicFeatured(limit) {
    return Product.find({ ...PUBLIC_FILTER, isFeatured: true })
      .populate(PUBLIC_POPULATE_FIELDS)
      .sort({ order: 1, createdAt: -1 })
      .limit(limit);
  },

  findPublicBySlug(slug) {
    return Product.findOne({ slug, ...PUBLIC_FILTER })
      .populate(PUBLIC_POPULATE_FIELDS)
      .populate('attributeGroups', 'name slug');
  },

  // "You may also like" - same category, everything else the same rules
  // as any other public read (published + visible + priced), excluding the
  // product being viewed.
  findPublicSimilar(categoryId, excludeProductId, limit) {
    return Product.find({ ...PUBLIC_FILTER, category: categoryId, _id: { $ne: excludeProductId } })
      .populate(PUBLIC_POPULATE_FIELDS)
      .sort({ createdAt: -1 })
      .limit(limit);
  },

  // --- Collection Engine v2.0 - product resolution --------------------------

  // A manual-assignment collection's membership filter - single collectionId
  // ref, exactly like every other public read (category, brand, ...).
  buildManualCollectionFilter(collectionId) {
    return { ...PUBLIC_FILTER, collectionId };
  },

  // Every id a customer could ever see - the universe a rule-based
  // collection's "Stock" criterion resolves against (a draft/unpublished
  // product could never surface in a live automatic collection anyway).
  async findAllPublicIds() {
    const docs = await Product.find(PUBLIC_FILTER).select('_id');
    return docs.map((doc) => String(doc._id));
  },

  // Sort modes expressible as a real Mongo sort (fast path). best_selling and
  // most_viewed need a ranking aggregation first, random needs a once-per-
  // session shuffle - collectionService resolves those via
  // findPublicIdsByFilter + findPublicByIds below instead of this map.
  async findPublicByFilter(filter, { sortMode, page, limit }) {
    const sort =
      {
        manual: { collectionSortOrder: 1 },
        newest: { createdAt: -1 },
        price_asc: { 'pricing.finalPrice': 1 },
        price_desc: { 'pricing.finalPrice': -1 },
      }[sortMode] ?? { createdAt: -1 };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Product.find(filter).populate(PUBLIC_POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);
    return { items, total };
  },

  // Cheap id-only fetch - builds the ranking candidate set for
  // best_selling/most_viewed/random sort modes before any page is sliced.
  // Flag: for a very large automatic collection this re-resolves the full
  // candidate set on every request (same live-resolution tradeoff already
  // accepted for getPublicFacets) - the first thing to revisit (e.g. a
  // short-TTL cache of resolved ids) if collection sizes grow into the
  // thousands.
  async findPublicIdsByFilter(filter) {
    const docs = await Product.find(filter).select('_id');
    return docs.map((doc) => String(doc._id));
  },

  // Fetches a specific, already-ranked/shuffled slice of ids for display -
  // Mongo's $in doesn't preserve array order, so callers must re-sort the
  // returned documents to match `ids`' order themselves.
  findPublicByIds(ids) {
    return Product.find({ ...PUBLIC_FILTER, _id: { $in: ids } }).populate(PUBLIC_POPULATE_FIELDS);
  },

  // The Merchandising tab's drag-drop save - scoped to collectionId as a
  // safety guard so a stale/tampered id list can never reorder products
  // outside the collection being edited.
  reorderCollectionProducts(collectionId, orderedIds) {
    return Product.bulkWrite(
      orderedIds.map((id, index) => ({
        updateOne: { filter: { _id: id, collectionId }, update: { $set: { collectionSortOrder: index } } },
      }))
    );
  },
};
