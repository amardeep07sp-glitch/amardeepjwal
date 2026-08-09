import mongoose from 'mongoose';
import { ADDRESS_TYPES } from '../customer/customer.constants.js';

// A customer's saved address book (Phase 8's `customer_addresses`). Orders
// never read this live at display time - order.service.js#confirmOrder
// resolves the chosen Address once and embeds an immutable snapshot on the
// Order (billingAddressSnapshot / shippingAddressSnapshot), so editing or
// deleting an Address here can never alter a placed order. This collection
// only backs the "pick a saved address" convenience during order creation
// and the CRM's own address book.
const addressSchema = new mongoose.Schema(
  {
    // Ref target migrated from User to Customer in Phase 8 - the CRM's
    // Customer is now the live source of truth Addresses belong to, not the
    // auth-only User. See customer.model.js's header comment.
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: { type: String, enum: Object.values(ADDRESS_TYPES), default: ADDRESS_TYPES.SHIPPING },
    label: { type: String, trim: true, default: '' },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: 'India' },
    phone: { type: String, trim: true, default: '' },
    isDefaultBilling: { type: Boolean, default: false },
    isDefaultShipping: { type: Boolean, default: false },
  },
  { timestamps: true }
);

addressSchema.index({ customer: 1, createdAt: -1 });

export const Address = mongoose.model('Address', addressSchema);
