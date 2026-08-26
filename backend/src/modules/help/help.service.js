import { ApiError } from '../../utils/ApiError.js';
import { helpArticleRepository } from './helpArticle.repository.js';
import { helpSearchLogRepository } from './helpSearchLog.repository.js';
import { helpCategoryRepository } from './helpCategory.repository.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const helpService = {
  // Idempotent boot-time seed (server.js) - same discipline as
  // warehouseService.ensureDefaultWarehouse/accountSeed.ensureSystemAccounts.
  ensureCategoriesSeeded() {
    return helpCategoryRepository.ensureSeeded();
  },

  // ---- Admin CMS ----
  async listArticlesAdmin(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await helpArticleRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getArticleById(id) {
    const article = await helpArticleRepository.findById(id);
    if (!article) throw new ApiError(404, 'Help article not found');
    return article;
  },

  async createArticle(data, userId) {
    const existing = await helpArticleRepository.findBySlug(data.slug ?? data.title);
    if (existing) throw new ApiError(409, 'An article with this slug already exists');
    return helpArticleRepository.create({ ...data, createdBy: userId, updatedBy: userId });
  },

  async updateArticle(id, data, userId) {
    const article = await helpArticleRepository.updateById(id, { ...data, updatedBy: userId });
    if (!article) throw new ApiError(404, 'Help article not found');
    return article;
  },

  async deleteArticle(id) {
    const deleted = await helpArticleRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Help article not found');
  },

  // ---- Admin: Categories (Phase 4) ----
  // `code` is never admin-creatable (see helpCategory.model.js's header) -
  // this is a rename/reorder/hide surface over the fixed set, not a free
  // "add a category" CRUD.
  async listCategoriesAdmin() {
    return helpCategoryRepository.findAllOrdered();
  },

  async updateCategory(code, data, userId) {
    const category = await helpCategoryRepository.updateByCode(code, data, userId);
    if (!category) throw new ApiError(404, 'Help category not found');
    return category;
  },

  // ---- Public Help Center ----
  // Real published-article counts per category (never hardcoded), joined
  // against the admin-editable category rows - a category with zero
  // published articles still appears (so the Help Center's category grid
  // stays complete), just shows 0. Hidden (`active: false`) categories are
  // filtered out of this public read only - the admin list above always
  // shows all of them so they can be turned back on.
  async listCategories() {
    const [categories, counts] = await Promise.all([helpCategoryRepository.findAllOrdered(), helpArticleRepository.countPublishedByCategory()]);
    return categories
      .filter((c) => c.active)
      .map((c) => ({ value: c.code, label: c.label, description: c.description, icon: c.icon, articleCount: counts.get(c.code) ?? 0 }));
  },

  async listPublishedArticles(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await helpArticleRepository.findPublished({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  getFeaturedArticles(limit) {
    return helpArticleRepository.findFeaturedPublished(limit);
  },

  // Same query path as listPublishedArticles's search branch - "search" is
  // just a published-articles read filtered by $text, not a separate
  // subsystem (Phase 49 wants this as its own endpoint for a dedicated
  // search-bar UI, but the underlying logic is identical).
  async search(query, userId) {
    const { page, limit, ...filters } = query;
    const { items, total } = await helpArticleRepository.findPublished({ page, limit, ...filters });

    // Phase 4's Search Analytics - best-effort, never blocks the actual
    // search response (same non-fatal-logging discipline as
    // activityLogService.record). Only logged for a real, non-empty typed
    // query - a bare category-browse (no `search` term) isn't "a search".
    if (filters.search?.trim()) {
      helpSearchLogRepository.create({ query: filters.search.trim(), resultCount: total, userId: userId ?? null }).catch(() => {});
    }

    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  // ---- Admin: Search Analytics ----
  async getSearchAnalytics() {
    const [summary, topQueries, noResultQueries] = await Promise.all([
      helpSearchLogRepository.getSummary(),
      helpSearchLogRepository.getTopQueries({ limit: 20 }),
      helpSearchLogRepository.getTopQueries({ limit: 20, noResultsOnly: true }),
    ]);
    return { ...summary, topQueries, noResultQueries };
  },

  async getPublishedArticleBySlug(slug) {
    const article = await helpArticleRepository.findBySlug(slug);
    if (!article || article.status !== 'published') throw new ApiError(404, 'Help article not found');
    // Best-effort, never blocks the read if it fails - same discipline as
    // activityLogService.record.
    helpArticleRepository.incrementView(article._id).catch(() => {});
    return article;
  },

  async voteHelpful(slug, helpful) {
    const article = await helpArticleRepository.findBySlug(slug);
    if (!article || article.status !== 'published') throw new ApiError(404, 'Help article not found');
    const updated = await helpArticleRepository.incrementHelpfulVote(article._id, helpful);
    return { helpfulCount: updated.helpfulCount, notHelpfulCount: updated.notHelpfulCount };
  },
};
