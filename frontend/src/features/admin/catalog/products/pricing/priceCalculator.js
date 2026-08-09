// Mirrors backend/src/modules/product/pricing/priceCalculator.js exactly, so
// the UI can show an instant live preview while typing. The backend always
// recalculates authoritatively on save - this is UX sugar only, never the
// value that actually gets persisted.
const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateDiscountAmount({ mrp, discountType, discountValue }) {
  if (discountType === 'percentage') {
    return round2(Math.min(mrp * (discountValue / 100), mrp));
  }
  return round2(Math.min(discountValue, mrp));
}

export function calculatePricePreview({ mrp, discountType, discountValue, taxIncluded, taxPercentage }) {
  const safeMrp = Number(mrp) || 0;
  const safeDiscountValue = Number(discountValue) || 0;
  const safeTaxPercentage = Number(taxPercentage) || 0;

  const discountAmount = calculateDiscountAmount({
    mrp: safeMrp,
    discountType,
    discountValue: safeDiscountValue,
  });
  const priceAfterDiscount = round2(Math.max(safeMrp - discountAmount, 0));

  let taxAmount;
  let finalPrice;

  if (taxIncluded) {
    taxAmount = round2(priceAfterDiscount - priceAfterDiscount / (1 + safeTaxPercentage / 100));
    finalPrice = priceAfterDiscount;
  } else {
    taxAmount = round2(priceAfterDiscount * (safeTaxPercentage / 100));
    finalPrice = round2(priceAfterDiscount + taxAmount);
  }

  const savings = round2(safeMrp - finalPrice);

  return { mrp: round2(safeMrp), discountAmount, priceAfterDiscount, taxAmount, finalPrice, savings };
}
