import mongoose from 'mongoose';
import { ACTIVE_STATUSES } from '../../constants/catalog.js';
import { slugify } from '../../utils/slugify.js';

const attributeGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    description: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(ACTIVE_STATUSES), default: ACTIVE_STATUSES.ACTIVE, index: true },
  },
  { timestamps: true }
);

attributeGroupSchema.pre('validate', function generateSlug(next) {
  this.slug = slugify(this.slug || this.name);
  next();
});

export const AttributeGroup = mongoose.model('AttributeGroup', attributeGroupSchema);
