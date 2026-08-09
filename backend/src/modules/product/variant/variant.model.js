import mongoose from 'mongoose';
import { CATALOG_STATUSES } from '../../../constants/catalog.js';
import { slugify } from '../../../utils/slugify.js';
import { buildCombinationKey } from './variant.combination.js';

const variantAttributeSchema = new mongoose.Schema(
  {
    attribute: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute', required: true },
    value: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeValue', required: true },
  },
  { _id: false }
);

const variantSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    slug: { type: String, required: true, trim: true, lowercase: true },

    status: { type: String, enum: Object.values(CATALOG_STATUSES), default: CATALOG_STATUSES.DRAFT, index: true },
    isVisible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },

    priceOverride: { type: Number, min: 0, default: null },
    weightOverride: { type: Number, min: 0, default: null },

    isFeatured: { type: Boolean, default: false },
    isDefault: { type: Boolean, default: false },

    attributes: { type: [variantAttributeSchema], default: [] },
    // Derived from `attributes` - order-independent identity used to enforce
    // "no duplicate combinations" for a product. See variant.combination.js.
    combinationKey: { type: String, default: '', index: true },
  },
  { timestamps: true }
);

// One combination can only exist once per product (empty-attribute variants,
// e.g. bulk-duplicate placeholders awaiting reassignment, are exempt since
// their shared '' key would otherwise collide with each other).
variantSchema.index(
  { product: 1, combinationKey: 1 },
  { unique: true, partialFilterExpression: { combinationKey: { $ne: '' } } }
);

variantSchema.pre('validate', function syncSlugAndCombinationKey(next) {
  this.slug = slugify(this.slug || this.sku);
  this.combinationKey = buildCombinationKey(this.attributes);
  next();
});

export const Variant = mongoose.model('Variant', variantSchema);
