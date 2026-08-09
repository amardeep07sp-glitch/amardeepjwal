import mongoose from 'mongoose';
import { PAGE_STATUSES } from '../../constants/cms.js';
import { slugify } from '../../utils/slugify.js';

const pageSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    content: { type: String, default: '' },
    status: { type: String, enum: Object.values(PAGE_STATUSES), default: PAGE_STATUSES.DRAFT },
    heroMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
    metaTitle: { type: String, trim: true, default: '' },
    metaDescription: { type: String, trim: true, default: '' },
    ogImageMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
  },
  { timestamps: true }
);

pageSchema.pre('validate', function generateSlug(next) {
  this.slug = slugify(this.slug || this.title);
  next();
});

export const Page = mongoose.model('Page', pageSchema);
