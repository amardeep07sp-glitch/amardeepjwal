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

const brandSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    skuPrefix: { type: String, trim: true, uppercase: true, default: '' },
    logoMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
    bannerMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
    country: { type: String, trim: true, default: '' },
    website: { type: String, trim: true, default: '' },
    status: { type: String, enum: Object.values(CATALOG_STATUSES), default: CATALOG_STATUSES.DRAFT, index: true },
    isFeatured: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    seo: { type: seoSchema, default: () => ({}) },
  },
  { timestamps: true }
);

brandSchema.pre('validate', function generateSlug(next) {
  this.slug = slugify(this.slug || this.name);
  next();
});

export const Brand = mongoose.model('Brand', brandSchema);
