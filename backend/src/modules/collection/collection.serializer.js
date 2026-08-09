import { serializeMediaRef } from '../media/media.serializer.js';

// {id, name, slug, thumbnailMedia?} - the light shape used for
// relatedCollections/parentCampaign refs. Deliberately not a recursive
// serializeCollection call - two collections mutually listing each other as
// related would otherwise infinite-loop.
const serializeCollectionRef = (ref) => {
  if (!ref) return null;
  const plain = typeof ref.toObject === 'function' ? ref.toObject() : ref;
  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    ...(plain.thumbnailMedia !== undefined ? { thumbnailMedia: serializeMediaRef(plain.thumbnailMedia) } : {}),
  };
};

export const serializeCollection = (collection) => {
  const plain = typeof collection.toObject === 'function' ? collection.toObject() : collection;

  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description,
    shortDescription: plain.shortDescription,
    skuPrefix: plain.skuPrefix,
    bannerMedia: serializeMediaRef(plain.bannerMedia),
    thumbnailMedia: serializeMediaRef(plain.thumbnailMedia),
    mobileBannerMedia: serializeMediaRef(plain.mobileBannerMedia),
    promoVideoMedia: serializeMediaRef(plain.promoVideoMedia),
    status: plain.status,
    isFeatured: plain.isFeatured,
    isVisible: plain.isVisible,
    order: plain.order,

    type: plain.type,
    assignmentType: plain.assignmentType,
    rules: plain.rules,

    startDate: plain.startDate,
    endDate: plain.endDate,
    autoPublish: plain.autoPublish,
    autoArchive: plain.autoArchive,

    sortMode: plain.sortMode,
    visibility: plain.visibility,

    faqs: plain.faqs ?? [],
    relatedCollections: (plain.relatedCollections ?? []).map(serializeCollectionRef),
    parentCampaign: serializeCollectionRef(plain.parentCampaign),

    viewCount: plain.viewCount,
    clickCount: plain.clickCount,

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

export const serializeCollectionList = (collections) => collections.map(serializeCollection);

// Customer-facing shape - strips admin-only internals (rules, skuPrefix, the
// raw viewCount/clickCount numbers) exactly like
// product.serializer.js#serializePublicProduct strips costPrice/SKU.
export const serializePublicCollection = (collection) => {
  const plain = typeof collection.toObject === 'function' ? collection.toObject() : collection;

  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    type: plain.type,
    shortDescription: plain.shortDescription,
    description: plain.description,
    faqs: plain.faqs ?? [],
    bannerMedia: serializeMediaRef(plain.bannerMedia),
    mobileBannerMedia: serializeMediaRef(plain.mobileBannerMedia),
    thumbnailMedia: serializeMediaRef(plain.thumbnailMedia),
    promoVideoMedia: serializeMediaRef(plain.promoVideoMedia),
    relatedCollections: (plain.relatedCollections ?? []).map(serializeCollectionRef),
    parentCampaign: serializeCollectionRef(plain.parentCampaign),
    seo: {
      metaTitle: plain.seo?.metaTitle ?? '',
      metaDescription: plain.seo?.metaDescription ?? '',
      metaKeywords: plain.seo?.metaKeywords ?? '',
      canonicalUrl: plain.seo?.canonicalUrl ?? '',
    },
  };
};
