import { Barcode } from './barcode.model.js';

export const barcodeRepository = {
  async findPaginated({ page, limit, status, barcodeType, search }) {
    const filter = {};
    if (status) filter.status = status;
    if (barcodeType) filter.barcodeType = barcodeType;
    if (search) filter.barcodeValue = { $regex: search, $options: 'i' };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Barcode.find(filter)
        .populate('product', 'name sku')
        .populate('variant', 'sku')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Barcode.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return Barcode.findById(id).populate('product', 'name sku').populate('variant', 'sku');
  },

  findByValue(barcodeValue) {
    return Barcode.findOne({ barcodeValue });
  },

  findActiveForEntity(productId, variantId) {
    return Barcode.findOne({ product: productId ?? null, variant: variantId ?? null, status: 'active' });
  },

  countByType(barcodeType) {
    return Barcode.countDocuments({ barcodeType });
  },

  create(data) {
    return Barcode.create(data);
  },

  async updateById(id, data) {
    const existing = await Barcode.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return Barcode.findByIdAndDelete(id);
  },
};
