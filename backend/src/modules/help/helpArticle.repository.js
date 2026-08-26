import { HelpArticle } from './helpArticle.model.js';
import { HELP_ARTICLE_STATUSES } from './help.constants.js';

const buildAdminFilter = ({ search, category, status, featured }) => {
  const filter = {};
  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (status) filter.status = status;
  if (featured != null) filter.featured = featured;
  return filter;
};

export const helpArticleRepository = {
  async findPaginated({ page, limit, search, category, status, featured }) {
    const filter = buildAdminFilter({ search, category, status, featured });
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      HelpArticle.find(filter).sort({ displayOrder: 1, createdAt: -1 }).skip(skip).limit(limit),
      HelpArticle.countDocuments(filter),
    ]);
    return { items, total };
  },

  findById(id) {
    return HelpArticle.findById(id);
  },

  findBySlug(slug) {
    return HelpArticle.findOne({ slug });
  },

  create(data) {
    return HelpArticle.create(data);
  },

  async updateById(id, data) {
    const existing = await HelpArticle.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return HelpArticle.findByIdAndDelete(id);
  },

  // Public surface - published only, ranked featured-first then by the
  // admin's own manual displayOrder. Text search (when provided) ranks by
  // MongoDB's own textScore rather than displayOrder, since a search
  // result's relevance matters more than the admin's browse ordering.
  async findPublished({ category, tag, search, page, limit }) {
    const filter = { status: HELP_ARTICLE_STATUSES.PUBLISHED };
    if (category) filter.category = category;
    if (tag) filter.tags = tag;

    if (search) {
      filter.$text = { $search: search };
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        HelpArticle.find(filter, { score: { $meta: 'textScore' } })
          .sort({ score: { $meta: 'textScore' } })
          .skip(skip)
          .limit(limit),
        HelpArticle.countDocuments(filter),
      ]);
      return { items, total };
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      HelpArticle.find(filter).sort({ featured: -1, displayOrder: 1, createdAt: -1 }).skip(skip).limit(limit),
      HelpArticle.countDocuments(filter),
    ]);
    return { items, total };
  },

  findFeaturedPublished(limit = 6) {
    return HelpArticle.find({ status: HELP_ARTICLE_STATUSES.PUBLISHED, featured: true })
      .sort({ displayOrder: 1 })
      .limit(limit);
  },

  // Real published-article counts per category, for the Help Center's own
  // category tiles - never a hardcoded/guessed count.
  async countPublishedByCategory() {
    const rows = await HelpArticle.aggregate([
      { $match: { status: HELP_ARTICLE_STATUSES.PUBLISHED } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);
    return new Map(rows.map((r) => [r._id, r.count]));
  },

  incrementView(id) {
    return HelpArticle.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
  },

  incrementHelpfulVote(id, helpful) {
    return HelpArticle.findByIdAndUpdate(id, { $inc: helpful ? { helpfulCount: 1 } : { notHelpfulCount: 1 } }, { new: true });
  },
};
