import mongoose from 'mongoose';
import { NAVBAR_ITEM_TYPES } from '../../constants/cms.js';

const navbarItemSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(NAVBAR_ITEM_TYPES), default: NAVBAR_ITEM_TYPES.CUSTOM_LINK },
    url: { type: String, trim: true, default: '' },
    page: { type: mongoose.Schema.Types.ObjectId, ref: 'Page', default: null },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'NavbarItem', default: null },
    order: { type: Number, default: 0 },
    openInNewTab: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const NavbarItem = mongoose.model('NavbarItem', navbarItemSchema);
