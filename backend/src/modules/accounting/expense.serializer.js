import { serializeMediaRef } from '../media/media.serializer.js';

const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

export const serializeExpense = (expense) => {
  const plain = typeof expense.toObject === 'function' ? expense.toObject() : expense;
  const category = plain.category;
  return {
    id: plain._id,
    category: category && category.name !== undefined ? { id: category._id.toString(), name: category.name } : category?.toString?.() ?? category,
    amount: plain.amount,
    description: plain.description,
    date: plain.date,
    method: plain.method,
    attachments: (plain.attachments ?? []).map(serializeMediaRef),
    status: plain.status,
    journal: plain.journal?.toString?.() ?? plain.journal,
    submittedBy: serializeUserRef(plain.submittedBy),
    approvedBy: serializeUserRef(plain.approvedBy),
    rejectionReason: plain.rejectionReason,
    createdAt: plain.createdAt,
  };
};

export const serializeExpenseList = (expenses) => expenses.map(serializeExpense);
