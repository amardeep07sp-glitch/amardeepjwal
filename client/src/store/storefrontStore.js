import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cart and Wishlist now each have their own real, backend-persisted state
// (cartStore.js, storefrontApi.js#useMyWishlist) - deliveryLocation here is
// set by lib/deliveryLocation.js's useDeliveryLocation() hook, from either
// the signed-in customer's default address or an on-demand geolocation
// detect, and read by the header's "Deliver to" button.
//
// Persisted to localStorage - without this, a plain in-memory zustand store
// resets to null on every reload, so a guest who just detected their
// location would see "Select location" flash back the moment they
// refreshed the page (a signed-in customer's real address still wins over
// this on every mount anyway, via useDeliveryLocation's own effect - this
// only matters for a guest with no saved address).
export const useStorefrontStore = create(
  persist(
    (set) => ({
      deliveryLocation: null,
      setDeliveryLocation: (deliveryLocation) => set({ deliveryLocation }),
    }),
    { name: 'adsp_delivery_location' }
  )
);
