import { serializeMediaRef } from '../media/media.serializer.js';

const serializeShowcase = (showcase) => ({
  heroTagline: showcase?.heroTagline ?? '',
  heroLocalName: showcase?.heroLocalName ?? '',
  heroImageMedia: serializeMediaRef(showcase?.heroImageMedia),
  storyTitle: showcase?.storyTitle ?? '',
  storyBody: showcase?.storyBody ?? '',
  storyImageMedia: serializeMediaRef(showcase?.storyImageMedia),
  editions: (showcase?.editions ?? []).map((e) => ({
    name: e.name,
    localName: e.localName ?? '',
    tagline: e.tagline ?? '',
    categorySlug: e.categorySlug ?? '',
  })),
  craftPillars: (showcase?.craftPillars ?? []).map((p) => ({ title: p.title, description: p.description ?? '', icon: p.icon ?? '' })),
  trustBenefits: (showcase?.trustBenefits ?? []).map((b) => ({ title: b.title, description: b.description ?? '', icon: b.icon ?? '' })),
});

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
    showcase: serializeShowcase(plain.showcase),
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
    showcase: serializeShowcase(plain.showcase),
    seo: {
      metaTitle: plain.seo?.metaTitle ?? '',
      metaDescription: plain.seo?.metaDescription ?? '',
    },
  };
};

export const serializePublicBrandList = (brands, countsById) =>
  brands.map((brand) => serializePublicBrand(brand, { productCount: countsById?.get(brand._id.toString()) ?? 0 }));
