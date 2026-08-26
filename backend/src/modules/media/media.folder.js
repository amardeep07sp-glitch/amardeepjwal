import { MEDIA_ENTITY_TYPES } from './media.constants.js';

// The ONLY place Cloudinary folder names are decided. Every service/route
// must resolve folders through resolveMediaFolder() - never hardcode a
// folder string anywhere else in the codebase.
//
// Not every entity type gets its own folder - several intentionally share
// one (e.g. variant media lives alongside its parent product; homepage,
// static pages and settings assets are all CMS content).
const ENTITY_FOLDER_MAP = Object.freeze({
  [MEDIA_ENTITY_TYPES.PRODUCT]: 'products',
  [MEDIA_ENTITY_TYPES.VARIANT]: 'products',
  [MEDIA_ENTITY_TYPES.CATEGORY]: 'categories',
  [MEDIA_ENTITY_TYPES.BRAND]: 'brands',
  [MEDIA_ENTITY_TYPES.COLLECTION]: 'collections',
  [MEDIA_ENTITY_TYPES.CMS]: 'cms',
  [MEDIA_ENTITY_TYPES.HOMEPAGE]: 'cms',
  [MEDIA_ENTITY_TYPES.PAGE]: 'cms',
  [MEDIA_ENTITY_TYPES.SETTINGS]: 'cms',
  [MEDIA_ENTITY_TYPES.BANNER]: 'banners',
  [MEDIA_ENTITY_TYPES.REVIEW]: 'reviews',
  [MEDIA_ENTITY_TYPES.USER]: 'users',
  // Customer KYC/GST/ID-proof documents (Phase 8) - kept in their own
  // folder since these are private/sensitive, unlike everything else above.
  [MEDIA_ENTITY_TYPES.CUSTOMER]: 'customers',
  // Supplier documents (Phase 9) - GST certificate, PAN, bank proof, rate
  // contracts - same private-folder treatment as customer KYC documents.
  [MEDIA_ENTITY_TYPES.SUPPLIER]: 'suppliers',
  // Customer-submitted evidence (damaged-item photos, screenshots) for
  // support tickets and issue reports - same private-folder treatment as
  // customer/supplier documents above.
  [MEDIA_ENTITY_TYPES.SUPPORT_TICKET]: 'support',
  [MEDIA_ENTITY_TYPES.ISSUE_REPORT]: 'support',
});

export function resolveMediaFolder(entityType) {
  const folder = ENTITY_FOLDER_MAP[entityType];
  if (!folder) {
    throw new Error(`No Cloudinary folder is configured for entity type "${entityType}"`);
  }
  return folder;
}
