import mongoose from 'mongoose';
import { CATALOG_STATUSES } from '../../constants/catalog.js';
import { slugify } from '../../utils/slugify.js';
import {
  COLLECTION_TYPES,
  ASSIGNMENT_TYPES,
  RULE_FIELDS,
  RULE_OPERATORS,
  RULE_MATCH_MODES,
  MERCHANDISING_SORT_MODES,
  VISIBILITY_LEVELS,
} from './collection.constants.js';

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

// One Rule Builder condition, e.g. {field:'price', operator:'between',
// value:{min,max}} or {field:'category', operator:'in', value:[ids]}. `value`
// is intentionally Mixed - its real shape varies per field (a range object
// for price, an array for category/brand/tags/status, a boolean for
// featured, a stock-status string for stock) and is validated per-field at
// the zod layer (collection.validation.js), not here - the same division of
// labor already used throughout this codebase (Mongoose = storage-level
// type/enum integrity, zod = request-shape correctness).
const ruleConditionSchema = new mongoose.Schema(
  {
    field: { type: String, enum: Object.values(RULE_FIELDS), required: true },
    operator: { type: String, enum: Object.values(RULE_OPERATORS), required: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const ruleGroupSchema = new mongoose.Schema(
  {
    matchMode: { type: String, enum: Object.values(RULE_MATCH_MODES), default: RULE_MATCH_MODES.ALL },
    conditions: { type: [ruleConditionSchema], default: [] },
  },
  { _id: false }
);

const faqSchema = new mongoose.Schema(
  {
    question: { type: String, trim: true, required: true },
    answer: { type: String, trim: true, required: true },
  },
  { _id: false }
);

const collectionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    skuPrefix: { type: String, trim: true, uppercase: true, default: '' },
    bannerMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
    thumbnailMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
    status: { type: String, enum: Object.values(CATALOG_STATUSES), default: CATALOG_STATUSES.DRAFT, index: true },
    isFeatured: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    seo: { type: seoSchema, default: () => ({}) },

    // --- Type ------------------------------------------------------------
    type: { type: String, enum: Object.values(COLLECTION_TYPES), default: COLLECTION_TYPES.MANUAL, index: true },

    // --- Product assignment ------------------------------------------------
    // MANUAL keeps using Product's existing single collectionId ref exactly
    // as before this phase. RULE_BASED stores no product references at all -
    // membership is always resolved live from `rules` (see
    // collection.rules.js#buildRuleFilter + collectionService.resolveCollectionProducts).
    assignmentType: { type: String, enum: Object.values(ASSIGNMENT_TYPES), default: ASSIGNMENT_TYPES.MANUAL },
    rules: { type: ruleGroupSchema, default: () => ({ matchMode: RULE_MATCH_MODES.ALL, conditions: [] }) },

    // --- Scheduling ----------------------------------------------------------
    // Enforced two ways: a read-time date-window filter on every public
    // read (correct even before a cron tick, mirrors banner.service.js's
    // getPublicBanners), plus collection.jobs.js's cron physically flipping
    // `status` so the admin list view (raw stored status) stays honest too.
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    autoPublish: { type: Boolean, default: false },
    autoArchive: { type: Boolean, default: false },

    // --- Merchandising -----------------------------------------------------
    sortMode: { type: String, enum: Object.values(MERCHANDISING_SORT_MODES), default: MERCHANDISING_SORT_MODES.MANUAL },

    // --- Visibility --------------------------------------------------------
    // Fail-closed: members/vip are schema+admin ready but never actually
    // served by any public route until a real customer-auth/membership
    // phase exists - see collection.constants.js#PUBLIC_VISIBLE_LEVELS.
    visibility: { type: String, enum: Object.values(VISIBILITY_LEVELS), default: VISIBILITY_LEVELS.PUBLIC, index: true },

    // --- Media (reuses Media Engine - never a raw URL) ------------------------
    mobileBannerMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
    promoVideoMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },

    // --- Landing page content ---------------------------------------------
    // `description` above doubles as "Long Description" (relabeled in the
    // admin UI only - no separate field needed).
    shortDescription: { type: String, trim: true, default: '' },
    faqs: { type: [faqSchema], default: [] },

    // --- Relationships -----------------------------------------------------
    relatedCollections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    // A "campaign" is modeled as a parent Collection, not a separate entity -
    // the simplest schema that satisfies "extend, don't rewrite".
    parentCampaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Collection', default: null, index: true },

    // --- Analytics counters (Category's cheap-counter precedent) -------------
    // Simple atomic counters, incremented fire-and-forget from the public
    // read path - the deeper CIP layer (collection_view events,
    // cip/collectionAnalytics.service.js) is the richer analog, same split
    // Category already has between itself and categoryAnalytics.service.js.
    viewCount: { type: Number, default: 0, min: 0 },
    clickCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Serves both collection.jobs.js's scheduling sweep and the public read's
// visibility+schedule-window filter in one shot.
collectionSchema.index({ status: 1, visibility: 1, startDate: 1, endDate: 1 });

collectionSchema.pre('validate', function generateSlug(next) {
  this.slug = slugify(this.slug || this.name);
  next();
});

export const Collection = mongoose.model('Collection', collectionSchema);
