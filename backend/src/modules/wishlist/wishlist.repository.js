import { Wishlist } from './wishlist.model.js';

export const wishlistRepository = {
  findByCustomer(customerId) {
    return Wishlist.find({ customer: customerId }).sort({ createdAt: -1 });
  },

  findOne(customerId, productId, variantId = null) {
    return Wishlist.findOne({ customer: customerId, product: productId, variant: variantId });
  },

  create(data) {
    return Wishlist.create(data);
  },

  deleteOne(customerId, productId, variantId = null) {
    return Wishlist.findOneAndDelete({ customer: customerId, product: productId, variant: variantId });
  },
};
