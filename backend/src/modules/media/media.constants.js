export const MEDIA_ENTITY_TYPES = Object.freeze({
  PRODUCT: 'product',
  VARIANT: 'variant',
  CATEGORY: 'category',
  BRAND: 'brand',
  COLLECTION: 'collection',
  CMS: 'cms',
  HOMEPAGE: 'homepage',
  BANNER: 'banner',
  PAGE: 'page',
  REVIEW: 'review',
  USER: 'user',
  SETTINGS: 'settings',
  CUSTOMER: 'customer',
  SUPPLIER: 'supplier',
  SUPPORT_TICKET: 'support_ticket',
  ISSUE_REPORT: 'issue_report',
});

export const MEDIA_TYPES = Object.freeze({
  IMAGE: 'image',
  VIDEO: 'video',
  DOCUMENT: 'document',
  THREE_SIXTY: '360',
});

export const MEDIA_VISIBILITY = Object.freeze({
  PUBLIC: 'public',
  PRIVATE: 'private',
});

export const MEDIA_STATUSES = Object.freeze({
  ACTIVE: 'active',
  ARCHIVED: 'archived',
});

// 360 is still DO-NOT-BUILD (no spec has needed it yet) - the schema already
// accommodates it so no migration will be needed when that upload path is
// added later. DOCUMENT is activated as of Phase 8 (customer KYC/GST/ID
// proof uploads) - see ALLOWED_DOCUMENT_MIME_TYPES below.
export const ALLOWED_IMAGE_MIME_TYPES = Object.freeze([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
]);

export const ALLOWED_VIDEO_MIME_TYPES = Object.freeze([
  'video/mp4',
  'video/webm',
  'video/quicktime', // .mov
]);

// Customer documents (KYC, GST certificate, business license, ID/address
// proof) are usually either a scanned PDF or a phone photo of the document -
// both are supported here, reusing the existing image MIME list rather than
// duplicating it.
export const ALLOWED_DOCUMENT_MIME_TYPES = Object.freeze([
  'application/pdf',
  ...ALLOWED_IMAGE_MIME_TYPES,
]);
