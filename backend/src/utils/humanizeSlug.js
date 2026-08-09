// The inverse of slugify.js's shape - 'daily-wear' -> 'Daily Wear'. Used to
// turn stored enum values (Gender/Occasion, see constants/catalog.js) into
// display labels without keeping a second hand-written label map in sync.
export const humanizeSlug = (slug) =>
  slug
    .toString()
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
