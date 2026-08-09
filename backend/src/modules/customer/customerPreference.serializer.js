const serializeRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  return { id: ref._id.toString(), name: ref.name, slug: ref.slug };
};

export const serializePreference = (preference) => ({
  customer: preference.customer?.toString?.() ?? preference.customer,
  preferredCategories: (preference.preferredCategories ?? []).map(serializeRef),
  preferredBrands: (preference.preferredBrands ?? []).map(serializeRef),
  metalPreference: preference.metalPreference ?? '',
  purityPreference: preference.purityPreference ?? '',
  budgetMin: preference.budgetMin ?? 0,
  budgetMax: preference.budgetMax ?? 0,
  communicationPreference: preference.communicationPreference ?? { email: true, whatsapp: true, sms: false },
});
