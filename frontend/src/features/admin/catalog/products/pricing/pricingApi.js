import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const PRICING_QUERY_KEY = 'product-pricing';
const PRICE_HISTORY_QUERY_KEY = 'product-price-history';

export const useProductPricing = (productId) =>
  useQuery({
    queryKey: [PRICING_QUERY_KEY, productId],
    queryFn: async () => (await api.get(`/products/${productId}/pricing`)).data,
    enabled: Boolean(productId),
  });

export const useUpdateProductPricing = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }) => api.put(`/products/${productId}/pricing`, payload),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: [PRICING_QUERY_KEY, productId] });
      queryClient.invalidateQueries({ queryKey: [PRICE_HISTORY_QUERY_KEY, productId] });
    },
  });
};

export const useProductPriceHistory = (productId, params = {}) =>
  useQuery({
    queryKey: [PRICE_HISTORY_QUERY_KEY, productId, params],
    queryFn: async () => (await api.get(`/products/${productId}/pricing/history`, { params })).data,
    enabled: Boolean(productId),
  });
