import mongoose from 'mongoose';
import { CATALOG_STATUSES, GENDERS, OCCASIONS } from '../../constants/catalog.js';
import { slugify } from '../../utils/slugify.js';
import { pricingSchema } from './pricing/pricing.schema.js';

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

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    shortDescription: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },

    status: { type: String, enum: Object.values(CATALOG_STATUSES), default: CATALOG_STATUSES.DRAFT, index: true },
    isFeatured: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },

    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true, index: true },
    brand: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand', default: null, index: true },
    // Named collectionId (not "collection") because "collection" is a reserved
    // Mongoose document property (the underlying MongoDB collection handle).
    collectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', default: null, index: true },
    // Only meaningful when the owning collection's merchandising sortMode is
    // 'manual' (Collection Engine v2.0) - mirrors the existing `order` field
    // precedent already on Product/Category/Collection. Set via the admin
    // Merchandising tab's drag-and-drop reorder, never hand-edited.
    collectionSortOrder: { type: Number, default: 0 },
    attributeGroups: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AttributeGroup' }],

    tags: [{ type: String, trim: true }],
    searchKeywords: [{ type: String, trim: true }],

    // Storefront merchandising facets (mega menu, category filters) - see
    // constants/catalog.js. `gender` is single-select (a product fits one
    // audience), `occasion` is multi-select (a product can suit several).
    gender: { type: String, enum: Object.values(GENDERS), default: null, index: true },
    occasion: [{ type: String, enum: Object.values(OCCASIONS) }],

    seo: { type: seoSchema, default: () => ({}) },
    pricing: { type: pricingSchema, default: () => ({}) },
  },
  { timestamps: true }
);

// Storefront search (GET /products/public?search=) runs on this - a real
// Mongo text index (stemming + relevance scoring via $meta: 'textScore'),
// not a leading-wildcard regex scan like the admin list's simpler
// name/sku match (product.repository.js#findPaginated). Weighted so a hit
// in the product's own name outranks a hit buried in tags/keywords.
productSchema.index(
  { name: 'text', shortDescription: 'text', tags: 'text', searchKeywords: 'text' },
  { weights: { name: 10, tags: 5, searchKeywords: 5, shortDescription: 2 }, name: 'ProductTextIndex' }
);

productSchema.pre('validate', function generateSlug(next) {
  this.slug = slugify(this.slug || this.name);
  next();
});

// SKU is immutable after creation - the only way past this is
// product.service.js#overrideSku explicitly setting doc.$locals.allowSkuChange
// before calling save(), and that path is routed through a super-admin-only
// endpoint (PATCH /products/:id/sku). $locals is Mongoose's built-in
// non-persisted scratch space, so this flag never touches the database.
productSchema.pre('save', function guardSkuImmutability(next) {
  if (!this.isNew && this.isModified('sku') && !this.$locals.allowSkuChange) {
    const err = new Error('SKU cannot be changed after creation');
    err.statusCode = 400;
    return next(err);
  }
  next();
});

export const Product = mongoose.model('Product', productSchema);
