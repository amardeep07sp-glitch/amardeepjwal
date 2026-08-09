import mongoose from 'mongoose';

const customerTagSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    color: { type: String, trim: true, default: '#64748b' },
  },
  { timestamps: true }
);

export const CustomerTag = mongoose.model('CustomerTag', customerTagSchema);
