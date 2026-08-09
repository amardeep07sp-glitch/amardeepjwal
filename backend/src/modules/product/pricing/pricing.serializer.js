export const serializePricing = (pricing, preview) => ({
  costPrice: pricing.costPrice,
  sellingPrice: pricing.sellingPrice,
  mrp: pricing.mrp,
  discountType: pricing.discountType,
  discountValue: pricing.discountValue,
  finalPrice: pricing.finalPrice,
  taxIncluded: pricing.taxIncluded,
  taxPercentage: pricing.taxPercentage,
  currency: pricing.currency,
  priceStatus: pricing.priceStatus,

  makingCharges: pricing.makingCharges,
  makingChargeType: pricing.makingChargeType,
  wastagePercentage: pricing.wastagePercentage,
  goldRateSnapshot: pricing.goldRateSnapshot,
  silverRateSnapshot: pricing.silverRateSnapshot,
  stoneCost: pricing.stoneCost,
  diamondCost: pricing.diamondCost,
  labourCost: pricing.labourCost,

  preview: {
    mrp: preview.mrp,
    discountAmount: preview.discountAmount,
    priceAfterDiscount: preview.priceAfterDiscount,
    taxAmount: preview.taxAmount,
    finalPrice: preview.finalPrice,
    savings: preview.savings,
  },
});

const serializeUpdatedBy = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, email: ref.email };
  return ref.toString();
};

export const serializePriceHistoryEntry = (entry) => {
  const plain = typeof entry.toObject === 'function' ? entry.toObject() : entry;

  return {
    id: plain._id,
    product: plain.product?.toString?.() ?? plain.product,
    oldPrice: plain.oldPrice,
    newPrice: plain.newPrice,
    updatedBy: serializeUpdatedBy(plain.updatedBy),
    reason: plain.reason,
    createdAt: plain.createdAt,
  };
};

export const serializePriceHistoryList = (entries) => entries.map(serializePriceHistoryEntry);
