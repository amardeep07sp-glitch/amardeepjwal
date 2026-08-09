import mongoose from 'mongoose';

const customerNoteSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    content: { type: String, required: true, trim: true },
    isPrivate: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

customerNoteSchema.index({ customer: 1, isPinned: -1, createdAt: -1 });

export const CustomerNote = mongoose.model('CustomerNote', customerNoteSchema);
