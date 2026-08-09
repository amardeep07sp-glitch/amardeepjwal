import { v4 as uuidv4 } from 'uuid';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { ROLES } from '../../constants/roles.js';
import { mediaRepository } from './media.repository.js';
import {
  uploadBufferToCloudinary,
  destroyCloudinaryAsset,
  checkAssetExists,
  buildThumbnailUrl,
} from './media.cloudinary.js';
import { resolveMediaFolder } from './media.folder.js';
import { serializeMedia, serializeMediaList, serializeUsageEntry } from './media.serializer.js';
import {
  findUsageForMedia,
  summarizeUsage,
  buildUsageConflictMessage,
  findUsedMediaIdSet,
  findMediaIdsWithExistingHome,
  isHomeTrackedEntityType,
} from './media.usage.js';
import {
  MEDIA_TYPES,
  MEDIA_STATUSES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  ALLOWED_DOCUMENT_MIME_TYPES,
} from './media.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// application/pdf is the only mimetype unique to ALLOWED_DOCUMENT_MIME_TYPES
// (it also includes the image mimetypes, since a document can just as
// easily be a phone photo of a paper - those correctly resolve as IMAGE
// above and behave like any other image upload).
const resolveTypeFromMimetype = (mimetype) => {
  if (ALLOWED_IMAGE_MIME_TYPES.includes(mimetype)) return MEDIA_TYPES.IMAGE;
  if (ALLOWED_VIDEO_MIME_TYPES.includes(mimetype)) return MEDIA_TYPES.VIDEO;
  if (ALLOWED_DOCUMENT_MIME_TYPES.includes(mimetype)) return MEDIA_TYPES.DOCUMENT;
  throw new ApiError(400, `Unsupported file type: ${mimetype}`);
};

// Documents reuse the image size limit (KYC/GST PDFs are typically small) -
// the fallback branch already covers DOCUMENT correctly without a new case.
const assertWithinSizeLimit = (type, bytes) => {
  const maxMb = type === MEDIA_TYPES.VIDEO ? env.MEDIA_MAX_VIDEO_SIZE_MB : env.MEDIA_MAX_IMAGE_SIZE_MB;
  if (bytes > maxMb * 1024 * 1024) {
    throw new ApiError(400, `File exceeds the maximum allowed size of ${maxMb}MB for ${type}s`);
  }
};

const assertFeaturedAllowed = (type, isFeatured) => {
  // Videos cannot become the featured (cover) IMAGE - that's what
  // isFeaturedVideo is for, independently, below.
  if (isFeatured && type !== MEDIA_TYPES.IMAGE) {
    throw new ApiError(400, 'Only images can be set as the featured media');
  }
};

const assertFeaturedVideoAllowed = (type, isFeaturedVideo) => {
  if (isFeaturedVideo && type !== MEDIA_TYPES.VIDEO) {
    throw new ApiError(400, 'Only videos can be set as the featured video');
  }
};

// Cloudinary's upload response does not reliably echo back a `folder` field
// (confirmed against the live API - it's absent from the response body), so
// the folder we resolved and uploaded into is passed in explicitly rather
// than trusted from uploadResult.
const buildCloudinarySnapshot = (uploadResult, originalFilename, folder) => ({
  publicId: uploadResult.public_id,
  secureUrl: uploadResult.secure_url,
  thumbnailUrl: buildThumbnailUrl(uploadResult.public_id, uploadResult.resource_type),
  resourceType: uploadResult.resource_type,
  format: uploadResult.format ?? '',
  bytes: uploadResult.bytes ?? 0,
  width: uploadResult.width ?? null,
  height: uploadResult.height ?? null,
  duration: uploadResult.duration ?? null,
  version: uploadResult.version ?? null,
  folder: folder ?? uploadResult.folder ?? '',
  filename: uploadResult.public_id?.split('/').pop() ?? '',
  originalFilename: originalFilename ?? '',
});

export const mediaService = {
  async browseLibrary(query) {
    const { page, limit, usage, ...filters } = query;

    // Used/Unused can't be expressed as a Mongo filter (it's derived from
    // other collections), so this path fetches a bounded candidate set,
    // resolves usage in bulk, then filters/paginates in memory. The plain
    // path below (no usage filter - the common case) stays a single
    // efficient paginated query, unchanged from before this enhancement.
    if (usage === 'used' || usage === 'unused') {
      const candidates = await mediaRepository.findLibraryCandidates(filters);
      const usedIds = await findUsedMediaIdSet(candidates);
      const filtered = candidates.filter((media) =>
        usage === 'used' ? usedIds.has(media._id.toString()) : !usedIds.has(media._id.toString())
      );
      const start = (page - 1) * limit;
      const pageItems = filtered.slice(start, start + limit);
      return {
        items: serializeMediaList(pageItems),
        meta: buildPaginationMeta(page, limit, filtered.length),
      };
    }

    const { items, total } = await mediaRepository.findLibrary({ page, limit, ...filters });
    return { items: serializeMediaList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  // Module 6 - on-demand diagnostic report, not a live dashboard. Fine at
  // current library size; would need a background job + cached results if
  // the library grows into the tens of thousands.
  async getHealthReport() {
    const mediaDocs = await mediaRepository.findAllForHealthCheck();

    const usedIds = await findUsedMediaIdSet(mediaDocs);
    const unused = mediaDocs.filter((media) => !usedIds.has(media._id.toString()));

    const brokenReferences = [];
    for (const media of mediaDocs) {
      // eslint-disable-next-line no-await-in-loop
      const assetExists = await checkAssetExists(media.cloudinary.publicId, media.cloudinary.resourceType);
      if (!assetExists) {
        brokenReferences.push({ id: media._id.toString(), publicId: media.cloudinary.publicId });
      }
    }

    // Orphan check only makes sense for open-gallery entities (Product/
    // Variant) - a Brand/Category/etc.'s entityType/entityId is just "where
    // it was uploaded from," not an ownership link, so it's excluded here
    // (its real correctness is the used/unused check above instead).
    const homeTrackedDocs = mediaDocs.filter((media) => isHomeTrackedEntityType(media.entityType));
    const withExistingHome = await findMediaIdsWithExistingHome(homeTrackedDocs);
    const orphanRecords = homeTrackedDocs
      .filter((media) => !withExistingHome.has(media._id.toString()))
      .map((media) => ({
        id: media._id.toString(),
        entityType: media.entityType,
        entityId: media.entityId?.toString(),
      }));

    const duplicateGroups = new Map();
    for (const media of mediaDocs) {
      const key = `${media.cloudinary.bytes}:${media.cloudinary.width}:${media.cloudinary.height}:${media.cloudinary.format}`;
      if (!duplicateGroups.has(key)) duplicateGroups.set(key, []);
      duplicateGroups.get(key).push(media._id.toString());
    }
    const duplicates = Array.from(duplicateGroups.values()).filter((group) => group.length > 1);

    return {
      totalMedia: mediaDocs.length,
      unusedCount: unused.length,
      unusedSample: unused.slice(0, 20).map((m) => m._id.toString()),
      orphanRecords,
      brokenReferences,
      // Heuristic (same bytes/dimensions/format), not a cryptographic hash
      // match - flags likely duplicates for manual review, not auto-deleted.
      duplicateGroups: duplicates,
    };
  },

  async listMedia(entityType, entityId, query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await mediaRepository.findPaginatedByEntity(entityType, entityId, {
      page,
      limit,
      ...filters,
    });
    return { items: serializeMediaList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  async getMediaById(id) {
    const media = await mediaRepository.findById(id);
    if (!media) throw new ApiError(404, 'Media not found');
    return serializeMedia(media);
  },

  // Richer than getMediaById - populates uploader/updater and includes the
  // usage report, for the Media Details view (Module 4). Kept separate so
  // every other call site (grids, pickers) stays on the cheap path.
  async getMediaDetails(id) {
    const media = await mediaRepository.findByIdWithCreator(id);
    if (!media) throw new ApiError(404, 'Media not found');
    const usage = await findUsageForMedia(media);
    return { ...serializeMedia(media), usageCount: usage.length, usedIn: usage.map(serializeUsageEntry) };
  },

  async getUsage(id) {
    const media = await mediaRepository.findById(id);
    if (!media) throw new ApiError(404, 'Media not found');
    const usage = await findUsageForMedia(media);
    return usage.map(serializeUsageEntry);
  },

  async uploadMedia({ entityType, entityId, variantId, file, altText, caption, isFeatured, isFeaturedVideo }, userId) {
    const type = resolveTypeFromMimetype(file.mimetype);
    assertWithinSizeLimit(type, file.size);
    assertFeaturedAllowed(type, isFeatured);
    assertFeaturedVideoAllowed(type, isFeaturedVideo);

    const folder = resolveMediaFolder(entityType);
    const uuid = uuidv4();
    const resourceType = type === MEDIA_TYPES.VIDEO ? 'video' : 'image';

    const uploadResult = await uploadBufferToCloudinary(file.buffer, { folder, publicId: uuid, resourceType });

    const media = await mediaRepository.create({
      uuid,
      entityType,
      entityId,
      variantId: variantId || null,
      type,
      cloudinary: buildCloudinarySnapshot(uploadResult, file.originalname, folder),
      isFeatured: Boolean(isFeatured),
      isFeaturedVideo: Boolean(isFeaturedVideo),
      altText: altText || '',
      caption: caption || '',
      createdBy: userId,
      updatedBy: userId,
    });

    if (isFeatured) {
      await mediaRepository.unsetFeaturedForScope(entityType, entityId, variantId || null, media._id);
    }
    if (isFeaturedVideo) {
      await mediaRepository.unsetFeaturedVideoForScope(entityType, entityId, variantId || null, media._id);
    }

    return serializeMedia(media);
  },

  async updateMetadata(id, data, userId) {
    const current = await mediaRepository.findById(id);
    if (!current) throw new ApiError(404, 'Media not found');

    if (data.isFeatured) {
      assertFeaturedAllowed(current.type, true);
    }
    if (data.isFeaturedVideo) {
      assertFeaturedVideoAllowed(current.type, true);
    }

    const media = await mediaRepository.updateById(id, { ...data, updatedBy: userId });

    if (data.isFeatured) {
      await mediaRepository.unsetFeaturedForScope(media.entityType, media.entityId, media.variantId, media._id);
    }
    if (data.isFeaturedVideo) {
      await mediaRepository.unsetFeaturedVideoForScope(media.entityType, media.entityId, media.variantId, media._id);
    }

    return serializeMedia(media);
  },

  // Upload the new asset FIRST, then delete the old one, then update the
  // record - in that order, so a failure at any step never leaves the
  // entity with zero valid media (see spec's REPLACE RULE).
  async replaceMedia(id, file, userId) {
    const current = await mediaRepository.findById(id);
    if (!current) throw new ApiError(404, 'Media not found');

    const type = resolveTypeFromMimetype(file.mimetype);
    assertWithinSizeLimit(type, file.size);

    const folder = resolveMediaFolder(current.entityType);
    const newUuid = uuidv4();
    const resourceType = type === MEDIA_TYPES.VIDEO ? 'video' : 'image';

    const uploadResult = await uploadBufferToCloudinary(file.buffer, { folder, publicId: newUuid, resourceType });

    await destroyCloudinaryAsset(current.cloudinary.publicId, current.cloudinary.resourceType);

    const updated = await mediaRepository.updateById(id, {
      uuid: newUuid,
      type,
      cloudinary: buildCloudinarySnapshot(uploadResult, file.originalname, folder),
      updatedBy: userId,
    });

    return serializeMedia(updated);
  },

  // Cloudinary asset must be confirmed gone (see media.cloudinary.js for
  // what counts as "gone") before the DB record is removed - otherwise a
  // real asset could end up with nothing referencing it (spec's DELETE RULE).
  //
  // Delete protection: refuse to delete media that's still referenced
  // anywhere (Module 2). `force` bypasses the check but is only honored for
  // super_admin - everyone else gets a 403 instead of a silent no-op.
  async deleteMedia(id, { force = false, requestingUserRole } = {}) {
    const media = await mediaRepository.findById(id);
    if (!media) throw new ApiError(404, 'Media not found');

    if (force) {
      if (requestingUserRole !== ROLES.SUPER_ADMIN) {
        throw new ApiError(403, 'Only a super admin can force delete media that is still in use');
      }
    } else {
      const usage = await findUsageForMedia(media);
      if (usage.length > 0) {
        const summary = summarizeUsage(usage);
        throw new ApiError(409, buildUsageConflictMessage(summary), summary);
      }
    }

    await destroyCloudinaryAsset(media.cloudinary.publicId, media.cloudinary.resourceType);
    await mediaRepository.deleteById(id);
  },

  async bulkDelete(ids, options = {}) {
    for (const id of ids) {
      // eslint-disable-next-line no-await-in-loop
      await mediaService.deleteMedia(id, options);
    }
  },

  async bulkArchive(ids) {
    await mediaRepository.updateManyStatus(ids, MEDIA_STATUSES.ARCHIVED);
  },

  async bulkRestore(ids) {
    await mediaRepository.updateManyStatus(ids, MEDIA_STATUSES.ACTIVE);
  },

  async reorder(items) {
    for (const item of items) {
      // eslint-disable-next-line no-await-in-loop
      await mediaRepository.updateById(item.id, { sortOrder: item.sortOrder });
    }
  },
};
