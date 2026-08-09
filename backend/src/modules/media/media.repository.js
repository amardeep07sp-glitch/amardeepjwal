import { Media } from './media.model.js';
import { MEDIA_STATUSES, MEDIA_TYPES, MEDIA_VISIBILITY } from './media.constants.js';

const buildScopeFilter = (entityType, entityId, variantId) => {
  const filter = { entityType, entityId };
  if (variantId !== undefined) filter.variantId = variantId || null;
  return filter;
};

export const mediaRepository = {
  async findPaginatedByEntity(entityType, entityId, { variantId, type, status, page, limit, sortBy, sortOrder }) {
    const filter = buildScopeFilter(entityType, entityId, variantId);
    if (type) filter.type = type;
    if (status) filter.status = status;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Media.find(filter).sort(sort).skip(skip).limit(limit),
      Media.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return Media.findById(id);
  },

  // Only used by the single-item details view (GET /media/:id) - list/gallery
  // fetches deliberately stay unpopulated for performance.
  findByIdWithCreator(id) {
    return Media.findById(id).populate('createdBy', 'name email').populate('updatedBy', 'name email');
  },

  create(data) {
    return Media.create(data);
  },

  async updateById(id, data) {
    const existing = await Media.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return Media.findByIdAndDelete(id);
  },

  deleteByIds(ids) {
    return Media.deleteMany({ _id: { $in: ids } });
  },

  updateManyStatus(ids, status) {
    return Media.updateMany({ _id: { $in: ids } }, { $set: { status } });
  },

  unsetFeaturedForScope(entityType, entityId, variantId, exceptId) {
    return Media.updateMany(
      { ...buildScopeFilter(entityType, entityId, variantId), _id: { $ne: exceptId } },
      { $set: { isFeatured: false } }
    );
  },

  unsetFeaturedVideoForScope(entityType, entityId, variantId, exceptId) {
    return Media.updateMany(
      { ...buildScopeFilter(entityType, entityId, variantId), _id: { $ne: exceptId } },
      { $set: { isFeaturedVideo: false } }
    );
  },

  countByEntity(entityType, entityId) {
    return Media.countDocuments({ entityType, entityId });
  },

  // Cross-entity browse for the MediaPicker's "Media Library" / "Recently
  // Uploaded" views - deliberately NOT scoped to one entityId, unlike
  // findPaginatedByEntity above, which powers the per-entity gallery tab.
  async findLibrary({ entityType, type, status, isFeatured, isFeaturedVideo, search, sortBy, page, limit }) {
    const filter = buildLibraryFilter({ entityType, type, status, isFeatured, isFeaturedVideo, search });
    const sort = sortBy === 'updatedAt' ? { updatedAt: -1 } : { createdAt: -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Media.find(filter).sort(sort).skip(skip).limit(limit),
      Media.countDocuments(filter),
    ]);

    return { items, total };
  },

  // Unpaginated candidate set for the Used/Unused filter and the health
  // report, which both need to evaluate usage across more than one page
  // before they can paginate/report - capped so a huge library can't turn
  // this into an unbounded query.
  findLibraryCandidates({ entityType, type, status, isFeatured, isFeaturedVideo, search }, cap = 1000) {
    const filter = buildLibraryFilter({ entityType, type, status, isFeatured, isFeaturedVideo, search });
    return Media.find(filter).sort({ createdAt: -1 }).limit(cap);
  },

  findAllForHealthCheck(cap = 1000) {
    return Media.find({}).sort({ createdAt: -1 }).limit(cap);
  },

  // One image per entity - the uploader's chosen cover (isFeatured) wins,
  // otherwise whichever sorts first. Storefront list views (product cards,
  // category cards) only ever show a single cover image, never the gallery.
  findPrimaryByEntityIds(entityType, entityIds) {
    return Media.aggregate([
      {
        $match: {
          entityType,
          entityId: { $in: entityIds },
          type: MEDIA_TYPES.IMAGE,
          status: MEDIA_STATUSES.ACTIVE,
          visibility: MEDIA_VISIBILITY.PUBLIC,
        },
      },
      { $sort: { isFeatured: -1, sortOrder: 1 } },
      { $group: { _id: '$entityId', doc: { $first: '$$ROOT' } } },
    ]);
  },

  // The full public gallery for ONE entity, cover-first - unlike
  // findPrimaryByEntityIds (one image per entity, for list/grid views),
  // this is what a product detail page's image gallery renders.
  findPublicGalleryByEntity(entityType, entityId) {
    return Media.find({
      entityType,
      entityId,
      type: MEDIA_TYPES.IMAGE,
      status: MEDIA_STATUSES.ACTIVE,
      visibility: MEDIA_VISIBILITY.PUBLIC,
    }).sort({ isFeatured: -1, sortOrder: 1 });
  },
};

function buildLibraryFilter({ entityType, type, status, isFeatured, isFeaturedVideo, search }) {
  const filter = {};
  if (entityType) filter.entityType = entityType;
  if (type) filter.type = type;
  if (status) filter.status = status;
  if (isFeatured !== undefined) filter.isFeatured = isFeatured;
  if (isFeaturedVideo !== undefined) filter.isFeaturedVideo = isFeaturedVideo;
  if (search) {
    filter.$or = [
      { altText: { $regex: search, $options: 'i' } },
      { 'cloudinary.originalFilename': { $regex: search, $options: 'i' } },
    ];
  }
  return filter;
}
