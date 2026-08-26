import mongoose from 'mongoose';
import { CATALOG_STATUSES, BRAND_SHOWCASE_ICONS } from '../../constants/catalog.js';
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

// Each of these three arrays backs one repeatable card grid on the brand
// showcase page (client/src/pages/BrandShowcasePage.jsx) - `icon` is a
// fixed lookup key (BRAND_SHOWCASE_ICONS), never a free-text/SVG string,
// so a typo in the admin form degrades to "no icon" instead of broken markup.
const brandEditionSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: true },
    localName: { type: String, trim: true, default: '' },
    tagline: { type: String, trim: true, default: '' },
    // A real Category slug (product.repository.js already resolves this
    // the same way category pages do) - clicking this chip filters the
    // showcase's own product grid, never a fabricated/text-matched tag.
    categorySlug: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

const brandCraftPillarSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, enum: [...BRAND_SHOWCASE_ICONS, ''], default: '' },
  },
  { _id: false }
);

const brandTrustBenefitSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    description: { type: String, trim: true, default: '' },
    icon: { type: String, enum: [...BRAND_SHOWCASE_ICONS, ''], default: '' },
  },
  { _id: false }
);

// Entirely optional, additive to a plain catalog Brand - only a flagship
// brand meant to render as its own landing page (not just a filtered
// product grid, see BrandDetailPage.jsx for that simpler default) fills
// this in. An empty showcase renders nothing extra - see
// BrandShowcasePage.jsx's own "showcase.craftPillars.length > 0" guards.
const brandShowcaseSchema = new mongoose.Schema(
  {
    heroTagline: { type: String, trim: true, default: '' },
    // The brand's name in its own script (e.g. "मुद्रिका" for Mudrika) -
    // cultural/etymological context, not translated marketing copy.
    heroLocalName: { type: String, trim: true, default: '' },
    heroImageMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    storyTitle: { type: String, trim: true, default: '' },
    storyBody: { type: String, trim: true, default: '' },
    storyImageMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },
    editions: { type: [brandEditionSchema], default: [] },
    craftPillars: { type: [brandCraftPillarSchema], default: [] },
    trustBenefits: { type: [brandTrustBenefitSchema], default: [] },
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
    showcase: { type: brandShowcaseSchema, default: () => ({}) },
  },
  { timestamps: true }
);

brandSchema.pre('validate', function generateSlug(next) {
  this.slug = slugify(this.slug || this.name);
  next();
});

export const Brand = mongoose.model('Brand', brandSchema);
