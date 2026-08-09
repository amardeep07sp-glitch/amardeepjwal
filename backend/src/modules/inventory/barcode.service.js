import { ApiError } from '../../utils/ApiError.js';
import { barcodeRepository } from './barcode.repository.js';
import { inventoryRepository } from './inventory.repository.js';
import { generateBarcodeValue, isValidBarcodeValue } from './barcode.generator.js';
import { BARCODE_STATUSES } from './inventory.constants.js';

export const barcodeService = {
  listBarcodes(query) {
    return barcodeRepository.findPaginated(query);
  },

  async getBarcodeById(id) {
    const barcode = await barcodeRepository.findById(id);
    if (!barcode) throw new ApiError(404, 'Barcode not found');
    return barcode;
  },

  // "Never duplicate active barcode" - if one already exists for this
  // product/variant, this returns it rather than creating a second one.
  // Use regenerate() to deliberately replace an existing active barcode.
  async generateBarcode({ productId, variantId, barcodeType, manualValue }) {
    const existing = await barcodeRepository.findActiveForEntity(productId, variantId);
    if (existing) {
      throw new ApiError(409, 'An active barcode already exists for this product/variant. Use regenerate instead.');
    }

    const value = manualValue || (await this.generateUniqueValue(barcodeType));
    if (manualValue && !isValidBarcodeValue(barcodeType, manualValue)) {
      throw new ApiError(400, `"${manualValue}" is not a valid ${barcodeType.toUpperCase()} value`);
    }

    return barcodeRepository.create({
      barcodeValue: value,
      barcodeType,
      product: productId ?? null,
      variant: variantId ?? null,
    });
  },

  // Retries on the rare sequence collision (see product SKU generation's
  // same count-then-format caveat) rather than assuming the first attempt
  // is always free.
  async generateUniqueValue(barcodeType) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const count = await barcodeRepository.countByType(barcodeType);
      const value = generateBarcodeValue(barcodeType, count + 1 + attempt);
      // eslint-disable-next-line no-await-in-loop
      const collision = await barcodeRepository.findByValue(value);
      if (!collision) return value;
    }
    throw new ApiError(500, 'Could not generate a unique barcode value, please try again');
  },

  // Old barcode is set inactive, never deleted (DELETE RULES: a barcode can
  // never be removed while referenced) - a new active one takes its place.
  async regenerateBarcode({ productId, variantId, barcodeType }) {
    const existing = await barcodeRepository.findActiveForEntity(productId, variantId);
    if (existing) {
      await barcodeRepository.updateById(existing._id, { status: BARCODE_STATUSES.INACTIVE });
    }

    const value = await this.generateUniqueValue(barcodeType);
    return barcodeRepository.create({
      barcodeValue: value,
      barcodeType,
      product: productId ?? null,
      variant: variantId ?? null,
    });
  },

  // DELETE RULE: a barcode referenced by any Inventory record cannot be
  // removed - unlink it from Inventory first.
  async deleteBarcode(id) {
    const barcode = await barcodeRepository.findById(id);
    if (!barcode) throw new ApiError(404, 'Barcode not found');

    const referencedCount = await inventoryRepository.countByBarcode(id);
    if (referencedCount) {
      throw new ApiError(409, 'Cannot delete a barcode that is still referenced by an inventory record');
    }

    await barcodeRepository.deleteById(id);
  },
};
