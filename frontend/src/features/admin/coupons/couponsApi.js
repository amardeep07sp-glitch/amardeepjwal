import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'coupons';
const REDEMPTIONS_QUERY_KEY = 'coupon-redemptions';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useCoupons = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/promotions/coupons', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

// The list endpoint never populates scope/eligibility refs (just raw ids -
// fine for the table). The edit form needs real names for its
// already-selected products/customers, so it fetches the single, populated
// record via this hook instead of trusting the list row it was opened
// from - see coupon.repository.js#findByIdPopulated.
export const useCoupon = (id, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, id],
    queryFn: async () => (await api.get(`/promotions/coupons/${id}`)).data,
    enabled: Boolean(id),
    ...options,
  });

export const useCreateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/promotions/coupons', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => api.put(`/promotions/coupons/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/promotions/coupons/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};

// Section 44's scoped-down core: real redemption count + real discount
// total per coupon, not the full ROI/funnel dashboard.
export const useCouponAnalytics = (couponId, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, couponId, 'analytics'],
    queryFn: async () => (await api.get(`/promotions/coupons/${couponId}/analytics`)).data,
    enabled: Boolean(couponId),
    ...options,
  });

// The real, permanent per-order ledger (couponRedemption.model.js) -
// separate from Coupon.usageCount, which is only the hot atomic counter.
export const useCouponRedemptions = (params = {}, options = {}) =>
  useQuery({
    queryKey: [REDEMPTIONS_QUERY_KEY, params],
    queryFn: async () => (await api.get('/promotions/coupons/redemptions', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });
