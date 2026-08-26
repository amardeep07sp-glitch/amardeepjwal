export const NAVBAR_ITEM_TYPES = Object.freeze({
  CUSTOM_LINK: 'custom_link',
  STATIC_PAGE: 'static_page',
});

export const BANNER_POSITIONS = Object.freeze({
  HOMEPAGE_HERO: 'homepage_hero',
  HOMEPAGE_SECONDARY: 'homepage_secondary',
  SITEWIDE_ANNOUNCEMENT: 'sitewide_announcement',
  // Shown as a dismissible modal once per browser session, site-wide (see
  // client/src/components/layout/PopupAdModal.jsx) - reuses this same
  // Banner entity (image, linkUrl, schedule window, active flag) rather
  // than a new model, since a popup ad is just another banner placement.
  POPUP_AD: 'popup_ad',
});

export const PAGE_STATUSES = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
});

export const HOMEPAGE_SECTION_TYPES = Object.freeze({
  BANNER: 'banner',
  TEXT_BLOCK: 'text_block',
});
