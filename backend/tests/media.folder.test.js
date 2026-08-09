import { resolveMediaFolder } from '../src/modules/media/media.folder.js';
import { MEDIA_ENTITY_TYPES } from '../src/modules/media/media.constants.js';

describe('resolveMediaFolder', () => {
  it('maps every entity type to a non-empty folder', () => {
    Object.values(MEDIA_ENTITY_TYPES).forEach((entityType) => {
      expect(typeof resolveMediaFolder(entityType)).toBe('string');
      expect(resolveMediaFolder(entityType).length).toBeGreaterThan(0);
    });
  });

  it('groups variant media alongside its parent product', () => {
    expect(resolveMediaFolder(MEDIA_ENTITY_TYPES.VARIANT)).toBe(resolveMediaFolder(MEDIA_ENTITY_TYPES.PRODUCT));
  });

  it('groups homepage, pages, and settings under the shared CMS folder', () => {
    const cmsFolder = resolveMediaFolder(MEDIA_ENTITY_TYPES.CMS);
    expect(resolveMediaFolder(MEDIA_ENTITY_TYPES.HOMEPAGE)).toBe(cmsFolder);
    expect(resolveMediaFolder(MEDIA_ENTITY_TYPES.PAGE)).toBe(cmsFolder);
    expect(resolveMediaFolder(MEDIA_ENTITY_TYPES.SETTINGS)).toBe(cmsFolder);
  });

  it('throws for an unknown entity type instead of silently returning a fallback', () => {
    expect(() => resolveMediaFolder('not-a-real-entity-type')).toThrow(
      'No Cloudinary folder is configured'
    );
  });
});
