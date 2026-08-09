import mongoose from 'mongoose';
import { BANNER_POSITIONS } from '../../constants/cms.js';

const bannerSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    // Storefront hero copy - all optional so a simple promo tile (just an
    // image + link) doesn't need to fill these in.
    subtitle: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    ctaLabel: { type: String, trim: true, default: '' },
    // Optional at the schema level - a banner is created first, then a Media
    // record is attached to it (Media rows are scoped to an existing
    // entityId, so the reference can't exist before this document does).
    // The "must have an image to go live" rule is enforced in the service
    // layer instead (see assertReadyToActivate in banner.service.js).
    primaryMedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', default: null, index: true },
    linkUrl: { type: String, trim: true, default: '' },
    altText: { type: String, trim: true, default: '' },
    position: { type: String, enum: Object.values(BANNER_POSITIONS), default: BANNER_POSITIONS.HOMEPAGE_HERO },
    order: { type: Number, default: 0 },
    // Defaults to false (not true) precisely because a fresh banner has no
    // image yet - it must be deliberately activated once primaryMedia is set.
    isActive: { type: Boolean, default: false },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Banner = mongoose.model('Banner', bannerSchema);
