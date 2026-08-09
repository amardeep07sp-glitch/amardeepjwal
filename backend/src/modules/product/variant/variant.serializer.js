const serializeRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined || ref.value !== undefined) {
    return {
      id: ref._id.toString(),
      name: ref.name,
      slug: ref.slug,
      type: ref.type,
      value: ref.value,
      hexColor: ref.hexColor,
      imageUrl: ref.imageUrl,
    };
  }
  return ref.toString();
};

const serializeAttributePair = (pair) => ({
  attribute: serializeRef(pair.attribute),
  value: serializeRef(pair.value),
});

export const serializeVariant = (variant) => {
  const plain = typeof variant.toObject === 'function' ? variant.toObject() : variant;

  return {
    id: plain._id,
    product: plain.product?.toString?.() ?? plain.product,
    sku: plain.sku,
    slug: plain.slug,
    status: plain.status,
    isVisible: plain.isVisible,
    order: plain.order,
    priceOverride: plain.priceOverride,
    weightOverride: plain.weightOverride,
    isFeatured: plain.isFeatured,
    isDefault: plain.isDefault,
    attributes: (plain.attributes ?? []).map(serializeAttributePair),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeVariantList = (variants) => variants.map(serializeVariant);

// What the storefront's size/attribute selector needs - no SKU, no admin
// status/audit fields. `stockQuantity` is per-THIS-variant (not the
// product-wide sum) so a sold-out size can be shown disabled while others
// stay selectable.
export const serializePublicVariant = (variant, { stockQuantity } = {}) => {
  const plain = typeof variant.toObject === 'function' ? variant.toObject() : variant;
  const quantity = stockQuantity ?? 0;

  return {
    id: plain._id,
    slug: plain.slug,
    priceOverride: plain.priceOverride,
    weightOverride: plain.weightOverride,
    isDefault: plain.isDefault,
    attributes: (plain.attributes ?? []).map(serializeAttributePair),
    inStock: quantity > 0,
    stockQuantity: quantity,
  };
};

// `stockByVariantId` is a Map keyed by variant id string.
export const serializePublicVariantList = (variants, stockByVariantId) =>
  variants.map((variant) =>
    serializePublicVariant(variant, { stockQuantity: stockByVariantId?.get(variant._id.toString()) ?? 0 })
  );
