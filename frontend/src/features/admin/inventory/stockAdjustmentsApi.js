import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'stock-adjustments';

const invalidate = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: ['inventory'] });
};

export const useStockAdjustments = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/stock-adjustments', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useCreateStockAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/stock-adjustments', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useApproveStockAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/stock-adjustments/${id}/approve`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useRejectStockAdjustment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/stock-adjustments/${id}/reject`),
    onSuccess: () => invalidate(queryClient),
  });
};
