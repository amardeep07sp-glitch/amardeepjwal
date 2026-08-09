import { serializeMediaRef } from '../media/media.serializer.js';

export const serializeBrand = (brand) => {
  const plain = typeof brand.toObject === 'function' ? brand.toObject() : brand;

  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description,
    skuPrefix: plain.skuPrefix,
    logoMedia: serializeMediaRef(plain.logoMedia),
    bannerMedia: serializeMediaRef(plain.bannerMedia),
    country: plain.country,
    website: plain.website,
    status: plain.status,
    isFeatured: plain.isFeatured,
    isVisible: plain.isVisible,
    order: plain.order,
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

export const serializeBrandList = (brands) => brands.map(serializeBrand);

// Storefront-facing shape - no status/skuPrefix/isVisible/order (staff-only
// concerns) - just what a shopper's Brands page/PDP link actually needs.
export const serializePublicBrand = (brand, { productCount = 0 } = {}) => {
  const plain = typeof brand.toObject === 'function' ? brand.toObject() : brand;

  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description,
    logoMedia: serializeMediaRef(plain.logoMedia),
    bannerMedia: serializeMediaRef(plain.bannerMedia),
    country: plain.country,
    website: plain.website,
    productCount,
    seo: {
      metaTitle: plain.seo?.metaTitle ?? '',
      metaDescription: plain.seo?.metaDescription ?? '',
    },
  };
};

export const serializePublicBrandList = (brands, countsById) =>
  brands.map((brand) => serializePublicBrand(brand, { productCount: countsById?.get(brand._id.toString()) ?? 0 }));
