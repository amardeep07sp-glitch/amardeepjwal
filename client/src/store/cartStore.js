import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Real cart persistence (localStorage, survives a reload/closed tab) -
// there's no backend Cart model (deliberately - see checkout flow's own
// notes), so this IS the cart's source of truth until checkout, when its
// items become the real, server-priced Order line items
// (storefrontApi.js#useCheckout). A stored item's `price`/`name`/`image`
// are a snapshot from when it was added, good enough for the mini-cart
// badge and an optimistic render - CartPage itself re-fetches each
// product live to show current price/stock and never trusts the stored
// snapshot for anything that affects money.
const identify = (productId, variantId) => `${productId}:${variantId ?? ''}`;

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      // { code, discountAmount } once verified via storefrontApi.js#useApplyCoupon
      // on the cart page - carried through to CheckoutPage's own payload,
      // which re-validates it server-side against the real order subtotal
      // before it ever affects what's charged (see storefront.service.js#checkout).
      appliedCoupon: null,

      setAppliedCoupon: (appliedCoupon) => set({ appliedCoupon }),
      clearAppliedCoupon: () => set({ appliedCoupon: null }),

      addItem: ({ productId, variantId = null, slug, name, image, price, quantity = 1 }) =>
        set((state) => {
          const key = identify(productId, variantId);
          const existing = state.items.find((i) => identify(i.productId, i.variantId) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                identify(i.productId, i.variantId) === key ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { productId, variantId, slug, name, image, price, quantity }] };
        }),

      removeItem: (productId, variantId = null) =>
        set((state) => ({
          items: state.items.filter((i) => identify(i.productId, i.variantId) !== identify(productId, variantId)),
        })),

      setQuantity: (productId, variantId, quantity) =>
        set((state) => {
          const key = identify(productId, variantId);
          if (quantity <= 0) return { items: state.items.filter((i) => identify(i.productId, i.variantId) !== key) };
          return { items: state.items.map((i) => (identify(i.productId, i.variantId) === key ? { ...i, quantity } : i)) };
        }),

      clearCart: () => set({ items: [], appliedCoupon: null }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'adsp-cart' }
  )
);
