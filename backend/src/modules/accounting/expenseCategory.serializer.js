export const serializeExpenseCategory = (category) => {
  const plain = typeof category.toObject === 'function' ? category.toObject() : category;
  const account = plain.defaultAccount;
  return {
    id: plain._id,
    name: plain.name,
    defaultAccount: account && account.code !== undefined ? { id: account._id.toString(), code: account.code, name: account.name } : account?.toString?.() ?? account,
    active: plain.active,
    createdAt: plain.createdAt,
  };
};

export const serializeExpenseCategoryList = (categories) => categories.map(serializeExpenseCategory);
