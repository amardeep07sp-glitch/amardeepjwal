import mongoose from 'mongoose';
import { ACTIVE_STATUSES } from '../../constants/catalog.js';
import { ATTRIBUTE_TYPES } from '../../constants/attribute.js';
import { slugify } from '../../utils/slugify.js';

const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'AttributeGroup', required: true, index: true },
    type: { type: String, enum: Object.values(ATTRIBUTE_TYPES), required: true },
    isRequired: { type: Boolean, default: false },
    isFilterable: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(ACTIVE_STATUSES), default: ACTIVE_STATUSES.ACTIVE, index: true },
  },
  { timestamps: true }
);

attributeSchema.pre('validate', function generateSlug(next) {
  this.slug = slugify(this.slug || this.name);
  next();
});

export const Attribute = mongoose.model('Attribute', attributeSchema);
