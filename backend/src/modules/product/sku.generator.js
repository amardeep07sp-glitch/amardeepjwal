// Pure, DB-free (same convention as priceCalculator.js / variant.combination.js).
// The sequence NUMBER itself still has to come from a DB count (see
// product.repository.js#countByPrefix) - only the formatting is pure here.

export function buildSkuPrefix({ categoryPrefix, brandPrefix, collectionPrefix } = {}) {
  const parts = [categoryPrefix, brandPrefix, collectionPrefix].filter(Boolean).map((p) => p.toUpperCase());
  return parts.length > 0 ? parts.join('-') : 'PRD';
}

export function generateSku(prefix, sequenceNumber) {
  return `${prefix}-${String(sequenceNumber).padStart(6, '0')}`;
}
