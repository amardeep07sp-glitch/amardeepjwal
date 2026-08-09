import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { logger } from '../../config/logger.js';
import { redisClient } from '../../config/redis.js';
import { env } from '../../config/env.js';
import { CATALOG_STATUSES } from '../../constants/catalog.js';
import { categoryRepository } from './category.repository.js';
import { productRepository } from '../product/product.repository.js';
import { activityLogService } from '../activityLog/activityLog.service.js';
import { buildCategoryCsv, parseCategoryCsv } from './category.csv.js';
import { buildCategorySitemapXml } from './category.sitemap.js';
import {
  serializeCategory,
  serializeCategoryList,
  serializeCategoryTree,
  serializeCategoryOptionList,
  serializePublicCategory,
  serializePublicCategoryList,
  serializePublicCategoryTree,
} from './category.serializer.js';

const ACTIVITY_LOG_MODULE = 'category';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Thin wrapper so every call site below reads as "what happened", not
// "which fields does the activity log schema want" - activityLogService.record
// is itself best-effort (never throws), so this never needs a try/catch either.
const logCategoryActivity = (action, entityId, entityName, actorId, metadata = {}) =>
  activityLogService.record({
    module: ACTIVITY_LOG_MODULE,
    action,
    entityId,
    entityName,
    performedBy: actorId,
    metadata,
  });

// Tree reads vastly outnumber writes (every storefront navbar/mega-menu
// render hits it) so it's cached; every write below explicitly busts it
// rather than relying on the TTL, so admins never see a stale tree.
const TREE_CACHE_TTL_SECONDS = 300;
const treeCacheKey = (status) => `category:tree:${status ?? 'all'}`;
const PUBLIC_TREE_CACHE_KEY = 'category:public-tree';
const ALL_TREE_CACHE_KEYS = [
  treeCacheKey(),
  ...Object.values(CATALOG_STATUSES).map(treeCacheKey),
  PUBLIC_TREE_CACHE_KEY,
];

// Redis is best-effort here - config/redis.js connects lazily and rejects
// fast when unavailable, so a cache miss/error should fall through to Mongo
// rather than fail the request.
const invalidateTreeCache = async () => {
  try {
    await redisClient.del(...ALL_TREE_CACHE_KEYS);
  } catch (err) {
    logger.warn({ err: err.message }, 'Category tree cache invalidation failed');
  }
};

const readTreeCache = async (cacheKey) => {
  try {
    const cached = await redisClient.get(cacheKey);
    return cached ? JSON.parse(cached) : null;
  } catch (err) {
    logger.warn({ err: err.message }, 'Category tree cache read failed');
    return null;
  }
};

const writeTreeCache = async (cacheKey, tree) => {
  try {
    await redisClient.set(cacheKey, JSON.stringify(tree), 'EX', TREE_CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn({ err: err.message }, 'Category tree cache write failed');
  }
};

const assertNoCircularReference = async (categoryId, newParentId) => {
  if (!newParentId) return;
  if (newParentId === categoryId) {
    throw new ApiError(400, 'A category cannot be its own parent');
  }

  const newParent = await categoryRepository.findById(newParentId);
  if (!newParent) {
    throw new ApiError(400, 'Selected parent category does not exist');
  }

  const isDescendant = newParent.ancestors.some((ancestorId) => ancestorId.toString() === categoryId);
  if (isDescendant) {
    throw new ApiError(400, 'Cannot assign a descendant category as the parent - this would create a circular reference');
  }
};

const assertCanDelete = async (categoryId) => {
  const childCount = await categoryRepository.findDirectChildrenCount(categoryId);
  if (childCount > 0) {
    throw new ApiError(409, 'Cannot delete a category that has subcategories');
  }

  const productCount = await productRepository.countByCategory(categoryId);
  if (productCount > 0) {
    throw new ApiError(409, 'Cannot delete a category that still has products assigned to it');
  }
};

export const categoryService = {
  async listCategories(query) {
    const { page, limit, ...filters } = query;
    const [{ items, total }, countsById] = await Promise.all([
      categoryRepository.findFlatPaginated({ page, limit, ...filters }),
      categoryRepository.getSubtreeProductCounts(),
    ]);
    return { items: serializeCategoryList(items, countsById), meta: buildPaginationMeta(page, limit, total) };
  },

  async searchCategories(searchTerm, limit) {
    const matches = await categoryRepository.searchAutocomplete(searchTerm, limit);
    return serializeCategoryOptionList(matches);
  },

  async getCategoryTree({ status } = {}) {
    const cacheKey = treeCacheKey(status);
    const cached = await readTreeCache(cacheKey);
    if (cached) return cached;

    const filter = status ? { status } : {};
    const [categories, countsById] = await Promise.all([
      categoryRepository.findAll(filter),
      categoryRepository.getSubtreeProductCounts(),
    ]);
    const tree = serializeCategoryTree(categories, countsById);

    await writeTreeCache(cacheKey, tree);
    return tree;
  },

  async getCategoryById(id) {
    const [category, countsById] = await Promise.all([
      categoryRepository.findByIdWithParentChain(id),
      categoryRepository.getSubtreeProductCounts(),
    ]);
    if (!category) throw new ApiError(404, 'Category not found');
    return serializeCategory(category, { recursiveProductCount: countsById.get(id) });
  },

  async getCategoryBreadcrumb(id) {
    const category = await categoryRepository.findByIdWithParentChain(id);
    if (!category) throw new ApiError(404, 'Category not found');
    return [...category.ancestors, category].map((node) => ({
      id: node._id,
      name: node.name,
      slug: node.slug,
    }));
  },

  async listTrash(query) {
    const { page, limit } = query;
    const { items, total } = await categoryRepository.findTrashedPaginated({ page, limit });
    return { items: serializeCategoryList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  async getSitemapXml() {
    const categories = await categoryRepository.findAll({ status: CATALOG_STATUSES.PUBLISHED });
    return buildCategorySitemapXml(categories, env.SITE_URL);
  },

  async exportCategoriesCsv() {
    const categories = await categoryRepository.findAll();
    return buildCategoryCsv(categories);
  },

  // Never throws on a bad row - collects per-row errors so one typo doesn't
  // abort an otherwise-good batch (same contract as inventory's CSV import).
  // Rows are processed in file order, so a parent category listed before its
  // children resolves within a single import.
  async importCategoriesCsv(buffer, actorId) {
    const rows = parseCategoryCsv(buffer);
    const result = { created: 0, updated: 0, skipped: 0, errors: [] };

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2; // header is row 1

      if (!row.name) {
        result.skipped += 1;
        result.errors.push({ row: rowNumber, message: 'Missing name' });
        continue; // eslint-disable-line no-continue
      }

      let parentId = null;
      if (row.parentSlug) {
        // eslint-disable-next-line no-await-in-loop
        const parentCategory = await categoryRepository.findBySlug(row.parentSlug);
        if (!parentCategory) {
          result.skipped += 1;
          result.errors.push({ row: rowNumber, message: `Parent category with slug "${row.parentSlug}" not found` });
          continue; // eslint-disable-line no-continue
        }
        parentId = parentCategory._id;
      }

      const { parentSlug, metaTitle, metaDescription, metaKeywords, ...categoryFields } = row;
      const payload = {
        ...categoryFields,
        parent: parentId,
        seo: { metaTitle, metaDescription, metaKeywords },
      };

      // eslint-disable-next-line no-await-in-loop
      const existing = row.slug ? await categoryRepository.findBySlug(row.slug) : null;
      if (existing) {
        // eslint-disable-next-line no-await-in-loop
        await categoryRepository.updateById(existing._id, { ...payload, updatedBy: actorId });
        result.updated += 1;
      } else {
        // eslint-disable-next-line no-await-in-loop
        await categoryRepository.create({ ...payload, createdBy: actorId, updatedBy: actorId });
        result.created += 1;
      }
    }

    if (result.created > 0 || result.updated > 0) {
      await invalidateTreeCache();
      await logCategoryActivity('import', null, 'CSV import', actorId, {
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
      });
    }

    return result;
  },

  async createCategory(data, actorId) {
    await assertNoCircularReference(null, data.parent);
    const category = await categoryRepository.create({ ...data, createdBy: actorId, updatedBy: actorId });
    await invalidateTreeCache();
    await logCategoryActivity('create', category._id, category.name, actorId);
    return serializeCategory(category);
  },

  async updateCategory(id, data, actorId) {
    if (data.parent !== undefined) {
      await assertNoCircularReference(id, data.parent);
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    let category;
    try {
      category = await categoryRepository.updateById(id, { ...data, updatedBy: actorId }, session);
      if (!category) throw new ApiError(404, 'Category not found');

      if (data.parent !== undefined) {
        await categoryRepository.recomputeAncestors(id, session);
      }
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    await invalidateTreeCache();
    await logCategoryActivity('update', category._id, category.name, actorId, { fields: Object.keys(data) });
    return serializeCategory(category);
  },

  async updateStatus(id, status, actorId) {
    const category = await categoryRepository.updateById(id, { status, updatedBy: actorId });
    if (!category) throw new ApiError(404, 'Category not found');
    await invalidateTreeCache();
    await logCategoryActivity('status_change', category._id, category.name, actorId, { status });
    return serializeCategory(category);
  },

  async reorderCategories(updates, actorId) {
    for (const update of updates) {
      if (update.parent !== undefined) {
        await assertNoCircularReference(update.id, update.parent);
      }
    }

    const results = [];
    for (const update of updates) {
      const { id, ...data } = update;
      const category = await categoryRepository.updateById(id, { ...data, updatedBy: actorId });
      if (category && data.parent !== undefined) {
        await categoryRepository.recomputeAncestors(id);
      }
      if (category) {
        results.push(category);
        await logCategoryActivity('reorder', category._id, category.name, actorId, data);
      }
    }

    await invalidateTreeCache();
    return serializeCategoryList(results);
  },

  // Soft delete - reversible via restoreCategory. Subcategories and
  // in-use categories are still blocked, same guard as before.
  async deleteCategory(id, actorId) {
    await assertCanDelete(id);
    const category = await categoryRepository.softDeleteById(id, actorId);
    if (!category) throw new ApiError(404, 'Category not found');
    await invalidateTreeCache();
    await logCategoryActivity('delete', category._id, category.name, actorId);
    return category;
  },

  async restoreCategory(id, actorId) {
    const category = await categoryRepository.restoreById(id);
    if (!category) throw new ApiError(404, 'Category not found in trash');
    await invalidateTreeCache();
    await logCategoryActivity('restore', category._id, category.name, actorId);
    return serializeCategory(category);
  },

  // Irreversible - only meaningful on a category already in the trash, so it
  // goes through the same guards (no subcategories, no assigned products)
  // rather than assuming the earlier soft-delete check still holds.
  async permanentlyDeleteCategory(id, actorId) {
    const category = await categoryRepository.findByIdIncludingDeleted(id);
    if (!category) throw new ApiError(404, 'Category not found');
    if (!category.isDeleted) {
      throw new ApiError(409, 'Category must be moved to trash before it can be permanently deleted');
    }
    await assertCanDelete(id);
    await categoryRepository.deleteById(id);
    await logCategoryActivity('permanent_delete', category._id, category.name, actorId);
  },

  async bulkDelete(ids, actorId) {
    const externalChildren = await categoryRepository.findChildrenNotIn(ids, ids);
    if (externalChildren.length > 0) {
      throw new ApiError(
        409,
        'Cannot delete: some selected categories still have subcategories outside this selection'
      );
    }

    const productCounts = await Promise.all(ids.map((id) => productRepository.countByCategory(id)));
    if (productCounts.some((count) => count > 0)) {
      throw new ApiError(409, 'Cannot delete: some selected categories still have products assigned to them');
    }

    await categoryRepository.softDeleteMany(ids, actorId);
    await invalidateTreeCache();
    await Promise.all(ids.map((id) => logCategoryActivity('bulk_delete', id, '', actorId)));
  },

  async bulkUpdateStatus(ids, status, actorId) {
    await categoryRepository.updateManyStatus(ids, status, actorId);
    await invalidateTreeCache();
    await Promise.all(ids.map((id) => logCategoryActivity('bulk_status_change', id, '', actorId, { status })));
  },

  async duplicateCategory(id, actorId) {
    const original = await categoryRepository.findById(id);
    if (!original) throw new ApiError(404, 'Category not found');

    const copy = await categoryRepository.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      shortDescription: original.shortDescription,
      parent: original.parent,
      // findById populates these into full Media documents - extract just the
      // id, since the copy is a reference to the same underlying asset.
      iconMedia: original.iconMedia?._id ?? null,
      bannerMedia: original.bannerMedia?._id ?? null,
      thumbnailMedia: original.thumbnailMedia?._id ?? null,
      status: CATALOG_STATUSES.DRAFT,
      isFeatured: false,
      showInNavbar: false,
      showOnHomepage: false,
      isVisible: original.isVisible,
      order: original.order,
      seo: original.seo,
      createdBy: actorId,
      updatedBy: actorId,
    });

    await invalidateTreeCache();
    await logCategoryActivity('duplicate', copy._id, copy.name, actorId, { sourceId: id });
    return serializeCategory(copy);
  },

  // Folds `sourceId` into `targetId`: every product and direct child moves
  // to the target, the target's productCount absorbs the source's, and the
  // (now-empty) source is soft-deleted rather than hard-deleted - an admin
  // who merged the wrong pair can still restore it from the trash and undo
  // the reparenting by hand.
  async mergeCategories(sourceId, targetId, actorId) {
    if (sourceId === targetId) {
      throw new ApiError(400, 'Cannot merge a category into itself');
    }

    const [source, target] = await Promise.all([
      categoryRepository.findById(sourceId),
      categoryRepository.findById(targetId),
    ]);
    if (!source) throw new ApiError(404, 'Source category not found');
    if (!target) throw new ApiError(404, 'Target category not found');

    const targetIsDescendantOfSource = target.ancestors.some((ancestorId) => ancestorId.toString() === sourceId);
    if (targetIsDescendantOfSource) {
      throw new ApiError(400, 'Cannot merge a category into one of its own descendants');
    }

    const [movedProductCount, childrenToReparent] = await Promise.all([
      productRepository.countByCategory(sourceId),
      categoryRepository.findDirectChildren(sourceId),
    ]);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await productRepository.reassignCategory(sourceId, targetId, session);
      await categoryRepository.reparentChildren(sourceId, targetId, session);
      for (const child of childrenToReparent) {
        // eslint-disable-next-line no-await-in-loop
        await categoryRepository.recomputeAncestors(child._id, session);
      }
      await categoryRepository.incrementProductCount(targetId, movedProductCount, session);
      await categoryRepository.softDeleteById(sourceId, actorId, session);
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    await invalidateTreeCache();
    await logCategoryActivity('merge', target._id, target.name, actorId, {
      mergedFrom: source._id,
      mergedFromName: source.name,
      movedProducts: movedProductCount,
      movedChildren: childrenToReparent.length,
    });

    const mergedTarget = await categoryRepository.findByIdWithParentChain(targetId);
    return serializeCategory(mergedTarget);
  },

  // Simple, honest analytics: raw view/click counters and the CTR derived
  // from them (see category.model.js for what counts as a view vs. a
  // click). Not a full events pipeline with day-by-day trends - that would
  // be its own module, not a category feature.
  async getAnalytics(query) {
    const { page, limit, sortBy } = query;
    const { items, total } = await categoryRepository.findForAnalytics({ page, limit, sortBy });

    const rows = items.map((category) => ({
      id: category._id,
      name: category.name,
      slug: category.slug,
      productCount: category.productCount,
      viewCount: category.viewCount,
      clickCount: category.clickCount,
      clickThroughRate: category.viewCount > 0 ? Number((category.clickCount / category.viewCount).toFixed(4)) : 0,
    }));

    return { items: rows, meta: buildPaginationMeta(page, limit, total) };
  },

  // --- Public storefront reads (published + visible only) -----------------

  async getPublicTree() {
    const cached = await readTreeCache(PUBLIC_TREE_CACHE_KEY);
    if (cached) return cached;

    const [categories, countsById] = await Promise.all([
      categoryRepository.findPublicTree(),
      categoryRepository.getSubtreeProductCounts(),
    ]);
    const tree = serializePublicCategoryTree(categories, countsById);

    await writeTreeCache(PUBLIC_TREE_CACHE_KEY, tree);
    return tree;
  },

  async getPublicCategoryBySlug(slug) {
    const category = await categoryRepository.findPublicBySlug(slug);
    if (!category) throw new ApiError(404, 'Category not found');

    const countsById = await categoryRepository.getSubtreeProductCounts();
    const result = serializePublicCategory(category, {
      recursiveProductCount: countsById.get(category._id.toString()),
    });

    // Fire-and-forget - a view that fails to record must never fail the page load.
    categoryRepository.incrementViewCount(category._id).catch((err) => {
      logger.warn({ err: err.message, categoryId: category._id }, 'Category view count increment failed');
    });

    return result;
  },

  async trackCategoryClick(id) {
    await categoryRepository.incrementClickCount(id);
  },

  async getFeaturedCategories(limit) {
    const categories = await categoryRepository.findFeatured(limit);
    return serializePublicCategoryList(categories);
  },

  async getHomepageCategories(limit) {
    const categories = await categoryRepository.findHomepage(limit);
    return serializePublicCategoryList(categories);
  },

  // Nested, not flat - a navbar-flagged category nests under its parent if
  // the parent is also navbar-flagged, otherwise it surfaces as a top-level
  // item. Matches how a mega-menu is actually structured.
  async getNavbarCategories() {
    const categories = await categoryRepository.findNavbar();
    return serializePublicCategoryTree(categories);
  },

  async getTrendingCategories(limit) {
    const categories = await categoryRepository.findTrending(limit);
    return serializePublicCategoryList(categories);
  },

  // The "All Categories" page.
  async listPublicCategories({ page, limit }) {
    const [{ items, total }, countsById] = await Promise.all([
      categoryRepository.findPublicPaginated({ page, limit }),
      categoryRepository.getSubtreeProductCounts(),
    ]);
    return { items: serializePublicCategoryList(items, countsById), meta: buildPaginationMeta(page, limit, total) };
  },
};
