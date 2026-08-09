import { z } from 'zod';

export const MEDIA_STATUS_BADGE_VARIANTS = {
  active: 'success',
  archived: 'secondary',
};

export const MEDIA_VISIBILITY_BADGE_VARIANTS = {
  public: 'outline',
  private: 'warning',
};

export const metadataSchema = z.object({
  altText: z.string().optional(),
  caption: z.string().optional(),
  visibility: z.enum(['public', 'private']).default('public'),
  isFeatured: z.boolean().default(false),
  isFeaturedVideo: z.boolean().default(false),
});

export const metadataFormDefaults = {
  altText: '',
  caption: '',
  visibility: 'public',
  isFeatured: false,
  isFeaturedVideo: false,
};

// Shared shape for every *Media form field across the admin panel (Brand.logoMedia,
// Category.bannerMedia, Settings.faviconMedia, etc.) - the form holds the full
// populated media ref object (or null) for preview purposes; toMediaIdForSubmit
// extracts just the id before the payload is sent to the API.
export const mediaRefSchema = z
  .object({
    _id: z.string(),
    secureUrl: z.string(),
    thumbnailUrl: z.string().optional(),
    width: z.number().nullable().optional(),
    height: z.number().nullable().optional(),
    format: z.string().optional(),
    resourceType: z.string().optional(),
    bytes: z.number().optional(),
    altText: z.string().optional(),
    caption: z.string().optional(),
  })
  .nullable()
  .optional();

export const toMediaIdForSubmit = (value) => value?._id ?? null;

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`;
}
