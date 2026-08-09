import mongoose from 'mongoose';
import { ApiError } from '../../../utils/ApiError.js';
import { slugify } from '../../../utils/slugify.js';
import { CATALOG_STATUSES } from '../../../constants/catalog.js';
import { productRepository } from '../product.repository.js';
import { attributeRepository } from '../../attribute/attribute.repository.js';
import { attributeValueRepository } from '../../attributeValue/attributeValue.repository.js';
import { inventoryService } from '../../inventory/inventory.service.js';
import { variantRepository } from './variant.repository.js';
import { buildCombinationKey, generateAttributeCombinations } from './variant.combination.js';
import { serializeVariant, serializeVariantList } from './variant.serializer.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

const assertProductExists = async (productId) => {
  const product = await productRepository.findRawById(productId);
  if (!product) throw new ApiError(404, 'Product not found');
  return product;
};

// Confirms every {attribute, value} pair is internally consistent - i.e. the
// value actually belongs to the attribute it's claimed to belong to.
const assertAttributesValid = async (attributes) => {
  for (const pair of attributes) {
    // eslint-disable-next-line no-await-in-loop
    const value = await attributeValueRepository.findById(pair.value);
    if (!value) throw new ApiError(400, `Attribute value "${pair.value}" does not exist`);
    if (value.attribute.toString() !== pair.attribute) {
      throw new ApiError(400, `Value "${value.value}" does not belong to the given attribute`);
    }
  }
};

const assertNoDuplicateCombination = async (productId, attributes, excludeVariantId = null) => {
  if (!attributes || attributes.length === 0) return;
  const key = buildCombinationKey(attributes);
  const existing = await variantRepository.findByCombinationKey(productId, key);
  if (existing && existing._id.toString() !== excludeVariantId) {
    throw new ApiError(409, 'A variant with this exact attribute combination already exists');
  }
};

// A product with at least one variant must always have exactly one default.
// Called after any delete so we never leave the product without one.
const ensureDefaultExists = async (productId) => {
  const hasDefault = await variantRepository.findDefaultByProduct(productId);
  if (hasDefault) return;
  const first = await variantRepository.findFirstByProduct(productId);
  if (first) await variantRepository.setDefault(first._id);
};

export const variantService = {
  async listVariants(productId, query) {
    await assertProductExists(productId);
    const { page, limit, ...filters } = query;
    const { items, total } = await variantRepository.findPaginatedByProduct(productId, { page, limit, ...filters });
    return { items: serializeVariantList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  async getVariantById(productId, variantId) {
    const variant = await variantRepository.findById(variantId);
    if (!variant || variant.product.toString() !== productId) throw new ApiError(404, 'Variant not found');
    return serializeVariant(variant);
  },

  async createVariant(productId, data) {
    await assertProductExists(productId);
    if (data.attributes?.length) {
      await assertAttributesValid(data.attributes);
      await assertNoDuplicateCombination(productId, data.attributes);
    }

    const isFirstVariant = (await variantRepository.countByProduct(productId)) === 0;

    const session = await mongoose.startSession();
    session.startTransaction();
    let created;
    try {
      created = await variantRepository.create(
        {
          ...data,
          product: productId,
          isDefault: isFirstVariant ? true : Boolean(data.isDefault),
        },
        session
      );
      await inventoryService.provisionForVariants([created], productId, session);

      if (!isFirstVariant && data.isDefault) {
        await variantRepository.unsetDefaultForProduct(productId, created._id);
      }
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return serializeVariant(await variantRepository.findById(created._id));
  },

  async updateVariant(productId, variantId, data) {
    const current = await variantRepository.findRawById(variantId);
    if (!current || current.product.toString() !== productId) throw new ApiError(404, 'Variant not found');

    if (data.attributes) {
      await assertAttributesValid(data.attributes);
      await assertNoDuplicateCombination(productId, data.attributes, variantId);
    }

    const variant = await variantRepository.updateById(variantId, data);

    if (data.isDefault === true) {
      await variantRepository.unsetDefaultForProduct(productId, variantId);
    } else if (data.isDefault === false) {
      await ensureDefaultExists(productId);
    }

    return serializeVariant(variant);
  },

  async deleteVariant(productId, variantId) {
    const variant = await variantRepository.findRawById(variantId);
    if (!variant || variant.product.toString() !== productId) throw new ApiError(404, 'Variant not found');

    await variantRepository.deleteById(variantId);
    await ensureDefaultExists(productId);
  },

  async bulkDelete(productId, ids) {
    await variantRepository.deleteByIds(ids);
    await ensureDefaultExists(productId);
  },

  async bulkUpdateStatus(ids, status) {
    await variantRepository.updateManyStatus(ids, status);
  },

  // A variant's identity IS its attribute combination, which must stay
  // unique per product - so a duplicate cannot carry over the same
  // combination. It's created with no attributes assigned; the admin must
  // pick a distinct combination before it becomes usable.
  async bulkDuplicate(productId, ids) {
    const originals = await Promise.all(ids.map((id) => variantRepository.findRawById(id)));
    const copies = originals
      .filter(Boolean)
      .map((original, index) => ({
        product: productId,
        sku: `${original.sku}-COPY-${Date.now()}-${index}`,
        status: CATALOG_STATUSES.DRAFT,
        isVisible: original.isVisible,
        order: original.order,
        priceOverride: original.priceOverride,
        weightOverride: original.weightOverride,
        isFeatured: false,
        isDefault: false,
        attributes: [],
      }));

    if (copies.length === 0) return [];

    const session = await mongoose.startSession();
    session.startTransaction();
    let created;
    try {
      created = await variantRepository.insertMany(copies, session);
      await inventoryService.provisionForVariants(created, productId, session);
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return serializeVariantList(created);
  },

  // The core "do not make the admin create every variant by hand" feature.
  // Takes { attributes: [{ attributeId, valueIds }] }, computes the full
  // cartesian product, and creates only the combinations that don't already
  // exist for this product (safe to re-run).
  async generateVariants(productId, { attributes, skuPrefix }) {
    const product = await assertProductExists(productId);

    for (const group of attributes) {
      // eslint-disable-next-line no-await-in-loop
      const attribute = await attributeRepository.findById(group.attributeId);
      if (!attribute) throw new ApiError(400, `Attribute "${group.attributeId}" does not exist`);
    }

    const combinations = generateAttributeCombinations(
      attributes.map((group) => ({ attributeId: group.attributeId, valueIds: group.valueIds }))
    );
    const keyed = combinations.map((combo) => ({ combo, key: buildCombinationKey(combo) }));

    const existingKeys = await variantRepository.findExistingCombinationKeys(
      productId,
      keyed.map((k) => k.key)
    );
    const newOnes = keyed.filter((k) => !existingKeys.has(k.key));

    if (newOnes.length === 0) {
      return { created: [], skippedCount: keyed.length };
    }

    const allValueIds = [...new Set(newOnes.flatMap((k) => k.combo.map((pair) => pair.value)))];
    const values = await Promise.all(allValueIds.map((id) => attributeValueRepository.findById(id)));
    const labelById = new Map(values.filter(Boolean).map((v) => [v._id.toString(), v.value]));

    const alreadyHasVariants = (await variantRepository.countByProduct(productId)) > 0;
    const prefix = skuPrefix?.trim() || product.sku;

    const docs = newOnes.map(({ combo }, index) => {
      const suffix = combo.map((pair) => slugify(labelById.get(pair.value.toString()) ?? '').toUpperCase()).join('-');
      return {
        product: productId,
        sku: `${prefix}-${suffix}`,
        attributes: combo,
        status: CATALOG_STATUSES.DRAFT,
        isDefault: !alreadyHasVariants && index === 0,
      };
    });

    const session = await mongoose.startSession();
    session.startTransaction();
    let created;
    try {
      created = await variantRepository.insertMany(docs, session);
      await inventoryService.provisionForVariants(created, productId, session);
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    return { created: serializeVariantList(created), skippedCount: keyed.length - newOnes.length };
  },
};
