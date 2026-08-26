import mongoose from 'mongoose';
import { HELP_ARTICLE_STATUS_VALUES, HELP_ARTICLE_STATUSES, HELP_CATEGORY_VALUES } from './help.constants.js';
import { slugify } from '../../utils/slugify.js';

// CMS-driven Help Center content (Phase 4) - replaces the client's old
// hardcoded FAQS array (FaqsPage.jsx) entirely. `category` is one of the
// fixed HELP_CATEGORIES (see help.constants.js header comment for why it's
// an enum, not a separate admin-CRUD collection).
const helpArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    category: { type: String, enum: HELP_CATEGORY_VALUES, required: true, index: true },
    content: { type: String, default: '' },
    summary: { type: String, trim: true, default: '' },
    tags: [{ type: String, trim: true }],
    relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    status: { type: String, enum: HELP_ARTICLE_STATUS_VALUES, default: HELP_ARTICLE_STATUSES.DRAFT, index: true },
    featured: { type: Boolean, default: false },
    displayOrder: { type: Number, default: 0 },
    seoTitle: { type: String, trim: true, default: '' },
    seoDescription: { type: String, trim: true, default: '' },
    // Real, incremented counters (Phase 4's "Article Analytics") - not a
    // derived report, since a per-view write is cheap and this is read far
    // more often than it's aggregated.
    viewCount: { type: Number, default: 0 },
    helpfulCount: { type: Number, default: 0 },
    notHelpfulCount: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

helpArticleSchema.index({ category: 1, status: 1, displayOrder: 1 });
helpArticleSchema.index({ title: 'text', summary: 'text', content: 'text', tags: 'text' });

helpArticleSchema.pre('validate', function generateSlug(next) {
  this.slug = slugify(this.slug || this.title);
  next();
});

export const HelpArticle = mongoose.model('HelpArticle', helpArticleSchema);
