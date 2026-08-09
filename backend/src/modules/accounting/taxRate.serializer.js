export const serializeTaxRate = (rate) => {
  const plain = typeof rate.toObject === 'function' ? rate.toObject() : rate;
  return {
    id: plain._id,
    name: plain.name,
    rate: plain.rate,
    cgstRate: plain.cgstRate,
    sgstRate: plain.sgstRate,
    igstRate: plain.igstRate,
    isDefault: plain.isDefault,
    active: plain.active,
    createdAt: plain.createdAt,
  };
};

export const serializeTaxRateList = (rates) => rates.map(serializeTaxRate);
