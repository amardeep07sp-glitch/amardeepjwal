// Pure, DB-free rule matching (same convention as collection.rules.js/
// inventory.stockStatus.js/priceCalculator.js) - every dimension here is
// optional. An EMPTY array/null on a given dimension means "no
// restriction from this dimension" (matches everything); a non-empty
// array means "must match one of these" (OR within the dimension). All
// present dimensions must pass together (AND across dimensions) - a
// coupon scoped to `metals: [gold]` AND `includeCategories: [Rings]`
// requires a product to be BOTH gold AND in Rings, not either.
//
// Category matching is ancestor-inclusive: scoping to a parent "Jewellery"
// category also matches products in its "Rings"/"Necklaces" children,
// via Category's own materialized `ancestors` path - the caller must
// resolve and pass `product.categoryAncestors` (see coupon.service.js).
//
// Collection matching is direct-assignment only (`product.collectionId`)
// - a documented v1 limitation: a product that only belongs to a
// RULE_BASED collection dynamically (never had `collectionId` set) will
// not match a coupon scoped to that collection. Re-evaluating every
// referenced collection's live rule set against every cart item is a
// real, scoped follow-up, not silently attempted here.
function matchesIncludeExclude(id, { include, exclude }) {
  const idStr = id != null ? String(id) : null;
  if (include?.length) {
    if (!idStr || !include.some((x) => String(x) === idStr)) return false;
  }
  if (exclude?.length && idStr) {
    if (exclude.some((x) => String(x) === idStr)) return false;
  }
  return true;
}

function matchesCategoryScope(product, scope) {
  const categoryIds = [product.category, ...(product.categoryAncestors ?? [])].filter(Boolean).map(String);

  if (scope.includeCategories?.length) {
    if (!scope.includeCategories.some((id) => categoryIds.includes(String(id)))) return false;
  }
  if (scope.excludeCategories?.length) {
    if (scope.excludeCategories.some((id) => categoryIds.includes(String(id)))) return false;
  }
  return true;
}

// `product` shape expected: { _id, category, categoryAncestors, brand,
// collectionId, metal, purity, gemstoneType, pricing: { finalPrice, mrp } }
export function productMatchesScope(scope, product) {
  if (!scope) return true;

  if (!matchesIncludeExclude(product._id, { include: scope.includeProducts, exclude: scope.excludeProducts })) return false;
  if (!matchesCategoryScope(product, scope)) return false;
  if (!matchesIncludeExclude(product.collectionId, { include: scope.includeCollections, exclude: scope.excludeCollections })) return false;
  if (!matchesIncludeExclude(product.brand, { include: scope.includeBrands, exclude: scope.excludeBrands })) return false;

  if (scope.metals?.length && !scope.metals.includes(product.metal)) return false;
  if (scope.purities?.length && !scope.purities.includes(product.purity)) return false;
  if (scope.gemstoneTypes?.length && !scope.gemstoneTypes.includes(product.gemstoneType)) return false;

  const finalPrice = product.pricing?.finalPrice ?? 0;
  if (scope.minPrice != null && finalPrice < scope.minPrice) return false;
  if (scope.maxPrice != null && finalPrice > scope.maxPrice) return false;

  if (scope.excludeSaleProducts) {
    const mrp = product.pricing?.mrp ?? 0;
    if (mrp > 0 && finalPrice < mrp) return false;
  }

  return true;
}

// Does ANY item in the (already scope-filtered) cart satisfy the scope at
// all - used as a fast short-circuit before running the full discount
// calculation. Kept separate from productMatchesScope so a caller that
// already has a flat eligible/ineligible split doesn't need to re-derive it.
export function hasEligibleItems(scope, products) {
  return products.some((product) => productMatchesScope(scope, product));
}
