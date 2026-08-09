import { jest } from '@jest/globals';

const mockRepo = {
  findPaginatedByEntity: jest.fn(),
  findLibrary: jest.fn(),
  findLibraryCandidates: jest.fn(),
  findAllForHealthCheck: jest.fn(),
  findById: jest.fn(),
  findByIdWithCreator: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  deleteByIds: jest.fn(),
  updateManyStatus: jest.fn(),
  unsetFeaturedForScope: jest.fn(),
  unsetFeaturedVideoForScope: jest.fn(),
  countByEntity: jest.fn(),
};

const mockCloudinary = {
  uploadBufferToCloudinary: jest.fn(),
  destroyCloudinaryAsset: jest.fn(),
  checkAssetExists: jest.fn(),
  buildThumbnailUrl: jest.fn(() => 'https://res.cloudinary.com/thumb.jpg'),
};

const mockUsage = {
  findUsageForMedia: jest.fn(),
  summarizeUsage: jest.fn(),
  buildUsageConflictMessage: jest.fn(),
  findUsedMediaIdSet: jest.fn(),
  findMediaIdsWithExistingHome: jest.fn(),
  isHomeTrackedEntityType: jest.fn(),
};

jest.unstable_mockModule('../src/modules/media/media.repository.js', () => ({
  mediaRepository: mockRepo,
}));
jest.unstable_mockModule('../src/modules/media/media.cloudinary.js', () => mockCloudinary);
jest.unstable_mockModule('../src/modules/media/media.usage.js', () => mockUsage);

const { mediaService } = await import('../src/modules/media/media.service.js');
const { ROLES } = await import('../src/constants/roles.js');

const imageFile = { mimetype: 'image/jpeg', size: 1024, buffer: Buffer.from('x'), originalname: 'ring.jpg' };
const videoFile = { mimetype: 'video/mp4', size: 2048, buffer: Buffer.from('x'), originalname: 'clip.mp4' };

// Deliberately omits `folder` - the live Cloudinary upload API does not
// echo it back in the response, so the service must not depend on it.
const fakeUploadResult = {
  public_id: 'products/uuid-1',
  secure_url: 'https://res.cloudinary.com/products/uuid-1.jpg',
  resource_type: 'image',
  format: 'jpg',
  bytes: 1024,
  width: 800,
  height: 600,
};

const fakeCloudinarySnapshot = {
  publicId: 'products/uuid-1',
  secureUrl: 'https://res.cloudinary.com/products/uuid-1.jpg',
  thumbnailUrl: 'https://res.cloudinary.com/thumb.jpg',
  resourceType: 'image',
  format: 'jpg',
  bytes: 1024,
  width: 800,
  height: 600,
  folder: 'products',
};

beforeEach(() => {
  Object.values(mockRepo).forEach((fn) => fn.mockReset());
  Object.values(mockCloudinary).forEach((fn) => fn.mockReset?.());
  Object.values(mockUsage).forEach((fn) => fn.mockReset());
  mockCloudinary.buildThumbnailUrl.mockReturnValue('https://res.cloudinary.com/thumb.jpg');
  // Sensible defaults so existing tests that don't care about usage/delete
  // protection don't need to know about it - "not in use anywhere".
  mockUsage.findUsageForMedia.mockResolvedValue([]);
  mockUsage.summarizeUsage.mockReturnValue([]);
  mockUsage.buildUsageConflictMessage.mockReturnValue('Cannot delete media. Currently used elsewhere.');
});

describe('mediaService.uploadMedia', () => {
  it('rejects an unsupported file type', async () => {
    // application/pdf is no longer unsupported as of Phase 8 (customer
    // document uploads activated MEDIA_TYPES.DOCUMENT) - use a mimetype
    // that's genuinely outside every allowed list instead.
    await expect(
      mediaService.uploadMedia(
        { entityType: 'product', entityId: 'p1', file: { mimetype: 'application/zip', size: 10 } },
        'user1'
      )
    ).rejects.toThrow('Unsupported file type');
    expect(mockCloudinary.uploadBufferToCloudinary).not.toHaveBeenCalled();
  });

  it('rejects a file larger than the configured limit for its type', async () => {
    const oversized = { ...imageFile, size: 999 * 1024 * 1024 };
    await expect(
      mediaService.uploadMedia({ entityType: 'product', entityId: 'p1', file: oversized }, 'user1')
    ).rejects.toThrow('exceeds the maximum allowed size');
    expect(mockCloudinary.uploadBufferToCloudinary).not.toHaveBeenCalled();
  });

  it('rejects a video being marked as featured', async () => {
    await expect(
      mediaService.uploadMedia(
        { entityType: 'product', entityId: 'p1', file: videoFile, isFeatured: true },
        'user1'
      )
    ).rejects.toThrow('Only images can be set as the featured media');
    expect(mockCloudinary.uploadBufferToCloudinary).not.toHaveBeenCalled();
  });

  it('uploads to Cloudinary, saves the snapshot, and unsets other featured media', async () => {
    mockCloudinary.uploadBufferToCloudinary.mockResolvedValue(fakeUploadResult);
    mockRepo.create.mockResolvedValue({
      _id: 'm1',
      entityType: 'product',
      entityId: 'p1',
      variantId: null,
      cloudinary: fakeCloudinarySnapshot,
    });

    await mediaService.uploadMedia(
      { entityType: 'product', entityId: 'p1', file: imageFile, isFeatured: true },
      'user1'
    );

    expect(mockCloudinary.uploadBufferToCloudinary).toHaveBeenCalledWith(
      imageFile.buffer,
      expect.objectContaining({ folder: 'products', resourceType: 'image' })
    );
    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'image', isFeatured: true, createdBy: 'user1' })
    );
    expect(mockRepo.unsetFeaturedForScope).toHaveBeenCalledWith('product', 'p1', null, 'm1');
  });
});

describe('mediaService.updateMetadata', () => {
  it('rejects marking a video as featured', async () => {
    mockRepo.findById.mockResolvedValue({ _id: 'm1', type: 'video' });

    await expect(mediaService.updateMetadata('m1', { isFeatured: true }, 'user1')).rejects.toThrow(
      'Only images can be set as the featured media'
    );
  });

  it('unsets other featured media when this one becomes featured', async () => {
    mockRepo.findById.mockResolvedValue({ _id: 'm1', type: 'image' });
    mockRepo.updateById.mockResolvedValue({
      _id: 'm1',
      entityType: 'product',
      entityId: 'p1',
      variantId: null,
      cloudinary: fakeCloudinarySnapshot,
    });

    await mediaService.updateMetadata('m1', { isFeatured: true }, 'user1');

    expect(mockRepo.unsetFeaturedForScope).toHaveBeenCalledWith('product', 'p1', null, 'm1');
  });
});

describe('mediaService featured video', () => {
  it('rejects an image being marked as the featured video', async () => {
    await expect(
      mediaService.uploadMedia(
        { entityType: 'product', entityId: 'p1', file: imageFile, isFeaturedVideo: true },
        'user1'
      )
    ).rejects.toThrow('Only videos can be set as the featured video');
    expect(mockCloudinary.uploadBufferToCloudinary).not.toHaveBeenCalled();
  });

  it('uploads a featured video independently of the featured image, unsetting only other featured videos', async () => {
    mockCloudinary.uploadBufferToCloudinary.mockResolvedValue({ ...fakeUploadResult, resource_type: 'video' });
    mockRepo.create.mockResolvedValue({
      _id: 'v1',
      entityType: 'product',
      entityId: 'p1',
      variantId: null,
      cloudinary: { ...fakeCloudinarySnapshot, resourceType: 'video' },
    });

    await mediaService.uploadMedia(
      { entityType: 'product', entityId: 'p1', file: videoFile, isFeaturedVideo: true },
      'user1'
    );

    expect(mockRepo.create).toHaveBeenCalledWith(expect.objectContaining({ isFeaturedVideo: true }));
    expect(mockRepo.unsetFeaturedVideoForScope).toHaveBeenCalledWith('product', 'p1', null, 'v1');
    expect(mockRepo.unsetFeaturedForScope).not.toHaveBeenCalled();
  });

  it('rejects marking an image as the featured video via metadata update', async () => {
    mockRepo.findById.mockResolvedValue({ _id: 'm1', type: 'image' });

    await expect(mediaService.updateMetadata('m1', { isFeaturedVideo: true }, 'user1')).rejects.toThrow(
      'Only videos can be set as the featured video'
    );
  });

  it('unsets other featured videos when this video becomes the featured video', async () => {
    mockRepo.findById.mockResolvedValue({ _id: 'v1', type: 'video' });
    mockRepo.updateById.mockResolvedValue({
      _id: 'v1',
      entityType: 'product',
      entityId: 'p1',
      variantId: null,
      cloudinary: { ...fakeCloudinarySnapshot, resourceType: 'video' },
    });

    await mediaService.updateMetadata('v1', { isFeaturedVideo: true }, 'user1');

    expect(mockRepo.unsetFeaturedVideoForScope).toHaveBeenCalledWith('product', 'p1', null, 'v1');
  });
});

describe('mediaService.replaceMedia', () => {
  it('uploads the new file before deleting the old one', async () => {
    mockRepo.findById.mockResolvedValue({
      _id: 'm1',
      entityType: 'product',
      cloudinary: { publicId: 'products/old-uuid', resourceType: 'image' },
    });
    mockCloudinary.uploadBufferToCloudinary.mockResolvedValue(fakeUploadResult);
    mockRepo.updateById.mockResolvedValue({ _id: 'm1', cloudinary: fakeCloudinarySnapshot });

    const callOrder = [];
    mockCloudinary.uploadBufferToCloudinary.mockImplementation(async () => {
      callOrder.push('upload');
      return fakeUploadResult;
    });
    mockCloudinary.destroyCloudinaryAsset.mockImplementation(async () => {
      callOrder.push('destroy');
    });

    await mediaService.replaceMedia('m1', imageFile, 'user1');

    expect(callOrder).toEqual(['upload', 'destroy']);
    expect(mockCloudinary.destroyCloudinaryAsset).toHaveBeenCalledWith('products/old-uuid', 'image');
  });

  it('never deletes the old asset if the new upload fails', async () => {
    mockRepo.findById.mockResolvedValue({
      _id: 'm1',
      entityType: 'product',
      cloudinary: { publicId: 'products/old-uuid', resourceType: 'image' },
    });
    mockCloudinary.uploadBufferToCloudinary.mockRejectedValue(new Error('Cloudinary is down'));

    await expect(mediaService.replaceMedia('m1', imageFile, 'user1')).rejects.toThrow('Cloudinary is down');
    expect(mockCloudinary.destroyCloudinaryAsset).not.toHaveBeenCalled();
    expect(mockRepo.updateById).not.toHaveBeenCalled();
  });
});

describe('mediaService.deleteMedia', () => {
  it('deletes the DB record only after the Cloudinary asset is confirmed gone', async () => {
    mockRepo.findById.mockResolvedValue({
      _id: 'm1',
      cloudinary: { publicId: 'products/uuid-1', resourceType: 'image' },
    });
    mockCloudinary.destroyCloudinaryAsset.mockResolvedValue({ result: 'ok' });

    await mediaService.deleteMedia('m1');

    expect(mockCloudinary.destroyCloudinaryAsset).toHaveBeenCalledWith('products/uuid-1', 'image');
    expect(mockRepo.deleteById).toHaveBeenCalledWith('m1');
  });

  it('does not delete the DB record if the Cloudinary deletion fails', async () => {
    mockRepo.findById.mockResolvedValue({
      _id: 'm1',
      cloudinary: { publicId: 'products/uuid-1', resourceType: 'image' },
    });
    mockCloudinary.destroyCloudinaryAsset.mockRejectedValue(new Error('Cloudinary deletion failed: error'));

    await expect(mediaService.deleteMedia('m1')).rejects.toThrow('Cloudinary deletion failed');
    expect(mockRepo.deleteById).not.toHaveBeenCalled();
  });
});

describe('mediaService delete protection', () => {
  it('rejects deletion with 409 when the media is still referenced somewhere', async () => {
    mockRepo.findById.mockResolvedValue({
      _id: 'm1',
      cloudinary: { publicId: 'products/uuid-1', resourceType: 'image' },
    });
    mockUsage.findUsageForMedia.mockResolvedValue([{ module: 'Product', entityId: 'p1', entityName: 'Ring' }]);
    mockUsage.summarizeUsage.mockReturnValue([{ module: 'Product', count: 1 }]);

    await expect(mediaService.deleteMedia('m1')).rejects.toMatchObject({ statusCode: 409 });
    expect(mockCloudinary.destroyCloudinaryAsset).not.toHaveBeenCalled();
    expect(mockRepo.deleteById).not.toHaveBeenCalled();
  });

  it('force delete succeeds for a super admin even when the media is in use', async () => {
    mockRepo.findById.mockResolvedValue({
      _id: 'm1',
      cloudinary: { publicId: 'products/uuid-1', resourceType: 'image' },
    });
    mockCloudinary.destroyCloudinaryAsset.mockResolvedValue({ result: 'ok' });

    await mediaService.deleteMedia('m1', { force: true, requestingUserRole: ROLES.SUPER_ADMIN });

    expect(mockUsage.findUsageForMedia).not.toHaveBeenCalled();
    expect(mockCloudinary.destroyCloudinaryAsset).toHaveBeenCalledWith('products/uuid-1', 'image');
    expect(mockRepo.deleteById).toHaveBeenCalledWith('m1');
  });

  it('rejects force delete with 403 for anyone other than a super admin', async () => {
    mockRepo.findById.mockResolvedValue({
      _id: 'm1',
      cloudinary: { publicId: 'products/uuid-1', resourceType: 'image' },
    });

    await expect(
      mediaService.deleteMedia('m1', { force: true, requestingUserRole: ROLES.ADMIN })
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(mockCloudinary.destroyCloudinaryAsset).not.toHaveBeenCalled();
  });
});

describe('mediaService bulk operations', () => {
  it('bulkArchive sets status to archived for all ids', async () => {
    await mediaService.bulkArchive(['a', 'b']);
    expect(mockRepo.updateManyStatus).toHaveBeenCalledWith(['a', 'b'], 'archived');
  });

  it('bulkRestore sets status to active for all ids', async () => {
    await mediaService.bulkRestore(['a', 'b']);
    expect(mockRepo.updateManyStatus).toHaveBeenCalledWith(['a', 'b'], 'active');
  });

  it('bulkDelete runs the full Cloudinary-then-DB delete sequence for every id', async () => {
    mockRepo.findById.mockResolvedValue({
      _id: 'm1',
      cloudinary: { publicId: 'products/uuid-1', resourceType: 'image' },
    });
    mockCloudinary.destroyCloudinaryAsset.mockResolvedValue({ result: 'ok' });

    await mediaService.bulkDelete(['m1', 'm2']);

    expect(mockCloudinary.destroyCloudinaryAsset).toHaveBeenCalledTimes(2);
    expect(mockRepo.deleteById).toHaveBeenCalledTimes(2);
  });
});

describe('mediaService.reorder', () => {
  it('persists sortOrder for every item', async () => {
    await mediaService.reorder([
      { id: 'm1', sortOrder: 0 },
      { id: 'm2', sortOrder: 1 },
    ]);

    expect(mockRepo.updateById).toHaveBeenCalledWith('m1', { sortOrder: 0 });
    expect(mockRepo.updateById).toHaveBeenCalledWith('m2', { sortOrder: 1 });
  });
});

describe('mediaService.browseLibrary', () => {
  it('delegates to the cross-entity findLibrary query and serializes the page', async () => {
    mockRepo.findLibrary.mockResolvedValue({
      items: [{ _id: 'm1', entityType: 'brand', entityId: 'b1', variantId: null, cloudinary: fakeCloudinarySnapshot }],
      total: 1,
    });

    const result = await mediaService.browseLibrary({ page: 1, limit: 24, entityType: 'brand', search: 'logo' });

    expect(mockRepo.findLibrary).toHaveBeenCalledWith({ page: 1, limit: 24, entityType: 'brand', search: 'logo' });
    expect(result.items).toHaveLength(1);
    expect(result.meta).toEqual({ page: 1, limit: 24, totalItems: 1, totalPages: 1 });
  });

  it('resolves the Used/Unused filter in memory against a candidate set instead of a plain paginated query', async () => {
    const used = { _id: 'used1', entityType: 'brand', entityId: 'b1', cloudinary: fakeCloudinarySnapshot };
    const unused = { _id: 'unused1', entityType: 'brand', entityId: 'b2', cloudinary: fakeCloudinarySnapshot };
    mockRepo.findLibraryCandidates.mockResolvedValue([used, unused]);
    mockUsage.findUsedMediaIdSet.mockResolvedValue(new Set(['used1']));

    const result = await mediaService.browseLibrary({ page: 1, limit: 24, usage: 'unused' });

    expect(mockRepo.findLibrary).not.toHaveBeenCalled();
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe('unused1');
    expect(result.meta.totalItems).toBe(1);
  });
});

describe('mediaService.getUsage', () => {
  it('returns a serialized usage report for the given media', async () => {
    mockRepo.findById.mockResolvedValue({ _id: 'm1', entityType: 'product', entityId: 'p1' });
    mockUsage.findUsageForMedia.mockResolvedValue([
      { module: 'Product', entityId: 'p1', entityName: 'Ring', createdAt: new Date() },
    ]);

    const usage = await mediaService.getUsage('m1');

    expect(usage).toHaveLength(1);
    expect(usage[0]).toMatchObject({ module: 'Product', entityId: 'p1', entityName: 'Ring' });
  });

  it('throws 404 when the media does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);
    await expect(mediaService.getUsage('missing')).rejects.toThrow('Media not found');
  });
});
