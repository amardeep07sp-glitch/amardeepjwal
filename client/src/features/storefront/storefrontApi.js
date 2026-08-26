import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Every hook here hits a real, customer-authenticated /storefront/* route
// (backend/src/modules/storefront) - the same `protect`-gated Authorization
// header api.js already attaches once logged in. No mocked cart/checkout
// data anywhere: an address is a real Address document, a placed order is
// a real Order (stock-checked, priced server-side), same as anything the
// admin panel itself would create.

export const useMyAddresses = (options = {}) =>
  useQuery({
    queryKey: ['storefront', 'addresses'],
    queryFn: async () => (await api.get('/storefront/addresses')).data,
    ...options,
  });

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/storefront/addresses', payload).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storefront', 'addresses'] }),
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/storefront/addresses/${id}`, payload).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storefront', 'addresses'] }),
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/storefront/addresses/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storefront', 'addresses'] }),
  });
};

// Cart -> real Order. `items` is `[{ product, variant, quantity }]` - price
// is never sent, the server prices every line item itself from live
// product data (product.service.js's own pricing pipeline), so nothing a
// browser sends can ever change what an order actually charges.
export const useCheckout = () =>
  useMutation({
    mutationFn: (payload) => api.post('/storefront/checkout', payload).then((res) => res.data),
  });

export const useVerifyRazorpayPayment = () =>
  useMutation({
    mutationFn: (payload) => api.post('/storefront/payments/razorpay/verify', payload).then((res) => res.data),
  });

export const useMyOrders = ({ page = 1, limit = 20, orderStatus } = {}) =>
  useQuery({
    queryKey: ['storefront', 'orders', { page, limit, orderStatus }],
    queryFn: async () => (await api.get('/storefront/orders', { params: { page, limit, orderStatus } })).data,
  });

export const useMyOrder = (orderId) =>
  useQuery({
    queryKey: ['storefront', 'orders', orderId],
    queryFn: async () => (await api.get(`/storefront/orders/${orderId}`)).data,
    enabled: Boolean(orderId),
  });

// Wishlist - a real, server-persisted favorite (survives across devices),
// unlike the cart which deliberately has no backend model. Every list read
// is joined against the exact same public product-summary shape
// ProductCard already renders (wishlist.service.js#listForCustomer), so a
// wishlist tile is never a different shape from a listing tile.
export const useMyWishlist = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: ['storefront', 'wishlist'],
    queryFn: async () => (await api.get('/storefront/wishlist')).data,
    staleTime: 30_000,
    enabled,
  });

export const useAddToWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/storefront/wishlist', payload).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storefront', 'wishlist'] }),
  });
};

export const useRemoveFromWishlist = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId }) =>
      api.delete(`/storefront/wishlist/${productId}`, { params: variantId ? { variant: variantId } : undefined }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storefront', 'wishlist'] }),
  });
};

// Cart page's "Apply" preview - validates against the client-computed
// subtotal (fine for a preview; checkout() itself re-validates server-side
// against the real order subtotal before anything is actually charged).
export const useApplyCoupon = () =>
  useMutation({
    mutationFn: (payload) => api.post('/storefront/coupons/apply', payload).then((res) => res.data),
  });

// Profile - name/phone live on the auth User, dateOfBirth/gender on the
// linked CRM Customer (see storefront.service.js#getMyProfile) - merged
// into one flat shape here since the storefront never needs to know
// they're two different collections.
export const useMyProfile = () =>
  useQuery({
    queryKey: ['storefront', 'profile'],
    queryFn: async () => (await api.get('/storefront/profile')).data,
  });

export const useUpdateMyProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put('/storefront/profile', payload).then((res) => res.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['storefront', 'profile'] }),
  });
};

// Wallet / Loyalty / Referral - real balances/history, read-only (see
// storefront.service.js's header comment on why no spend/redeem action
// exists yet - there's no real conversion-rate rule configured anywhere).
export const useMyWallet = () =>
  useQuery({ queryKey: ['storefront', 'wallet'], queryFn: async () => (await api.get('/storefront/wallet')).data });

export const useMyWalletLedger = ({ page = 1, limit = 20 } = {}) =>
  useQuery({
    queryKey: ['storefront', 'wallet', 'ledger', { page, limit }],
    queryFn: async () => (await api.get('/storefront/wallet/ledger', { params: { page, limit } })).data,
  });

export const useMyLoyalty = () =>
  useQuery({ queryKey: ['storefront', 'loyalty'], queryFn: async () => (await api.get('/storefront/loyalty')).data });

export const useMyLoyaltyLedger = ({ page = 1, limit = 20 } = {}) =>
  useQuery({
    queryKey: ['storefront', 'loyalty', 'ledger', { page, limit }],
    queryFn: async () => (await api.get('/storefront/loyalty/ledger', { params: { page, limit } })).data,
  });

export const useMyReferrals = () =>
  useQuery({ queryKey: ['storefront', 'referrals'], queryFn: async () => (await api.get('/storefront/referrals')).data });

// Self-service return request - reuses the exact same real
// orderReturnService the admin panel's own return workflow runs on (see
// storefront.service.js#requestMyReturn).
export const useMyReturns = (orderId) =>
  useQuery({
    queryKey: ['storefront', 'orders', orderId, 'returns'],
    queryFn: async () => (await api.get(`/storefront/orders/${orderId}/returns`)).data,
    enabled: Boolean(orderId),
  });

export const useRequestReturn = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }) => api.post(`/storefront/orders/${orderId}/returns`, payload).then((res) => res.data),
    onSuccess: (_data, { orderId }) => queryClient.invalidateQueries({ queryKey: ['storefront', 'orders', orderId, 'returns'] }),
  });
};

// Reviews - one review per product per customer; submitting again edits
// the same row and sends it back through moderation (review.service.js's
// real rule, not a client-side assumption).
export const useMyReview = (productId) =>
  useQuery({
    queryKey: ['storefront', 'products', productId, 'my-review'],
    queryFn: async () => (await api.get(`/storefront/products/${productId}/review`)).data,
    enabled: Boolean(productId),
  });

export const useSubmitReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }) => api.post(`/storefront/products/${productId}/review`, payload).then((res) => res.data),
    // Broad prefix invalidation (not keyed by slug, which this hook never
    // sees) - the public review list is keyed by slug in reviewsApi.js, so
    // this refetches every cached product's review list rather than one.
    // Harmless (a few extra refetches), and simpler than plumbing a slug
    // through just for cache-key matching.
    onSuccess: (_data, { productId }) => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'products', productId, 'my-review'] });
      queryClient.invalidateQueries({ queryKey: ['storefront', 'products', 'reviews'] });
    },
  });
};

export const useDeleteMyReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId) => api.delete(`/storefront/products/${productId}/review`),
    onSuccess: (_data, productId) => {
      queryClient.invalidateQueries({ queryKey: ['storefront', 'products', productId, 'my-review'] });
      queryClient.invalidateQueries({ queryKey: ['storefront', 'products', 'reviews'] });
    },
  });
};

// Report a review (Phase 18) - goes straight to Review Moderation on the
// backend, deliberately NOT routed through the general issue-reporting
// pipeline the rest of the "Report a problem" buttons use.
export const useReportReview = () =>
  useMutation({
    mutationFn: ({ reviewId, payload }) => api.post(`/storefront/reviews/${reviewId}/report`, payload).then((res) => res.data),
  });

// Guest order tracking - the one unauthenticated storefront mutation;
// deliberately not a query (a "wrong number" attempt should never get
// silently cached/retried the way a query would).
export const useTrackOrder = () =>
  useMutation({
    mutationFn: (payload) => api.post('/storefront/track-order', payload).then((res) => res.data),
  });
