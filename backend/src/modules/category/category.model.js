import mongoose from 'mongoose';
import { CATALOG_STATUSES } from '../../constants/catalog.js';
import { slugify } from '../../utils/slugify.js';

const seoSchema = new mongoose.Schema(
  {
    metaTitle: { type: String, trim: true, default: '' },
    metaDescription: { type: String, trim: true, default: '' },
    metaKeywords: { type: String, trim: true, default: '' },
    canonicalUrl: { type: String, trim: true, default: '' },
    ogImageMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    shortDescription: { type: String, trim: true, default: '' },

    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null, index: true },
    // Materialized path (root-first) - makes "all descendants of X" and circular-reference
    // checks O(1) queries instead of recursive tree walks. Kept in sync by the
    // pre-validate hook below and cascaded to descendants when a parent changes.
    ancestors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', index: true }],

    // Short code used as a prefix when auto-generating SKUs for products in
    // this category (e.g. "RG" for Rings -> RG-000123). Optional - products
    // without a prefixed category fall back to a generic prefix.
    skuPrefix: { type: String, trim: true, uppercase: true, default: '' },

    iconMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
    bannerMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
    thumbnailMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },

    status: {
      type: String,
      enum: Object.values(CATALOG_STATUSES),
      default: CATALOG_STATUSES.DRAFT,
      index: true,
    },
    isFeatured: { type: Boolean, default: false },
    showInNavbar: { type: Boolean, default: false },
    showOnHomepage: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },

    // Denormalized so listing/tree screens don't need a live aggregation
    // against Product on every request - kept in sync by productService
    // whenever a product's category assignment changes (see
    // categoryRepository.incrementProductCount).
    productCount: { type: Number, default: 0, min: 0 },

    // Simple, atomic counters for the storefront analytics view - a view is
    // recorded when a customer opens the category page, a click when they
    // tap into it from a listing (megamenu, homepage grid, search results).
    // CTR = clickCount / viewCount. Not a full event pipeline (no per-day
    // breakdown) - see categoryService.getAnalytics for the honest scope.
    viewCount: { type: Number, default: 0, min: 0 },
    clickCount: { type: Number, default: 0, min: 0 },

    seo: { type: seoSchema, default: () => ({}) },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

categorySchema.index({ isDeleted: 1, status: 1 });
categorySchema.index({ isDeleted: 1, parent: 1 });
// Covers every public storefront query (published + visible categories),
// sorted by whichever curated flag or trending metric the caller needs.
categorySchema.index({ isDeleted: 1, status: 1, isVisible: 1, viewCount: -1 });

categorySchema.pre('validate', async function syncSlugAndAncestors(next) {
  this.slug = slugify(this.slug || this.name);

  if (this.isNew || this.isModified('parent')) {
    if (this.parent) {
      const parentDoc = await mongoose.model('Category').findById(this.parent).select('ancestors');
      this.ancestors = parentDoc ? [...parentDoc.ancestors, parentDoc._id] : [];
    } else {
      this.ancestors = [];
    }
  }

  next();
});

export const Category = mongoose.model('Category', categorySchema);
