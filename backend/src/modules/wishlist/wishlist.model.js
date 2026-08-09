import mongoose from 'mongoose';

// One document per (customer, product[, variant]) favorite - mirrors
// Address's one-doc-per-item pattern rather than an array embedded on
// Customer, so adding/removing a single favorite is one atomic write, not
// a read-modify-write of a growing array.
const wishlistSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null },
  },
  { timestamps: true }
);

// Same product favorited twice by the same customer is a no-op, not a
// duplicate row - enforced at the database level, not just in service code.
wishlistSchema.index({ customer: 1, product: 1, variant: 1 }, { unique: true });

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);
