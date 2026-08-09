import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Every hook here hits a real, customer-authenticated /storefront/* route
// (backend/src/modules/storefront) - the same `protect`-gated Authorization
// header api.js already attaches once logged in. No mocked cart/checkout
// data anywhere: an address is a real Address document, a placed order is
// a real Order (stock-checked, priced server-side), same as anything the
// admin panel itself would create.

export const useMyAddresses = () =>
  useQuery({
    queryKey: ['storefront', 'addresses'],
    queryFn: async () => (await api.get('/storefront/addresses')).data,
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
