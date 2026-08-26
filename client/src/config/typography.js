// The storefront half of the Settings -> Typography contract. Keys here
// MUST match backend/src/constants/typography.js exactly - the backend
// validates/stores the short key (e.g. 'cormorant-garamond'), this file
// is the only place that knows what real CSS font-family string that key
// maps to. Every value here is already self-hosted via a @fontsource
// import in index.css - never add a key here without a matching import,
// or the site would silently fall back to the browser's generic serif/
// sans-serif for that "supported" option.
export const HEADING_FONT_CSS = {
  'playfair-display': "'Playfair Display', serif",
  'cormorant-garamond': "'Cormorant Garamond', serif",
};

export const BODY_FONT_CSS = {
  inter: "'Inter Variable', sans-serif",
  poppins: "'Poppins', sans-serif",
};

export const DEFAULT_HEADING_FONT = 'playfair-display';
export const DEFAULT_BODY_FONT = 'inter';
