import mongoose from 'mongoose';
import { HOMEPAGE_SECTION_TYPES } from '../../constants/cms.js';

const homepageSectionSchema = new mongoose.Schema(
  {
    internalTitle: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(HOMEPAGE_SECTION_TYPES), required: true },
    banner: { type: mongoose.Schema.Types.ObjectId, ref: 'Banner', default: null },
    heading: { type: String, trim: true, default: '' },
    body: { type: String, trim: true, default: '' },
    primaryMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const HomepageSection = mongoose.model('HomepageSection', homepageSectionSchema);
