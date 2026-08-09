import { create } from 'zustand';

// Cart and Wishlist now each have their own real, backend-persisted state
// (cartStore.js, storefrontApi.js#useMyWishlist) - all that's left here is
// the delivery-location shell Header still reads.
export const useStorefrontStore = create((set) => ({
  deliveryLocation: null,
  setDeliveryLocation: (deliveryLocation) => set({ deliveryLocation }),
}));
