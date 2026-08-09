import { serializeMediaRef } from '../media/media.serializer.js';

const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

export const serializeSupplierNote = (note) => {
  const plain = typeof note.toObject === 'function' ? note.toObject() : note;
  return {
    id: plain._id,
    supplier: plain.supplier?.toString?.() ?? plain.supplier,
    content: plain.content,
    isPrivate: plain.isPrivate,
    isPinned: plain.isPinned,
    attachments: (plain.attachments ?? []).map(serializeMediaRef),
    createdBy: serializeUserRef(plain.createdBy),
    createdAt: plain.createdAt,
  };
};

export const serializeSupplierNoteList = (notes) => notes.map(serializeSupplierNote);
