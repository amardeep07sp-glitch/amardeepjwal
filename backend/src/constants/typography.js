// The site-wide font picker's curated allowlist (Settings -> Typography).
// Deliberately NOT free text - every option here is a font the storefront
// already self-hosts (client/src/index.css's @fontsource imports), so
// picking one is just switching which bundled font a CSS variable points
// to, never a live Google-Fonts-CDN fetch (extra request + FOUC risk) or a
// typo'd family name silently breaking every heading on the site. Keys
// here MUST match client/src/config/typography.js's lookup tables exactly
// - that's the other half of this contract, kept in sync by hand since
// the two apps don't share a package.
export const HEADING_FONTS = Object.freeze({
  PLAYFAIR_DISPLAY: 'playfair-display',
  CORMORANT_GARAMOND: 'cormorant-garamond',
});
export const HEADING_FONT_VALUES = Object.values(HEADING_FONTS);

export const BODY_FONTS = Object.freeze({
  INTER: 'inter',
  POPPINS: 'poppins',
});
export const BODY_FONT_VALUES = Object.values(BODY_FONTS);
