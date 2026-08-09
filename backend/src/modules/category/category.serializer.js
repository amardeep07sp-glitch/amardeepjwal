import { env } from '../../config/env.js';
import { serializeMediaRef } from '../media/media.serializer.js';

const serializeUserRef = (ref) => {
  if (!ref) return null;
  return typeof ref === 'string' ? ref : ref.toString();
};

// JSON-LD (schema.org) markup for the storefront to drop straight into a
// <script type="application/ld+json"> tag - the actual SEO win Google reads.
const buildSchemaMarkup = (plain, canonicalUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: plain.seo?.metaTitle || plain.name,
  description: plain.seo?.metaDescription || plain.shortDescription || plain.description || undefined,
  url: canonicalUrl,
});

// `ref` is either a populated document ({ _id, name, slug }), a raw
// (unpopulated) ObjectId, or a plain id string - normalize all three.
const serializeRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, slug: ref.slug };
  return ref.toString();
};

// Fields every audience (admin and storefront) sees the same way - identity,
// hierarchy, media, curation flags, and SEO. Admin-only fields (soft-delete
// state, who created/changed it, raw view/click counters) are layered on top
// by serializeCategory; the storefront never gets those.
const buildSharedFields = (plain, recursiveProductCount) => {
  const canonicalUrl = plain.seo?.canonicalUrl || `${env.SITE_URL}/category/${plain.slug}`;

  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description,
    shortDescription: plain.shortDescription,
    parent: serializeRef(plain.parent),
    ancestors: (plain.ancestors ?? []).map(serializeRef),
    depth: plain.ancestors?.length ?? 0,
    productCount: plain.productCount ?? 0,
    // Own products plus every descendant category's - only filled in when
    // the caller passed a counts map (see serializeCategoryList/Tree below);
    // falls back to the direct count otherwise rather than lying with a 0.
    productCountRecursive: recursiveProductCount ?? plain.productCount ?? 0,
    iconMedia: serializeMediaRef(plain.iconMedia),
    bannerMedia: serializeMediaRef(plain.bannerMedia),
    thumbnailMedia: serializeMediaRef(plain.thumbnailMedia),
    isFeatured: plain.isFeatured,
    showInNavbar: plain.showInNavbar,
    showOnHomepage: plain.showOnHomepage,
    order: plain.order,
    seo: {
      metaTitle: plain.seo?.metaTitle ?? '',
      metaDescription: plain.seo?.metaDescription ?? '',
      metaKeywords: plain.seo?.metaKeywords ?? '',
      canonicalUrl,
      ogImageMedia: serializeMediaRef(plain.seo?.ogImageMedia),
      schemaMarkup: buildSchemaMarkup(plain, canonicalUrl),
    },
  };
};

export const serializeCategory = (category, { recursiveProductCount } = {}) => {
  const plain = typeof category.toObject === 'function' ? category.toObject() : category;

  return {
    ...buildSharedFields(plain, recursiveProductCount),
    skuPrefix: plain.skuPrefix,
    status: plain.status,
    isVisible: plain.isVisible,
    viewCount: plain.viewCount ?? 0,
    clickCount: plain.clickCount ?? 0,
    isDeleted: plain.isDeleted ?? false,
    deletedAt: plain.deletedAt ?? null,
    deletedBy: serializeUserRef(plain.deletedBy),
    createdBy: serializeUserRef(plain.createdBy),
    updatedBy: serializeUserRef(plain.updatedBy),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

// What the storefront is allowed to see - no soft-delete/audit trail, no SKU
// prefix (an internal SKU-generation detail), no raw view/click counters.
export const serializePublicCategory = (category, options = {}) => {
  const plain = typeof category.toObject === 'function' ? category.toObject() : category;
  return buildSharedFields(plain, options.recursiveProductCount);
};

// `countsById` is the Map from categoryRepository.getSubtreeProductCounts -
// optional so callers that don't need the recursive count (e.g. a quick
// autocomplete-adjacent lookup) can skip that extra query.
export const serializeCategoryList = (categories, countsById) =>
  categories.map((category) =>
    serializeCategory(category, { recursiveProductCount: countsById?.get(category._id.toString()) })
  );

export const serializePublicCategoryList = (categories, countsById) =>
  categories.map((category) =>
    serializePublicCategory(category, { recursiveProductCount: countsById?.get(category._id.toString()) })
  );

// Lightweight shape for autocomplete/typeahead results - just enough to
// display and pick a category, not the full serializeCategory payload.
export const serializeCategoryOption = (category) => ({
  id: category._id.toString(),
  name: category.name,
  slug: category.slug,
  parentName: category.parent?.name ?? null,
});

export const serializeCategoryOptionList = (categories) => categories.map(serializeCategoryOption);

// Builds a nested tree from a flat list. O(n) via a single id->node map pass.
// `serializeNode` is swappable so the admin tree (serializeCategory) and the
// public tree (serializePublicCategory) share this exact same shaping logic.
const buildTree = (categories, serializeNode, countsById) => {
  const nodesById = new Map();
  const roots = [];

  categories.forEach((category) => {
    const recursiveProductCount = countsById?.get(category._id.toString());
    nodesById.set(category._id.toString(), { ...serializeNode(category, { recursiveProductCount }), children: [] });
  });

  nodesById.forEach((node) => {
    const parentId = typeof node.parent === 'string' ? node.parent : node.parent?.id;
    if (parentId && nodesById.has(parentId)) {
      nodesById.get(parentId).children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
};

export const serializeCategoryTree = (categories, countsById) => buildTree(categories, serializeCategory, countsById);

export const serializePublicCategoryTree = (categories, countsById) =>
  buildTree(categories, serializePublicCategory, countsById);
