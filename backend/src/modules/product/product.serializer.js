import { serializeMediaRef } from '../media/media.serializer.js';

const serializeRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, slug: ref.slug };
  return ref.toString();
};

export const serializeProduct = (product) => {
  const plain = typeof product.toObject === 'function' ? product.toObject() : product;

  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    sku: plain.sku,
    shortDescription: plain.shortDescription,
    description: plain.description,
    status: plain.status,
    isFeatured: plain.isFeatured,
    isVisible: plain.isVisible,
    order: plain.order,
    category: serializeRef(plain.category),
    brand: serializeRef(plain.brand),
    collectionId: serializeRef(plain.collectionId),
    attributeGroups: (plain.attributeGroups ?? []).map(serializeRef),
    tags: plain.tags ?? [],
    searchKeywords: plain.searchKeywords ?? [],
    gender: plain.gender ?? null,
    occasion: plain.occasion ?? [],
    seo: {
      metaTitle: plain.seo?.metaTitle ?? '',
      metaDescription: plain.seo?.metaDescription ?? '',
      metaKeywords: plain.seo?.metaKeywords ?? '',
      canonicalUrl: plain.seo?.canonicalUrl ?? '',
      ogImageMedia: serializeMediaRef(plain.seo?.ogImageMedia),
    },
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeProductList = (products) => products.map(serializeProduct);

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// What the storefront is allowed to see - no cost price (the store's own
// margin data) and no SKU, but the rest of the jewellery pricing fields
// (making charges, wastage %, gold/silver rate snapshot, stone/diamond/
// labour cost) ARE shown - real jewellery e-commerce shows this "Price
// Breakup" for transparency, it isn't a secret the way costPrice is.
// `stockQuantity` is the real, summed-across-warehouses number (not just a
// boolean) - the storefront UI decides what to do with it (e.g. an
// "Only 2 left!" urgency badge below some threshold); this layer only
// ever reports the fact.
export const serializePublicProduct = (product, { image, images, stockQuantity, variants } = {}) => {
  const plain = typeof product.toObject === 'function' ? product.toObject() : product;
  const pricing = plain.pricing ?? {};
  const mrp = pricing.mrp ?? 0;
  const finalPrice = pricing.finalPrice ?? mrp;
  const discountPercentage = mrp > 0 && finalPrice < mrp ? Math.round(((mrp - finalPrice) / mrp) * 100) : 0;
  const quantity = stockQuantity ?? 0;

  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    shortDescription: plain.shortDescription,
    description: plain.description,
    category: serializeRef(plain.category),
    brand: serializeRef(plain.brand),
    attributeGroups: (plain.attributeGroups ?? []).map(serializeRef),
    tags: plain.tags ?? [],
    gender: plain.gender ?? null,
    occasion: plain.occasion ?? [],
    isFeatured: plain.isFeatured,
    price: {
      mrp: round2(mrp),
      finalPrice: round2(finalPrice),
      discountPercentage,
      currency: pricing.currency ?? 'INR',
    },
    priceBreakdown: {
      makingCharges: pricing.makingCharges ?? 0,
      makingChargeType: pricing.makingChargeType ?? 'fixed',
      wastagePercentage: pricing.wastagePercentage ?? 0,
      goldRateSnapshot: pricing.goldRateSnapshot ?? 0,
      silverRateSnapshot: pricing.silverRateSnapshot ?? 0,
      stoneCost: pricing.stoneCost ?? 0,
      diamondCost: pricing.diamondCost ?? 0,
      labourCost: pricing.labourCost ?? 0,
      taxPercentage: pricing.taxPercentage ?? 0,
      taxIncluded: pricing.taxIncluded ?? false,
    },
    // `image` (single cover) stays for list/grid views (ProductCard etc.);
    // `images` (full gallery, cover-first) is only ever populated for the
    // single-product-by-slug read - list views never pay for N galleries.
    image: serializeMediaRef(image),
    images: (images ?? []).map(serializeMediaRef),
    inStock: quantity > 0,
    stockQuantity: quantity,
    // Only ever populated on the single-product-by-slug read, same reason
    // as `images` - list views don't pay for a per-product variant fetch.
    // Empty for the (currently overwhelming majority of) products that
    // don't use Variants at all - the PDP simply shows no size selector.
    variants: variants ?? [],
    createdAt: plain.createdAt,
  };
};

// `imagesById`/`stockByProductId` are Maps keyed by product id string -
// both optional so a caller that doesn't need them (rare) isn't forced to
// build empty Maps just to satisfy the signature.
export const serializePublicProductList = (products, imagesById, stockByProductId) =>
  products.map((product) =>
    serializePublicProduct(product, {
      image: imagesById?.get(product._id.toString()) ?? null,
      stockQuantity: stockByProductId?.get(product._id.toString()) ?? 0,
    })
  );
