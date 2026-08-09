import mongoose from 'mongoose';

const customerSegmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true, default: '' },
    color: { type: String, trim: true, default: '#6366f1' },
    // System-seeded segments (Retail/Wholesale/VIP/etc.) can't be deleted -
    // same "protect the defaults" idea as Warehouse's isDefault guard.
    isSystemDefined: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CustomerSegment = mongoose.model('CustomerSegment', customerSegmentSchema);
