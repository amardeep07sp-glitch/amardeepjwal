import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { buildCopyName } from '../../utils/copyName.js';
import { CATALOG_STATUSES } from '../../constants/catalog.js';
import { humanizeSlug } from '../../utils/humanizeSlug.js';
import { productRepository } from './product.repository.js';
import { serializeProduct, serializeProductList, serializePublicProduct, serializePublicProductList } from './product.serializer.js';
import { buildSkuPrefix, generateSku } from './sku.generator.js';
import { categoryRepository } from '../category/category.repository.js';
import { brandRepository } from '../brand/brand.repository.js';
import { collectionRepository } from '../collection/collection.repository.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { inventoryRepository } from '../inventory/inventory.repository.js';
import { mediaRepository } from '../media/media.repository.js';
import { MEDIA_ENTITY_TYPES } from '../media/media.constants.js';
import { serializeMediaRef } from '../media/media.serializer.js';
import { variantRepository } from './variant/variant.repository.js';
import { serializePublicVariantList } from './variant/variant.serializer.js';
import { orderItemRepository } from '../order/orderItem.repository.js';

// SKU generation reads the category/brand/collection's skuPrefix, then a
// sequence number derived from how many products already share that prefix.
// Concurrency note: this is a count-then-format approach, not an atomic
// counter collection - fine for an admin panel's write volume (SKU's own
// unique index makes a rare collision a clean, retryable 409, not silent
// corruption), but would need a real atomic sequence if product creation
// ever became high-concurrency (e.g. bulk import - see StockAdjustment/
// import-export notes).
async function generateProductSku({ category, brand, collectionId }) {
  const [categoryDoc, brandDoc, collectionDoc] = await Promise.all([
    category ? categoryRepository.findById(category) : null,
    brand ? brandRepository.findById(brand) : null,
    collectionId ? collectionRepository.findById(collectionId) : null,
  ]);

  const prefix = buildSkuPrefix({
    categoryPrefix: categoryDoc?.skuPrefix,
    brandPrefix: brandDoc?.skuPrefix,
    collectionPrefix: collectionDoc?.skuPrefix,
  });
  const existingCount = await productRepository.countByPrefix(prefix);
  return generateSku(prefix, existingCount + 1);
}

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Shared by every public list read - one image + one stock lookup batched
// across the whole page instead of N+1 queries per product.
async function buildPublicProductList(products) {
  if (products.length === 0) return [];

  const ids = products.map((p) => p._id);
  const [images, stock] = await Promise.all([
    mediaRepository.findPrimaryByEntityIds(MEDIA_ENTITY_TYPES.PRODUCT, ids),
    inventoryRepository.getAvailableQuantityByProductIds(ids),
  ]);
  const imagesById = new Map(images.map((row) => [row._id.toString(), row.doc]));
  const stockByProductId = new Map(stock.map((row) => [row._id.toString(), row.totalAvailable]));

  return serializePublicProductList(products, imagesById, stockByProductId);
}

export const productService = {
  // Preview only - the real SKU is (re-)derived fresh at actual create time,
  // so this never "reserves" a number, it just shows the admin what to
  // expect while filling out the form.
  previewNextSku(query) {
    return generateProductSku(query);
  },

  // Exposed so other modules' public reads (Collection Engine v2.0's
  // resolveCollectionProducts) get the exact same batched image+stock
  // resolution every product list read here already uses, instead of
  // duplicating the N+1-avoidance logic.
  buildPublicProductList,

  async listProducts(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await productRepository.findPaginated({ page, limit, ...filters });
    return { items: serializeProductList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) throw new ApiError(404, 'Product not found');
    return serializeProduct(product);
  },

  async createProduct(data) {
    const sku = data.sku || (await generateProductSku(data));

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const product = await productRepository.create({ ...data, sku }, session);
      await inventoryService.provisionForProduct(product, session);
      await categoryRepository.incrementProductCount(product.category, 1, session);
      await session.commitTransaction();
      return serializeProduct(product);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async updateProduct(id, data) {
    // SKU changes never go through this path - see overrideSku for the
    // dedicated, super-admin-only, explicitly-flagged route.
    const { sku, ...rest } = data;
    const previous = await productRepository.findRawById(id);
    if (!previous) throw new ApiError(404, 'Product not found');

    const product = await productRepository.updateById(id, rest);
    if (!product) throw new ApiError(404, 'Product not found');

    // Category re-assignment moves the denormalized count, not just changes
    // a field - keep both categories' productCount accurate.
    if (rest.category !== undefined && rest.category !== previous.category?.toString()) {
      await categoryRepository.incrementProductCount(previous.category, -1);
      await categoryRepository.incrementProductCount(product.category, 1);
    }

    return serializeProduct(product);
  },

  // The one and only door through which an existing product's SKU can
  // change after creation - see product.model.js#guardSkuImmutability.
  async overrideSku(id, newSku) {
    const product = await productRepository.updateById(id, { sku: newSku }, { allowSkuChange: true });
    if (!product) throw new ApiError(404, 'Product not found');
    return serializeProduct(product);
  },

  // NOTE: guards against deleting a product referenced by Inventory/Orders
  // will be added once those modules exist. Product Core has no dependents yet.
  async deleteProduct(id) {
    const product = await productRepository.deleteById(id);
    if (!product) throw new ApiError(404, 'Product not found');
    await categoryRepository.incrementProductCount(product.category, -1);
    return product;
  },

  async bulkDelete(ids) {
    const counts = await productRepository.countsByCategoryForIds(ids);
    await productRepository.deleteByIds(ids);
    await Promise.all(counts.map(({ _id, count }) => categoryRepository.incrementProductCount(_id, -count)));
  },

  async bulkUpdateStatus(ids, status) {
    await productRepository.updateManyStatus(ids, status);
  },

  async duplicateProduct(id) {
    const original = await productRepository.findRawById(id);
    if (!original) throw new ApiError(404, 'Product not found');

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const copy = await productRepository.create(
        {
          name: buildCopyName(original.name),
          sku: `${original.sku}-COPY-${Date.now()}`,
          shortDescription: original.shortDescription,
          description: original.description,
          status: CATALOG_STATUSES.DRAFT,
          isFeatured: false,
          isVisible: original.isVisible,
          order: original.order,
          category: original.category,
          brand: original.brand,
          collectionId: original.collectionId,
          attributeGroups: original.attributeGroups,
          tags: original.tags,
          searchKeywords: original.searchKeywords,
          seo: original.seo,
        },
        session
      );
      await inventoryService.provisionForProduct(copy, session);
      await categoryRepository.incrementProductCount(copy.category, 1, session);
      await session.commitTransaction();
      return productService.getProductById(copy._id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // --- Public storefront reads (published + visible only) -----------------

  // The general-purpose listing read - "New Arrivals" as a full page, a
  // category page, the Offers page, and the All Products page's filter
  // sidebar all call this, differing only in which filters they pass.
  // Category filters are slugs (public URLs never expose ids) - an
  // unknown/empty-after-resolving slug list returns an empty page, not a
  // 404, since "no products match" and "category doesn't exist" look the
  // same to a shopper here.
  async listPublicProducts({ page, limit, category, categories, brand, brands, tags, minPrice, maxPrice, sortBy, onSale, gender, occasion, search }) {
    const slugs = categories?.length ? categories : category ? [category] : [];
    let categoryIds;
    if (slugs.length) {
      const categoryDocs = await Promise.all(slugs.map((slug) => categoryRepository.findPublicBySlug(slug)));
      categoryIds = categoryDocs.filter(Boolean).map((doc) => doc._id);
      if (categoryIds.length === 0) return { items: [], meta: buildPaginationMeta(page, limit, 0) };
    }

    const brandSlugs = brands?.length ? brands : brand ? [brand] : [];
    let brandIds;
    if (brandSlugs.length) {
      const brandDocs = await Promise.all(brandSlugs.map((slug) => brandRepository.findPublicBySlug(slug)));
      brandIds = brandDocs.filter(Boolean).map((doc) => doc._id);
      if (brandIds.length === 0) return { items: [], meta: buildPaginationMeta(page, limit, 0) };
    }

    const { items, total } = await productRepository.findPublicPaginated({
      page,
      limit,
      categoryIds,
      brandIds,
      tags,
      minPrice,
      maxPrice,
      sortBy,
      onSale,
      gender,
      occasion,
      search,
    });
    return { items: await buildPublicProductList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  // The header search bar's live-typing dropdown - products (own
  // autocomplete, see product.repository.js#searchAutocomplete) and
  // categories (reusing categoryRepository's existing admin-picker
  // autocomplete - same real name-match query, just surfaced to a public
  // route here) side by side, so "necklace" suggests both the Necklaces
  // category and any product actually named that.
  async searchSuggestions({ q, limit }) {
    const [products, categories] = await Promise.all([
      productRepository.searchAutocomplete(q, limit),
      categoryRepository.searchAutocomplete(q, Math.min(limit, 4)),
    ]);

    const ids = products.map((p) => p._id);
    const imagesById = ids.length
      ? new Map(
          (await mediaRepository.findPrimaryByEntityIds(MEDIA_ENTITY_TYPES.PRODUCT, ids)).map((row) => [
            row._id.toString(),
            row.doc,
          ])
        )
      : new Map();

    return {
      products: products.map((p) => ({
        id: p._id,
        name: p.name,
        slug: p.slug,
        image: serializeMediaRef(imagesById.get(p._id.toString())),
        price: { finalPrice: p.pricing?.finalPrice ?? 0 },
      })),
      categories: categories.map((c) => ({ id: c._id, name: c.name, slug: c.slug })),
    };
  },

  // The "All Products" page's filter sidebar data - real counts/bounds,
  // not the arbitrary numbers a mockup shows. Global, not narrowed by
  // whatever filters are currently applied (a defensible v1 - narrowing
  // facets by the current selection is a real future refinement).
  async getPublicFacets() {
    const [{ items: categoryDocs }, countsById, priceRange, tagRows, genderRows, occasionRows, brandCountRows, brandDocs] =
      await Promise.all([
        categoryRepository.findPublicPaginated({ page: 1, limit: 100 }),
        categoryRepository.getSubtreeProductCounts(),
        productRepository.getPublicPriceRange(),
        productRepository.getPublicTagCounts(),
        productRepository.getPublicGenderCounts(),
        productRepository.getPublicOccasionCounts(),
        productRepository.getPublicBrandCounts(),
        brandRepository.findAllPublicIds(),
      ]);

    const categoryFacets = categoryDocs
      .map((cat) => ({
        id: cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
        productCount: countsById.get(cat._id.toString()) ?? cat.productCount ?? 0,
      }))
      .filter((cat) => cat.productCount > 0);

    // Real product counts (brandCountRows, keyed by brand id) joined
    // against the real brand docs for name/slug - a brand with 0 matching
    // products is filtered out, same "never show an empty facet" rule
    // categories/tags already follow.
    const brandCountById = new Map(brandCountRows.map((row) => [row._id.toString(), row.count]));
    const brandFacets = brandDocs
      .map((b) => ({ id: b._id.toString(), name: b.name, slug: b.slug, productCount: brandCountById.get(b._id.toString()) ?? 0 }))
      .filter((b) => b.productCount > 0)
      .sort((a, b) => b.productCount - a.productCount);

    return {
      categories: categoryFacets,
      brands: brandFacets,
      priceRange,
      tags: tagRows.map((row) => ({ tag: row._id, count: row.count })),
      genders: genderRows.map((row) => ({ value: row._id, label: humanizeSlug(row._id), count: row.count })),
      occasions: occasionRows.map((row) => ({ value: row._id, label: humanizeSlug(row._id), count: row.count })),
    };
  },

  async getPublicNewArrivals(limit) {
    const products = await productRepository.findPublicNewArrivals(limit);
    return buildPublicProductList(products);
  },

  async getPublicFeatured(limit) {
    const products = await productRepository.findPublicFeatured(limit);
    return buildPublicProductList(products);
  },

  // "Trending Now" - real units sold in the last 30 days (cancelled items
  // excluded), the same getTrendingProductIds a merchandiser would trust
  // for Collection Engine v2.0's own Best Selling sort, just unscoped and
  // date-windowed here. A store with fewer than `limit` products that have
  // actually sold recently (most likely: a brand-new store) gets the
  // remaining slots backfilled from isFeatured products instead of ever
  // padding the list with an invented "trending" number - same real-data
  // discipline as getPublicFacets.
  async getPublicTrending(limit) {
    const sinceDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const ranked = await orderItemRepository.getTrendingProductIds({ limit, sinceDate });
    const rankedIds = ranked.map((row) => String(row._id));

    const rankedProducts = rankedIds.length ? await productRepository.findPublicByIds(rankedIds) : [];
    const rankedById = new Map(rankedProducts.map((p) => [String(p._id), p]));
    // findPublicByIds also drops any id that's no longer published/visible -
    // re-derive the id order from what actually came back, not the raw
    // ranked list, so a since-unpublished product can't leave a gap.
    const orderedRanked = rankedIds.map((id) => rankedById.get(id)).filter(Boolean);

    let products = orderedRanked;
    if (products.length < limit) {
      const featured = await productRepository.findPublicFeatured(limit);
      const seen = new Set(products.map((p) => String(p._id)));
      const backfill = featured.filter((p) => !seen.has(String(p._id)));
      products = [...products, ...backfill].slice(0, limit);
    }

    return buildPublicProductList(products);
  },

  async getPublicProductBySlug(slug) {
    const product = await productRepository.findPublicBySlug(slug);
    if (!product) throw new ApiError(404, 'Product not found');

    // One gallery query covers both `image` (cover, i.e. images[0] - the
    // gallery is already sorted cover-first) and `images` (the full set) -
    // no need for the separate single-image aggregate the list reads use.
    const [images, stock, variants] = await Promise.all([
      mediaRepository.findPublicGalleryByEntity(MEDIA_ENTITY_TYPES.PRODUCT, product._id),
      inventoryRepository.getAvailableQuantityByProductIds([product._id]),
      variantRepository.findPublicByProduct(product._id),
    ]);

    // Most products have none yet (Variants are opt-in) - only pay for the
    // per-variant stock lookup when there's actually something to look up.
    const variantStock = variants.length
      ? await inventoryRepository.getAvailableQuantityByVariantIds(variants.map((v) => v._id))
      : [];
    const stockByVariantId = new Map(variantStock.map((row) => [row._id.toString(), row.totalAvailable]));

    return serializePublicProduct(product, {
      image: images[0] ?? null,
      images,
      stockQuantity: stock[0]?.totalAvailable ?? 0,
      variants: serializePublicVariantList(variants, stockByVariantId),
    });
  },

  // "You may also like" - same category as the given product, itself
  // excluded. Returns [] (not a 404) for an unknown/unpublished slug - a
  // similar-products strip failing to load is not worth erroring the PDP.
  async getPublicSimilarProducts(slug, limit) {
    const product = await productRepository.findPublicBySlug(slug);
    if (!product) return [];

    const products = await productRepository.findPublicSimilar(product.category, product._id, limit);
    return buildPublicProductList(products);
  },
};
