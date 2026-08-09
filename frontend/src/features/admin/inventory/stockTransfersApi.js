import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

const QUERY_KEY = 'stock-transfers';

const invalidate = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
  queryClient.invalidateQueries({ queryKey: ['inventory'] });
};

export const useStockTransfers = (params = {}, options = {}) =>
  useQuery({
    queryKey: [QUERY_KEY, params],
    queryFn: async () => (await api.get('/stock-transfers', { params })).data,
    placeholderData: keepPreviousData,
    ...options,
  });

export const useRequestStockTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/stock-transfers', payload),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useApproveStockTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/stock-transfers/${id}/approve`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useCompleteStockTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/stock-transfers/${id}/complete`),
    onSuccess: () => invalidate(queryClient),
  });
};

export const useCancelStockTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.patch(`/stock-transfers/${id}/cancel`),
    onSuccess: () => invalidate(queryClient),
  });
};
