import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'tax-rates';

const invalidate = (queryClient) => queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });

export const useTaxRates = (options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY],
    queryFn: async () => (await api.get('/tax-rates')).data,
    ...options,
  });

export const useCreateTaxRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/tax-rates', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useUpdateTaxRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }) => api.put(`/tax-rates/${id}`, payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useDeleteTaxRate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/tax-rates/${id}`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useTaxSummary = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, 'summary', params],
    queryFn: async () => (await api.get('/tax-rates/summary', { params })).data,
    ...options,
  });
