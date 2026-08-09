import mongoose from 'mongoose';
import { MEDIA_ENTITY_TYPES, MEDIA_TYPES, MEDIA_VISIBILITY, MEDIA_STATUSES } from './media.constants.js';

const cloudinarySchema = new mongoose.Schema(
  {
    publicId: { type: String, required: true },
    secureUrl: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    resourceType: { type: String, required: true },
    format: { type: String, default: '' },
    bytes: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    duration: { type: Number, default: null },
    version: { type: Number, default: null },
    folder: { type: String, required: true },
    filename: { type: String, default: '' },
    originalFilename: { type: String, default: '' },
  },
  { _id: false }
);

// THE single media collection for the entire platform. Every uploadable
// asset - product images, brand logos, category images, CMS banners, review
// photos, future documents/360s/videos - lives here, distinguished only by
// entityType/entityId. Do not create a parallel {entity}-media collection;
// extend this schema instead (see media.constants.js for how entity types
// and media types are enumerated).
const mediaSchema = new mongoose.Schema(
  {
    uuid: { type: String, required: true, unique: true },

    entityType: { type: String, enum: Object.values(MEDIA_ENTITY_TYPES), required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    // Optional, future-ready: ties a media item to one specific variant of
    // the product it belongs to (entityType='product' + entityId=productId).
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null },

    type: { type: String, enum: Object.values(MEDIA_TYPES), required: true },
    cloudinary: { type: cloudinarySchema, required: true },

    isFeatured: { type: Boolean, default: false },
    // Independent of isFeatured (which is images-only) - lets a product-style
    // gallery have one cover image AND one cover video at the same time.
    isFeaturedVideo: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    altText: { type: String, default: '' },
    caption: { type: String, default: '' },

    visibility: { type: String, enum: Object.values(MEDIA_VISIBILITY), default: MEDIA_VISIBILITY.PUBLIC },
    status: { type: String, enum: Object.values(MEDIA_STATUSES), default: MEDIA_STATUSES.ACTIVE },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Primary access pattern: "all media for this entity (optionally this
// variant of it)", ordered for gallery display.
mediaSchema.index({ entityType: 1, entityId: 1, variantId: 1, sortOrder: 1 });

export const Media = mongoose.model('Media', mediaSchema);
