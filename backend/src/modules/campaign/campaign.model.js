import mongoose from 'mongoose';
import { CAMPAIGN_TYPE_VALUES, CAMPAIGN_STATUS_VALUES, CAMPAIGN_STATUSES, CAMPAIGN_TYPES } from './campaign.constants.js';
import { slugify } from '../../utils/slugify.js';

// Represents the business/marketing objective a coupon serves - "Diwali
// Jewellery Sale" - separate from Coupon itself so multiple coupon codes
// can share one campaign's budget/dates/reporting (e.g. DIWALI25 for
// everyone + a private DIWALI-VIP code, both spending the same budget).
const campaignSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    campaignType: { type: String, enum: CAMPAIGN_TYPE_VALUES, default: CAMPAIGN_TYPES.CUSTOM },

    // Manual control states only (DRAFT/PAUSED/CANCELLED/ARCHIVED) - the
    // runtime states (SCHEDULED/ACTIVE/EXPIRED/EXHAUSTED) are always
    // computed from startAt/endAt/budget at evaluation time, never stored
    // as truth (see campaign.service.js#computeEffectiveStatus) - a
    // campaign whose end date has passed must show as EXPIRED even if
    // nobody remembered to update this field.
    status: { type: String, enum: CAMPAIGN_STATUS_VALUES, default: CAMPAIGN_STATUSES.DRAFT, index: true },

    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    priority: { type: Number, default: 0 },

    // Real spend tracking - 0/null means "unlimited", matches the
    // Coupon-level usageLimit's own null-means-unlimited convention.
    budget: { type: Number, min: 0, default: null },
    spentBudget: { type: Number, min: 0, default: 0 },

    tags: [{ type: String, trim: true }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

campaignSchema.index({ status: 1, startAt: 1, endAt: 1 });

campaignSchema.pre('validate', function generateSlug(next) {
  this.slug = slugify(this.slug || this.name);
  next();
});

export const Campaign = mongoose.model('Campaign', campaignSchema);
