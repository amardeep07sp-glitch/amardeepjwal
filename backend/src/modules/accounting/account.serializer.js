const serializeRef = (ref, fields = ['name']) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  const shape = { id: ref._id.toString() };
  fields.forEach((f) => {
    shape[f] = ref[f];
  });
  return shape;
};

export const serializeAccount = (account) => {
  const plain = typeof account.toObject === 'function' ? account.toObject() : account;
  return {
    id: plain._id,
    code: plain.code,
    name: plain.name,
    type: plain.type,
    parent: serializeRef(plain.parent, ['code', 'name']),
    description: plain.description,
    openingBalance: plain.openingBalance,
    currentBalance: plain.currentBalance,
    isSystem: plain.isSystem,
    active: plain.active,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeAccountList = (accounts) => accounts.map(serializeAccount);
