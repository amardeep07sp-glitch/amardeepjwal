import mongoose from 'mongoose';

const supplierNoteSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    content: { type: String, required: true, trim: true },
    isPrivate: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

supplierNoteSchema.index({ supplier: 1, isPinned: -1, createdAt: -1 });

export const SupplierNote = mongoose.model('SupplierNote', supplierNoteSchema);
