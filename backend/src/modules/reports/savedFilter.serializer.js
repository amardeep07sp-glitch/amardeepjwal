export const serializeSavedFilter = (filter) => {
  const plain = typeof filter.toObject === 'function' ? filter.toObject() : filter;
  return {
    id: plain._id,
    name: plain.name,
    reportKey: plain.reportKey,
    filters: plain.filters,
    createdAt: plain.createdAt,
  };
};

export const serializeSavedFilterList = (filters) => filters.map(serializeSavedFilter);
