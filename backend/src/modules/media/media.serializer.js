// createdBy/updatedBy are plain unpopulated ObjectIds on most fetches (list,
// gallery) and populated {_id, name, email} docs only on the single-item
// details fetch (media.repository.js#findByIdWithCreator) - handle both.
const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, email: ref.email };
  return ref.toString();
};

export const serializeMedia = (media) => {
  const plain = typeof media.toObject === 'function' ? media.toObject() : media;

  return {
    id: plain._id,
    uuid: plain.uuid,
    entityType: plain.entityType,
    entityId: plain.entityId?.toString?.() ?? plain.entityId,
    variantId: plain.variantId?.toString?.() ?? plain.variantId,
    type: plain.type,
    cloudinary: {
      publicId: plain.cloudinary.publicId,
      secureUrl: plain.cloudinary.secureUrl,
      thumbnailUrl: plain.cloudinary.thumbnailUrl,
      resourceType: plain.cloudinary.resourceType,
      format: plain.cloudinary.format,
      bytes: plain.cloudinary.bytes,
      width: plain.cloudinary.width,
      height: plain.cloudinary.height,
      duration: plain.cloudinary.duration,
      version: plain.cloudinary.version,
      folder: plain.cloudinary.folder,
      filename: plain.cloudinary.filename,
      originalFilename: plain.cloudinary.originalFilename,
    },
    isFeatured: plain.isFeatured,
    isFeaturedVideo: plain.isFeaturedVideo,
    sortOrder: plain.sortOrder,
    altText: plain.altText,
    caption: plain.caption,
    visibility: plain.visibility,
    status: plain.status,
    createdBy: serializeUserRef(plain.createdBy),
    updatedBy: serializeUserRef(plain.updatedBy),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeMediaList = (mediaItems) => mediaItems.map(serializeMedia);

export const serializeUsageEntry = (entry) => ({
  module: entry.module,
  entityId: entry.entityId,
  entityName: entry.entityName,
  createdAt: entry.createdAt,
});

// Shared shape for every other module's populated *Media reference field
// (Settings.logoMedia, Brand.logoMedia, Category.bannerMedia, etc.) - defined
// once here so no module re-derives this shape from a raw Media document.
export const serializeMediaRef = (media) => {
  if (!media) return null;
  const plain = typeof media.toObject === 'function' ? media.toObject() : media;

  return {
    _id: plain._id,
    secureUrl: plain.cloudinary.secureUrl,
    thumbnailUrl: plain.cloudinary.thumbnailUrl,
    width: plain.cloudinary.width,
    height: plain.cloudinary.height,
    format: plain.cloudinary.format,
    resourceType: plain.cloudinary.resourceType,
    bytes: plain.cloudinary.bytes,
    altText: plain.altText,
    caption: plain.caption,
  };
};
