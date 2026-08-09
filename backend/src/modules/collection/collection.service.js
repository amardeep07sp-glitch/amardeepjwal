import { ApiError } from '../../utils/ApiError.js';
import { buildCopyName } from '../../utils/copyName.js';
import { CATALOG_STATUSES } from '../../constants/catalog.js';
import { collectionRepository } from './collection.repository.js';
import { productRepository } from '../product/product.repository.js';
import { productService } from '../product/product.service.js';
import { inventoryRepository } from '../inventory/inventory.repository.js';
import { orderItemRepository } from '../order/orderItem.repository.js';
import { productAnalyticsService } from '../cip/productAnalytics.service.js';
import { buildRuleFilter } from './collection.rules.js';
import { serializeCollection, serializeCollectionList, serializePublicCollection } from './collection.serializer.js';
import { ASSIGNMENT_TYPES, MERCHANDISING_SORT_MODES, RULE_FIELDS } from './collection.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Sort modes expressible as a real Mongo sort - handled by
// productRepository.findPublicByFilter directly. The rest (best_selling,
// most_viewed, random) need a "resolve full candidate set, rank/shuffle it,
// then slice the page" shape instead - see _resolveRankedPage below.
const DIRECT_SORT_MODES = new Set([
  MERCHANDISING_SORT_MODES.MANUAL,
  MERCHANDISING_SORT_MODES.NEWEST,
  MERCHANDISING_SORT_MODES.PRICE_ASC,
  MERCHANDISING_SORT_MODES.PRICE_DESC,
]);

// Resolves the one meaningful "stock" rule condition (a rule set with more
// than one, contradictory stock condition is a nonsensical edge case not
// worth designing around) into the id set buildRuleFilter needs. Binary
// in_stock/out_of_stock only - availableQuantity is already summed across
// every warehouse (inventoryRepository.getAvailableQuantityByProductIds), and
// minimumStock/low_stock/pre_order/discontinued are genuinely per-warehouse
// states that don't aggregate honestly across warehouses at the product
// level, so they're not offered here.
async function resolveStockConditionIds(conditions) {
  const stockCondition = conditions?.find((c) => c.field === RULE_FIELDS.STOCK);
  if (!stockCondition) return undefined;

  const allIds = await productRepository.findAllPublicIds();
  if (allIds.length === 0) return [];

  const stockRows = await inventoryRepository.getAvailableQuantityByProductIds(allIds);
  const availableById = new Map(stockRows.map((row) => [String(row._id), row.totalAvailable]));

  const wantsInStock = stockCondition.value !== 'out_of_stock';
  return allIds.filter((id) => {
    const isInStock = (availableById.get(id) ?? 0) > 0;
    return wantsInStock ? isInStock : !isInStock;
  });
}

// Fisher-Yates, seeded so "random" reshuffles once per browsing session
// (the client generates and reuses one seed across an infinite-scroll
// session) rather than re-sampling on every page, which would duplicate/skip
// items across pages.
function seededShuffle(ids, seed) {
  const arr = [...ids];
  let s = seed || 1;
  const next = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(next() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function rankCandidateIds(candidateIds, sortMode, seed) {
  if (candidateIds.length === 0) return [];

  if (sortMode === MERCHANDISING_SORT_MODES.BEST_SELLING) {
    const ranked = await orderItemRepository.getBestSellingProductIds(candidateIds, candidateIds.length);
    const rankedIds = ranked.map((row) => String(row._id));
    const rankedSet = new Set(rankedIds);
    // Anything with zero sales still appears (newest-first), just after
    // everything with real sales - never silently dropped from its own
    // collection just because it hasn't sold yet.
    const unranked = candidateIds.filter((id) => !rankedSet.has(id));
    return [...rankedIds, ...unranked];
  }

  if (sortMode === MERCHANDISING_SORT_MODES.MOST_VIEWED) {
    const ranked = await productAnalyticsService.getViewCountsForProductIds(candidateIds);
    const rankedIds = ranked.map((row) => String(row._id));
    const rankedSet = new Set(rankedIds);
    const unranked = candidateIds.filter((id) => !rankedSet.has(id));
    return [...rankedIds, ...unranked];
  }

  // random
  return seededShuffle(candidateIds, seed);
}

export const collectionService = {
  async listCollections(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await collectionRepository.findPaginated({ page, limit, ...filters });
    return { items: serializeCollectionList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  async getCollectionById(id) {
    const collection = await collectionRepository.findById(id);
    if (!collection) throw new ApiError(404, 'Collection not found');
    return serializeCollection(collection);
  },

  async createCollection(data) {
    const collection = await collectionRepository.create(data);
    return serializeCollection(collection);
  },

  async updateCollection(id, data) {
    const collection = await collectionRepository.updateById(id, data);
    if (!collection) throw new ApiError(404, 'Collection not found');
    return serializeCollection(collection);
  },

  // NOTE: product-existence delete guard will be added once the Product
  // module exists (Phase 6). Collections have no dependents yet.
  async deleteCollection(id) {
    const collection = await collectionRepository.deleteById(id);
    if (!collection) throw new ApiError(404, 'Collection not found');
    return collection;
  },

  async bulkDelete(ids) {
    await collectionRepository.deleteByIds(ids);
  },

  async bulkUpdateStatus(ids, status) {
    await collectionRepository.updateManyStatus(ids, status);
  },

  async duplicateCollection(id) {
    const original = await collectionRepository.findById(id);
    if (!original) throw new ApiError(404, 'Collection not found');

    const copy = await collectionRepository.create({
      name: buildCopyName(original.name),
      description: original.description,
      shortDescription: original.shortDescription,
      skuPrefix: original.skuPrefix,
      // findById populates these into full documents - extract just the id,
      // since the copy is a reference to the same underlying asset/relation.
      bannerMedia: original.bannerMedia?._id ?? null,
      thumbnailMedia: original.thumbnailMedia?._id ?? null,
      mobileBannerMedia: original.mobileBannerMedia?._id ?? null,
      promoVideoMedia: original.promoVideoMedia?._id ?? null,
      relatedCollections: original.relatedCollections?.map((c) => c._id ?? c) ?? [],
      parentCampaign: original.parentCampaign?._id ?? null,
      type: original.type,
      assignmentType: original.assignmentType,
      rules: original.rules,
      sortMode: original.sortMode,
      visibility: original.visibility,
      faqs: original.faqs,
      status: CATALOG_STATUSES.DRAFT,
      isFeatured: false,
      isVisible: original.isVisible,
      order: original.order,
      seo: original.seo,
      // Scheduling and analytics counters are never copied - a clone is a
      // fresh, unscheduled, zero-view collection, not a shadow of the
      // original's live schedule/history.
    });

    return serializeCollection(copy);
  },

  // --- Product resolution (manual + rule-based, shared by admin preview,
  // the Merchandising/Preview tabs, and the customer product grid) ---------

  // `sortOverride`/`minPrice`/`maxPrice` are the customer-facing Sort/Filter
  // controls on the storefront's collection page - layered on top of
  // whichever base filter decides membership (manual collectionId or the
  // rule filter), never replacing it. Only the direct-sortable modes are
  // offered as a customer override (best_selling/most_viewed/random stay the
  // curator's own default, not something a shopper picks).
  async resolveCollectionProducts(collection, { page, limit, randomSeed, sortOverride, minPrice, maxPrice } = {}) {
    const baseFilter =
      collection.assignmentType === ASSIGNMENT_TYPES.RULE_BASED
        ? buildRuleFilter(collection.rules, { inStockProductIds: await resolveStockConditionIds(collection.rules?.conditions) })
        : productRepository.buildManualCollectionFilter(collection.id ?? collection._id);

    const priceClause =
      minPrice !== undefined || maxPrice !== undefined
        ? { 'pricing.finalPrice': { ...(minPrice !== undefined ? { $gte: minPrice } : {}), ...(maxPrice !== undefined ? { $lte: maxPrice } : {}) } }
        : null;
    const filter = priceClause ? { $and: [baseFilter, priceClause] } : baseFilter;

    const sortMode = (sortOverride && DIRECT_SORT_MODES.has(sortOverride) ? sortOverride : collection.sortMode) ?? MERCHANDISING_SORT_MODES.MANUAL;

    if (DIRECT_SORT_MODES.has(sortMode)) {
      const { items, total } = await productRepository.findPublicByFilter(filter, { sortMode, page, limit });
      return { items: await productService.buildPublicProductList(items), meta: buildPaginationMeta(page, limit, total) };
    }

    const candidateIds = await productRepository.findPublicIdsByFilter(filter);
    const rankedIds = await rankCandidateIds(candidateIds, sortMode, randomSeed);
    const total = rankedIds.length;
    const skip = (page - 1) * limit;
    const pageIds = rankedIds.slice(skip, skip + limit);

    if (pageIds.length === 0) return { items: [], meta: buildPaginationMeta(page, limit, total) };

    const docs = await productRepository.findPublicByIds(pageIds);
    const docsById = new Map(docs.map((doc) => [String(doc._id), doc]));
    const orderedDocs = pageIds.map((id) => docsById.get(id)).filter(Boolean);

    return { items: await productService.buildPublicProductList(orderedDocs), meta: buildPaginationMeta(page, limit, total) };
  },

  // Cheap "≈N products match" for the admin Rule Builder - counts, never
  // fetches full documents.
  async previewRuleMatchCount(rules) {
    const filter = buildRuleFilter(rules, { inStockProductIds: await resolveStockConditionIds(rules?.conditions) });
    return productRepository.findPublicIdsByFilter(filter).then((ids) => ids.length);
  },

  reorderCollectionProducts(collectionId, orderedIds) {
    return productRepository.reorderCollectionProducts(collectionId, orderedIds);
  },

  // --- Public storefront reads --------------------------------------------

  async getPublicCollectionList({ page, limit, type }) {
    const { items, total } = await collectionRepository.findPublicPaginated({ page, limit, type });
    return { items: items.map(serializePublicCollection), meta: buildPaginationMeta(page, limit, total) };
  },

  // Raw (unserialized) doc, deliberately - resolveCollectionProducts needs
  // assignmentType/rules/sortMode, which serializePublicCollection strips
  // (they're admin-only internals). findPublicBySlug already applies the
  // same published+visibility+schedule filter as getPublicCollectionBySlug,
  // so a customer can never resolve products for a collection they
  // shouldn't even be able to see the metadata of.
  async getCollectionForPublicResolution(slug) {
    const collection = await collectionRepository.findPublicBySlug(slug);
    if (!collection) throw new ApiError(404, 'Collection not found');
    return collection;
  },

  async getPublicCollectionBySlug(slug) {
    const collection = await collectionRepository.findPublicBySlug(slug);
    if (!collection) throw new ApiError(404, 'Collection not found');
    // Fire-and-forget, exactly like categoryService's own cheap counter -
    // never blocks the response on a write that only feeds the admin
    // dashboard's "top collections" panel.
    collectionRepository.incrementViewCount(collection._id).catch(() => {});
    return serializePublicCollection(collection);
  },

  async trackPublicCollectionClick(id) {
    await collectionRepository.incrementClickCount(id);
  },

  // --- Scheduling (collection.jobs.js's cron targets) -----------------------

  async runAutoPublishSweep(now = new Date()) {
    const due = await collectionRepository.findDueForAutoPublish(now);
    if (due.length === 0) return 0;
    await collectionRepository.updateManyStatus(due.map((c) => c._id), CATALOG_STATUSES.PUBLISHED);
    return due.length;
  },

  async runAutoArchiveSweep(now = new Date()) {
    const due = await collectionRepository.findDueForAutoArchive(now);
    if (due.length === 0) return 0;
    await collectionRepository.updateManyStatus(due.map((c) => c._id), CATALOG_STATUSES.ARCHIVED);
    return due.length;
  },

  // --- Dashboard (real counts, no fabrication) ------------------------------

  async getDashboardStats() {
    const [statusCounts, typeCounts, scheduledCount] = await Promise.all([
      collectionRepository.getStatusCounts(),
      collectionRepository.getTypeCounts(),
      collectionRepository.countScheduled(),
    ]);
    return {
      byStatus: Object.fromEntries(statusCounts.map((row) => [row._id, row.count])),
      byType: Object.fromEntries(typeCounts.map((row) => [row._id, row.count])),
      scheduledCount,
    };
  },
};
