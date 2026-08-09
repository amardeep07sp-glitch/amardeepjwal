import mongoose from 'mongoose';
import { ACTIVE_STATUSES } from '../../constants/catalog.js';

const attributeValueSchema = new mongoose.Schema(
  {
    attribute: { type: mongoose.Schema.Types.ObjectId, ref: 'Attribute', required: true, index: true },
    value: { type: String, required: true, trim: true },
    hexColor: { type: String, trim: true, default: '' },
    imageUrl: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
    status: { type: String, enum: Object.values(ACTIVE_STATUSES), default: ACTIVE_STATUSES.ACTIVE, index: true },
  },
  { timestamps: true }
);

export const AttributeValue = mongoose.model('AttributeValue', attributeValueSchema);
