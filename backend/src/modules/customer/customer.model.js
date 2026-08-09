import mongoose from 'mongoose';
import { CUSTOMER_STATUSES, CUSTOMER_TYPES, LEAD_SOURCES, GENDERS } from './customer.constants.js';

// THE CRM entity - always read live, never snapshotted (see order.model.js's
// customerSnapshot for the one place a point-in-time copy is deliberately
// kept, and why). Deliberately separate from User (auth/login identity) -
// most customers (walk-in, POS, wholesale) never need a login at all; `user`
// is only set once/if a customer gets real storefront access.
const customerSchema = new mongoose.Schema(
  {
    customerCode: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: '' },
    displayName: { type: String, trim: true, default: '' },

    email: { type: String, trim: true, lowercase: true, default: null },
    phone: { type: String, trim: true, default: null },

    dateOfBirth: { type: Date, default: null },
    anniversary: { type: Date, default: null },
    gender: { type: String, enum: Object.values(GENDERS), default: GENDERS.UNSPECIFIED },
    avatarMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null },

    status: { type: String, enum: Object.values(CUSTOMER_STATUSES), default: CUSTOMER_STATUSES.LEAD, index: true },
    leadSource: { type: String, enum: Object.values(LEAD_SOURCES), default: LEAD_SOURCES.WALK_IN },
    customerType: { type: String, enum: Object.values(CUSTOMER_TYPES), default: CUSTOMER_TYPES.RETAIL },

    gstNumber: { type: String, trim: true, default: '' },
    companyName: { type: String, trim: true, default: '' },

    preferredLanguage: { type: String, trim: true, default: 'en' },
    preferredCurrency: { type: String, trim: true, default: 'INR' },
    // Reuses the existing multi-location Warehouse entity rather than
    // inventing a parallel "Store" concept - a customer's preferred
    // pickup/service location is the same place Inventory already tracks.
    preferredStore: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null },

    // Optional login link - nullable by design (see file header comment).
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    referralCode: { type: String, unique: true, sparse: true, trim: true, uppercase: true },
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },

    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CustomerTag' }],
    segments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CustomerSegment' }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Sparse - a walk-in customer may have only a phone, or only an email, or
// (rarely) neither yet. Sparse unique indexes only enforce uniqueness among
// documents where the field is actually present, satisfying "prevent
// duplicate email/phone" without blocking customers who have just one.
customerSchema.index({ email: 1 }, { unique: true, sparse: true });
customerSchema.index({ phone: 1 }, { unique: true, sparse: true });
customerSchema.index({ createdAt: -1 });

customerSchema.pre('validate', function computeDisplayName(next) {
  if (!this.displayName) {
    this.displayName = [this.firstName, this.lastName].filter(Boolean).join(' ').trim();
  }
  next();
});

export const Customer = mongoose.model('Customer', customerSchema);
